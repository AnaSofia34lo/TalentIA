import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  ExtractedResume,
  ResumeDocumentInput,
  ResumeParserPort,
} from '../../application/ports/resume-parser.port.js';

export class InvalidResumeParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidResumeParseError';
  }
}

const RESUME_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    workExperience: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          company: { type: Type.STRING, nullable: true },
          role: { type: Type.STRING, nullable: true },
          startDate: { type: Type.STRING, nullable: true },
          endDate: { type: Type.STRING, nullable: true },
          description: { type: Type.STRING, nullable: true },
          sourceEvidence: { type: Type.STRING },
        },
        required: ['company', 'role', 'startDate', 'endDate', 'description', 'sourceEvidence'],
      },
    },
    certifications: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, nullable: true },
          issuer: { type: Type.STRING, nullable: true },
          date: { type: Type.STRING, nullable: true },
          sourceEvidence: { type: Type.STRING },
        },
        required: ['name', 'issuer', 'date', 'sourceEvidence'],
      },
    },
    technicalSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, nullable: true },
          estimatedProficiency: { type: Type.INTEGER, nullable: true },
          sourceEvidence: { type: Type.STRING },
        },
        required: ['name', 'estimatedProficiency', 'sourceEvidence'],
      },
    },
  },
  required: ['workExperience', 'certifications', 'technicalSkills'],
};

@Injectable()
export class GeminiResumeParserAdapter implements ResumeParserPort {
  private readonly logger = new Logger(GeminiResumeParserAdapter.name);
  private readonly maxRetries = 3;
  private readonly baseDelayMs = 1000;

  async parse(
    resumeText: string,
    document?: ResumeDocumentInput,
  ): Promise<ExtractedResume> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InvalidResumeParseError(
        'GEMINI_API_KEY no está configurada; no se puede analizar el CV.',
      );
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      'Eres un extractor cuidadoso de datos de hojas de vida. Devuelve únicamente JSON válido que cumpla el schema.',
      'Usa el PDF adjunto como fuente principal. El texto extraído por software es una ayuda y puede haber perdido el orden de columnas, tablas o fechas.',
      'Lee visualmente cada página en orden. No mezcles datos de columnas distintas ni asignes una fecha o empresa a una experiencia cercana si el diseño no lo confirma.',
      'Conserva el idioma original de los datos. No traduzcas nombres de cargos, empresas, certificaciones ni habilidades.',
      'No inventes, completes ni infieras datos. Usa null si un campo no está explícito y arreglos vacíos si no hay registros.',
      'Incluye solo empleos reales en workExperience; no conviertas estudios, proyectos, voluntariado o cursos en empleos.',
      'Incluye en certifications solo certificaciones o cursos que el documento identifique como completados; no confundas estudios formales con certificaciones.',
      'Incluye en technicalSkills únicamente habilidades técnicas nombradas explícitamente. No infieras habilidades por el cargo, la empresa o una descripción genérica.',
      'estimatedProficiency debe ser null salvo que el CV indique explícitamente nivel, dominio o experiencia cuantificable para esa habilidad. No califiques por intuición.',
      'Normaliza fechas completas a YYYY-MM, fechas con solo año a YYYY, y empleo actual a "Actual". Si no se puede determinar, usa null.',
      'Evita duplicar una experiencia, certificación o habilidad aunque aparezca repetida en el resumen y en otra sección.',
      'sourceEvidence debe ser una cita breve y literal del CV que respalde cada registro. Si no puedes citar evidencia, no incluyas ese registro.',
      'Si el documento contradice el texto extraído, confía en lo que se ve en el PDF. No confundas datos de contacto con experiencia laboral.',
      '',
      'Texto extraído del PDF (puede estar incompleto o desordenado):',
      resumeText.slice(0, 60_000) || '[No se pudo extraer texto digital; analiza visualmente el PDF adjunto.]',
    ].join('\n');

    const parts: Array<
      | { text: string }
      | { fileData: { mimeType: string; fileUri: string } }
    > = [];
    let uploadedFile: Awaited<ReturnType<typeof ai.files.upload>> | null = null;
    let rawText: string | undefined;

    try {
      if (document) {
        const documentBuffer = Buffer.from(document.base64, 'base64');
        uploadedFile = await ai.files.upload({
          file: new Blob([new Uint8Array(documentBuffer)], {
            type: document.mimeType,
          }),
          config: {
            mimeType: document.mimeType,
            displayName: 'hoja-de-vida.pdf',
          },
        });
        let readyFile = uploadedFile;
        const processingDeadline = Date.now() + 3 * 60 * 1000;
        while (
          readyFile.state === 'PROCESSING' &&
          Date.now() < processingDeadline
        ) {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          readyFile = await ai.files.get({ name: uploadedFile.name! });
        }
        if (readyFile.state !== 'ACTIVE' || !readyFile.uri) {
          throw new InvalidResumeParseError(
            'Gemini no pudo preparar el PDF para analizarlo. Intenta nuevamente.',
          );
        }
        parts.push({
          fileData: {
            mimeType: document.mimeType,
            fileUri: readyFile.uri,
          },
        });
      }
      parts.push({ text: prompt });

      for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: [{ role: 'user', parts }],
            config: {
              responseMimeType: 'application/json',
              responseSchema: RESUME_SCHEMA,
              temperature: 0.1,
            },
          });
          rawText = response.text;
          if (rawText?.trim()) {
            break;
          }
        } catch (error) {
          const isTransient = this.isTransientError(error);
          if (isTransient && attempt < this.maxRetries) {
            const delay = Math.min(
              this.baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
              8000,
            );
            this.logger.warn(
              `Gemini experiment?? un error transitorio o alta demanda (intento ${attempt + 1}/${this.maxRetries + 1}): ${String(error)}. Reintentando en ${Math.round(delay)}ms...`,
            );
            await this.sleep(delay);
            continue;
          }

          this.logger.error(
            `Gemini fall?? tras ${attempt + 1} intento(s): ${String(error)}`,
          );
          throw new InvalidResumeParseError(
            'La IA no pudo procesar el CV. Intenta de nuevo m??s tarde.',
          );
        }
      }
    } finally {
      if (uploadedFile?.name) {
        await ai.files
          .delete({ name: uploadedFile.name })
          .catch((error: unknown) => {
            this.logger.warn(
              `No se pudo borrar el PDF temporal de Gemini: ${String(error)}`,
            );
          });
      }
    }

    if (!rawText?.trim()) {
      throw new InvalidResumeParseError('La IA devolvió una respuesta vacía.');
    }

    return this.normalize(rawText, true);
  }

  isTransientError(error: unknown): boolean {
    if (!error) return false;
    const str = String(error);
    const errObj =
      typeof error === 'object' && error !== null
        ? (error as Record<string, unknown>)
        : {};
    const nestedErr =
      errObj.error && typeof errObj.error === 'object'
        ? (errObj.error as Record<string, unknown>)
        : null;

    const code = String(errObj.code || errObj.status || nestedErr?.code || '');
    const status = String(errObj.status || nestedErr?.status || '');

    const transientCodes = [
      '503',
      '429',
      '500',
      '502',
      '504',
      'UNAVAILABLE',
      'RESOURCE_EXHAUSTED',
      'DEADLINE_EXCEEDED',
    ];

    if (transientCodes.includes(code) || transientCodes.includes(status)) {
      return true;
    }

    return /503|429|500|502|504|UNAVAILABLE|high demand|temporarily unavailable|spikes in demand|resource_exhausted|rate limit|too many requests|overloaded|deadline exceeded|timeout|econnreset|etimedout|fetch failed/i.test(
      str,
    );
  }

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  normalize(rawJson: string, requireEvidence = false): ExtractedResume {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawJson);
    } catch {
      const cleaned = rawJson
        .replace(/^```(?:json)?\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
      try {
        parsed = JSON.parse(cleaned);
      } catch {
        throw new InvalidResumeParseError(
          'La respuesta de la IA no es JSON válido.',
        );
      }
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new InvalidResumeParseError('La respuesta de la IA tiene forma inválida.');
    }

    const body = parsed as Record<string, unknown>;
    const workExperience = Array.isArray(body.workExperience)
      ? body.workExperience
          .filter((item) => !requireEvidence || this.hasEvidence(item))
          .map((item) => this.asWorkExperience(item))
      : [];
    const certifications = Array.isArray(body.certifications)
      ? body.certifications
          .filter((item) => !requireEvidence || this.hasEvidence(item))
          .map((item) => this.asCertification(item))
      : [];
    const technicalSkills = Array.isArray(body.technicalSkills)
      ? body.technicalSkills
          .filter((item) => !requireEvidence || this.hasEvidence(item))
          .map((item) => this.asSkill(item))
      : [];

    return {
      workExperience: this.deduplicate(
        workExperience,
        (item) => [item.company, item.role, item.startDate, item.endDate].join('|'),
      ),
      certifications: this.deduplicate(
        certifications,
        (item) => [item.name, item.issuer, item.date].join('|'),
      ),
      technicalSkills: this.deduplicate(
        technicalSkills,
        (item) => item.name ?? '',
      ).filter((item) => item.name !== null),
    };
  }

  private hasEvidence(item: unknown): boolean {
    if (!item || typeof item !== 'object') return false;
    const evidence = (item as Record<string, unknown>).sourceEvidence;
    return typeof evidence === 'string' && evidence.trim().length >= 3;
  }

  private deduplicate<T>(items: T[], getKey: (item: T) => string): T[] {
    const seen = new Set<string>();
    return items.filter((item) => {
      const key = getKey(item)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase('es-CO')
        .replace(/\s+/g, ' ')
        .trim();
      if (!key.replace(/[|\s]/g, '')) return true;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private asWorkExperience(item: unknown) {
    const row = (item && typeof item === 'object' ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      company: this.asNullableString(row.company),
      role: this.asNullableString(row.role),
      startDate: this.asNullableString(row.startDate),
      endDate: this.asNullableString(row.endDate),
      description: this.asNullableString(row.description),
    };
  }

  private asCertification(item: unknown) {
    const row = (item && typeof item === 'object' ? item : {}) as Record<
      string,
      unknown
    >;
    return {
      name: this.asNullableString(row.name),
      issuer: this.asNullableString(row.issuer),
      date: this.asNullableString(row.date),
    };
  }

  private asSkill(item: unknown) {
    const row = (item && typeof item === 'object' ? item : {}) as Record<
      string,
      unknown
    >;
    const proficiency = row.estimatedProficiency;
    return {
      name: this.asNullableString(row.name),
      estimatedProficiency:
        typeof proficiency === 'number' && Number.isFinite(proficiency)
          ? proficiency
          : null,
    };
  }

  private asNullableString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    if (!trimmed || trimmed.toLowerCase() === 'null') return null;
    return trimmed;
  }
}
