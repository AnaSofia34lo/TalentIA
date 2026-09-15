import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import {
  ExtractedResume,
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
        },
        required: ['company', 'role', 'startDate', 'endDate', 'description'],
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
        },
        required: ['name', 'issuer', 'date'],
      },
    },
    technicalSkills: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, nullable: true },
          estimatedProficiency: { type: Type.INTEGER, nullable: true },
        },
        required: ['name', 'estimatedProficiency'],
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

  async parse(resumeText: string): Promise<ExtractedResume> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new InvalidResumeParseError(
        'GEMINI_API_KEY no está configurada; no se puede analizar el CV.',
      );
    }

    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const ai = new GoogleGenAI({ apiKey });

    const prompt = [
      'Eres un extractor de datos de hojas de vida (CVs).',
      'Devuelve SOLO JSON válido según el schema.',
      'Reglas estrictas:',
      '- No inventes datos que no aparezcan explícitamente en el texto.',
      '- Si un campo no aparece, usa null.',
      '- Si no hay experiencia, certificaciones o skills, usa arreglos vacíos.',
      '- estimatedProficiency es un entero 0-100 estimado solo si el CV da indicios; si no, null.',
      '- Fechas en formato libre corto (ej. "2021-03", "Mar 2021", "Actual").',
      '',
      'Texto del CV:',
      resumeText.slice(0, 120_000),
    ].join('\n');

    let rawText: string | undefined;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
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
            `Gemini experimentó un error transitorio o alta demanda (intento ${attempt + 1}/${this.maxRetries + 1}): ${String(error)}. Reintentando en ${Math.round(delay)}ms...`,
          );
          await this.sleep(delay);
          continue;
        }

        this.logger.error(
          `Gemini falló tras ${attempt + 1} intento(s): ${String(error)}`,
        );
        throw new InvalidResumeParseError(
          'La IA no pudo procesar el CV. Intenta de nuevo más tarde.',
        );
      }
    }

    if (!rawText?.trim()) {
      throw new InvalidResumeParseError('La IA devolvió una respuesta vacía.');
    }

    return this.normalize(rawText);
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

  normalize(rawJson: string): ExtractedResume {
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
    return {
      workExperience: Array.isArray(body.workExperience)
        ? body.workExperience.map((item) => this.asWorkExperience(item))
        : [],
      certifications: Array.isArray(body.certifications)
        ? body.certifications.map((item) => this.asCertification(item))
        : [],
      technicalSkills: Array.isArray(body.technicalSkills)
        ? body.technicalSkills.map((item) => this.asSkill(item))
        : [],
    };
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
