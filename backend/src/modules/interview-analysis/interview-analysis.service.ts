import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service.js';
import { INTERVIEW_ANALYSIS_COMPLETED_EVENT } from './domain/interview-analysis-completed.event.js';

const ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    technicalScore: { type: Type.NUMBER },
    behavioralScore: { type: Type.NUMBER },
    overallScore: { type: Type.NUMBER },
    technicalSummary: { type: Type.STRING },
    behavioralSummary: { type: Type.STRING },
    strengths: { type: Type.ARRAY, items: { type: Type.STRING }, maxItems: 5 },
    improvements: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      maxItems: 5,
    },
    recommendation: { type: Type.STRING },
  },
  required: [
    'technicalScore',
    'behavioralScore',
    'overallScore',
    'technicalSummary',
    'behavioralSummary',
    'strengths',
    'improvements',
    'recommendation',
  ],
};

type AnalysisResult = {
  technicalScore: number;
  behavioralScore: number;
  overallScore: number;
  technicalSummary: string;
  behavioralSummary: string;
  strengths: string[];
  improvements: string[];
  recommendation: string;
};

@Injectable()
export class InterviewAnalysisService {
  private readonly logger = new Logger(InterviewAnalysisService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /** Match IA = promedio de puntaje t?cnico y de habilidades blandas (0-100). */
  static computeOverallScore(
    technicalScore: number,
    behavioralScore: number,
  ): number {
    return Math.round((technicalScore + behavioralScore) / 2);
  }

  async analyzeApplication(applicationId: string, force = false) {
    const application = await this.loadApplication(applicationId);
    const technical = this.pickCompletedInterview(
      application.interviews,
      'technical',
    );
    const behavioral = this.pickCompletedInterview(
      application.interviews,
      'behavioral',
    );

    if (!technical) {
      throw new BadRequestException(
        'La entrevista tecnica debe estar finalizada antes del analisis.',
      );
    }
    if (!behavioral || !behavioral.videoUrl) {
      throw new BadRequestException(
        'La entrevista de habilidades blandas con video debe estar finalizada antes del analisis.',
      );
    }

    const current = application.interviewAnalysis;
    if (current?.status === 'completed' && !force) {
      return this.serialize(current, application);
    }

    await this.prisma.interviewAnalysis.upsert({
      where: { applicationId },
      create: {
        applicationId,
        technicalInterviewId: technical.id,
        behavioralInterviewId: behavioral.id,
        status: 'processing',
      },
      update: {
        technicalInterviewId: technical.id,
        behavioralInterviewId: behavioral.id,
        status: 'processing',
        failureReason: null,
      },
    });

    try {
      const result = await this.requestAiAnalysis(
        application,
        technical,
        behavioral,
      );
      const analysis = await this.prisma.$transaction(async (tx) => {
        await tx.evaluation.deleteMany({
          where: {
            applicationId,
            reviewerId: null,
            type: { in: ['technical', 'behavioral'] },
          },
        });
        await tx.evaluation.createMany({
          data: [
            {
              applicationId,
              interviewId: technical.id,
              type: 'technical',
              score: result.technicalScore,
              summary: result.technicalSummary,
            },
            {
              applicationId,
              interviewId: behavioral.id,
              type: 'behavioral',
              score: result.behavioralScore,
              summary: result.behavioralSummary,
            },
          ],
        });
        await tx.candidateApplication.update({
          where: { id: applicationId },
          data: {
            status: 'reviewed',
            reviewedAt: new Date(),
            matchScore: result.overallScore,
          },
        });
        return tx.interviewAnalysis.update({
          where: { applicationId },
          data: {
            ...result,
            status: 'completed',
            failureReason: null,
            analyzedAt: new Date(),
          },
        });
      });

      this.eventEmitter.emit(INTERVIEW_ANALYSIS_COMPLETED_EVENT, {
        applicationId,
        overallScore: result.overallScore,
      });

      return this.serialize(analysis, application);
    } catch (error) {
      const message = this.toUserFacingAnalysisError(error);
      await this.prisma.interviewAnalysis.update({
        where: { applicationId },
        data: { status: 'failed', failureReason: message },
      });
      this.logger.error(
        `Fallo el analisis de la postulacion ${applicationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new BadRequestException(message);
    }
  }

  async analyzeForCandidate(
    candidateId: string,
    applicationId: string,
    force = false,
  ) {
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, candidateId },
      select: { id: true },
    });
    if (!application) {
      throw new NotFoundException(
        'La postulacion no existe o no pertenece al candidato.',
      );
    }
    return this.analyzeApplication(application.id, force);
  }

  async getCandidateAnalyses(candidateId: string) {
    const analyses = await this.prisma.interviewAnalysis.findMany({
      where: { application: { candidateId } },
      include: {
        application: {
          include: {
            vacancy: { include: { organization: { select: { name: true } } } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });
    return analyses.map((analysis) =>
      this.serialize(analysis, analysis.application),
    );
  }

  async getCandidateAnalysis(candidateId: string, applicationId: string) {
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, candidateId },
      include: {
        vacancy: { include: { organization: { select: { name: true } } } },
        interviewAnalysis: true,
        interviews: {
          select: { type: true, status: true, videoUrl: true },
        },
      },
    });
    if (!application) {
      throw new NotFoundException(
        'La postulacion no existe o no pertenece al candidato.',
      );
    }

    if (!application.interviewAnalysis) {
      const technicalReady = application.interviews.some(
        (interview) =>
          interview.type === 'technical' && interview.status === 'completed',
      );
      const behavioralReady = application.interviews.some(
        (interview) =>
          interview.type === 'behavioral' &&
          interview.status === 'completed' &&
          Boolean(interview.videoUrl),
      );
      return {
        id: application.id,
        application: {
          id: application.id,
          vacancy: {
            title: application.vacancy.title,
            organization: application.vacancy.organization.name,
          },
        },
        status: technicalReady && behavioralReady ? 'ready_to_analyze' : 'not_available',
        technicalScore: null,
        behavioralScore: null,
        overallScore: null,
        technicalSummary: null,
        behavioralSummary: null,
        strengths: [],
        improvements: [],
        recommendation: null,
        failureReason: null,
        analyzedAt: null,
        interviewsReady: technicalReady && behavioralReady,
      };
    }

    return {
      ...this.serialize(application.interviewAnalysis, application),
      interviewsReady: true,
    };
  }

  async getRecruiterAnalysis(recruiterId: string, applicationId: string) {
    const recruiter = await this.prisma.user.findUnique({
      where: { id: recruiterId },
      select: { organizationId: true },
    });
    if (!recruiter?.organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organizacion asociada.',
      );
    }
    const analysis = await this.prisma.interviewAnalysis.findFirst({
      where: {
        applicationId,
        application: { organizationId: recruiter.organizationId },
      },
      include: {
        application: {
          include: {
            vacancy: { include: { organization: { select: { name: true } } } },
            candidate: { select: { fullName: true, email: true } },
          },
        },
      },
    });
    if (!analysis) {
      throw new NotFoundException(
        'No existe un analisis para esta postulacion.',
      );
    }
    return this.serialize(analysis, analysis.application);
  }

  async analyzeForRecruiter(
    recruiterId: string,
    applicationId: string,
    force = false,
  ) {
    const recruiter = await this.prisma.user.findUnique({
      where: { id: recruiterId },
      select: { organizationId: true },
    });
    if (!recruiter?.organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organizacion asociada.',
      );
    }
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, organizationId: recruiter.organizationId },
      select: { id: true },
    });
    if (!application) {
      throw new NotFoundException(
        'La postulacion no pertenece a tu organizacion.',
      );
    }
    return this.analyzeApplication(application.id, force);
  }

  async analyzeForCompletion(applicationId: string) {
    try {
      const interviews = await this.prisma.interview.findMany({
        where: { applicationId },
        select: { type: true, status: true, videoUrl: true },
      });
      const technicalReady = interviews.some(
        (interview) =>
          interview.type === 'technical' && interview.status === 'completed',
      );
      const behavioralReady = interviews.some(
        (interview) =>
          interview.type === 'behavioral' &&
          interview.status === 'completed' &&
          Boolean(interview.videoUrl),
      );
      if (!technicalReady || !behavioralReady) {
        this.logger.log(
          `Analisis diferido para ${applicationId}: faltan entrevistas completas.`,
        );
        return;
      }
      await this.analyzeApplication(applicationId);
    } catch (error) {
      this.logger.warn(
        `El analisis automatico quedo pendiente para ${applicationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  private pickCompletedInterview<
    T extends { type: string; status: string; createdAt?: Date | string },
  >(interviews: T[], type: 'technical' | 'behavioral'): T | undefined {
    const completed = interviews.filter(
      (interview) =>
        interview.type === type && interview.status === 'completed',
    );
    if (completed.length === 0) {
      return undefined;
    }
    return completed.sort((left, right) => {
      const leftTime = new Date(left.createdAt ?? 0).getTime();
      const rightTime = new Date(right.createdAt ?? 0).getTime();
      return rightTime - leftTime;
    })[0];
  }

  private async loadApplication(applicationId: string) {
    const application = await this.prisma.candidateApplication.findUnique({
      where: { id: applicationId },
      include: {
        vacancy: {
          include: {
            organization: { select: { name: true } },
            skills: { select: { name: true, weight: true } },
          },
        },
        interviews: {
          include: {
            questions: {
              orderBy: { createdAt: 'asc' },
              include: {
                answers: {
                  select: { responseText: true },
                  orderBy: { createdAt: 'desc' },
                  take: 1,
                },
              },
            },
            videoMarkers: {
              orderBy: { timestampMs: 'asc' },
              include: {
                question: { select: { prompt: true } },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        interviewAnalysis: true,
      },
    });
    if (!application) {
      throw new NotFoundException('La postulacion no existe.');
    }
    return application;
  }

  private async requestAiAnalysis(
    application: Awaited<
      ReturnType<InterviewAnalysisService['loadApplication']>
    >,
    technical: {
      questions: Array<{
        prompt: string;
        answers: Array<{ responseText: string | null }>;
      }>;
    },
    behavioral: {
      videoUrl: string | null;
      videoMarkers: Array<{
        timestampMs: number;
        question: { prompt: string };
      }>;
    },
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no esta configurada.');
    }
    if (!behavioral.videoUrl) {
      throw new Error('La entrevista conductual no tiene video asociado.');
    }

    const video = await this.downloadVideo(behavioral.videoUrl);
    const ai = new GoogleGenAI({ apiKey });
    const context = {
      vacancy: {
        title: application.vacancy.title,
        description: application.vacancy.description,
        requirements: application.vacancy.requirements,
        technicalSkills: application.vacancy.skills,
      },
      technicalInterview: technical.questions.map((question) => ({
        question: question.prompt,
        response: question.answers[0]?.responseText ?? '',
      })),
      behavioralQuestionMarkers: behavioral.videoMarkers.map((marker) => ({
        question: marker.question.prompt,
        timestampMs: marker.timestampMs,
      })),
    };

    const promptParts = [
      {
        role: 'user' as const,
        parts: [
          {
            text: [
              'Eres un evaluador de seleccion humana. Analiza con evidencia las respuestas tecnicas y el video de entrevista conductual frente a la vacante.',
              'No infieras atributos sensibles. Evalua unicamente contenido, competencias comunicativas observables y relacion con los requisitos.',
              'Los puntajes technicalScore y behavioralScore son numeros entre 0 y 100.',
              'Las fortalezas y mejoras deben ser frases breves, respetuosas y accionables.',
              'Devuelve unicamente el JSON solicitado.',
              JSON.stringify(context),
            ].join('\n'),
          },
          { inlineData: { mimeType: video.mimeType, data: video.base64 } },
        ],
      },
    ];

    const response = await this.generateContentWithRetry(ai, promptParts);
    return this.normalize(response.text ?? '');
  }

  private async generateContentWithRetry(
    ai: GoogleGenAI,
    contents: Array<{
      role: 'user';
      parts: Array<
        | { text: string }
        | { inlineData: { mimeType: string; data: string } }
      >;
    }>,
  ) {
    const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        return await ai.models.generateContent({
          model,
          contents,
          config: {
            responseMimeType: 'application/json',
            responseSchema: ANALYSIS_SCHEMA,
            temperature: 0.2,
          },
        });
      } catch (error) {
        lastError = error;
        if (!this.isTransientAiError(error) || attempt === maxAttempts) {
          throw error;
        }
        const waitMs = attempt * 2500;
        this.logger.warn(
          `Gemini temporalmente no disponible (intento ${attempt}/${maxAttempts}). Reintento en ${waitMs}ms.`,
        );
        await new Promise((resolve) => setTimeout(resolve, waitMs));
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('No se pudo completar el analisis con Gemini.');
  }

  private isTransientAiError(error: unknown): boolean {
    const raw =
      error instanceof Error
        ? `${error.message} ${error.stack ?? ''}`
        : String(error);
    return (
      raw.includes('503') ||
      raw.includes('UNAVAILABLE') ||
      raw.includes('high demand') ||
      raw.includes('RESOURCE_EXHAUSTED') ||
      raw.includes('429')
    );
  }

  private toUserFacingAnalysisError(error: unknown): string {
    if (this.isTransientAiError(error)) {
      return 'El servicio de IA esta saturado en este momento. Espera unos segundos y pulsa "Calcular Match IA" otra vez.';
    }
    if (error instanceof Error && error.message.trim()) {
      if (error.message.includes('{') || error.message.includes('"error"')) {
        return 'No fue posible analizar las entrevistas con IA. Intenta nuevamente en unos segundos.';
      }
      return error.message;
    }
    return 'No fue posible analizar las entrevistas con IA. Intenta nuevamente mas tarde.';
  }

  private async downloadVideo(storagePath: string) {
    const maxBytes = Number(process.env.MAX_AI_VIDEO_BYTES ?? 20 * 1024 * 1024);
    const bucket = this.supabase.getBucketName('video');
    const path = this.resolveStoragePath(storagePath);
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .download(path);
    if (error || !data) {
      throw new Error(
        `No se pudo obtener el video: ${error?.message ?? 'archivo no encontrado'}`,
      );
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error(
        `El video supera el limite de analisis de ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
      );
    }
    return {
      base64: buffer.toString('base64'),
      mimeType: data.type || 'video/webm',
    };
  }

  private resolveStoragePath(videoUrl: string): string {
    if (!videoUrl.includes('://')) {
      return videoUrl.replace(/^\/+/, '');
    }
    try {
      const url = new URL(videoUrl);
      const marker = '/object/public/';
      const index = url.pathname.indexOf(marker);
      if (index >= 0) {
        const rest = url.pathname.slice(index + marker.length);
        const slash = rest.indexOf('/');
        return slash >= 0 ? decodeURIComponent(rest.slice(slash + 1)) : rest;
      }
    } catch {
      // keep original path
    }
    return videoUrl;
  }

  private normalize(raw: string): AnalysisResult {
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error('La IA devolvio un resultado de analisis invalido.');
    }
    const data = value as Record<string, unknown>;
    const score = (key: string) => {
      const numeric = Number(data[key]);
      if (!Number.isFinite(numeric)) {
        throw new Error(`La IA no entrego ${key}.`);
      }
      return Math.max(0, Math.min(100, numeric));
    };
    const text = (key: string) => {
      if (typeof data[key] === 'string' && data[key].trim()) {
        return data[key].trim();
      }
      throw new Error(`La IA no entrego ${key}.`);
    };
    const list = (key: string) =>
      Array.isArray(data[key])
        ? data[key]
            .filter(
              (item): item is string =>
                typeof item === 'string' && Boolean(item.trim()),
            )
            .slice(0, 5)
        : [];

    const technicalScore = score('technicalScore');
    const behavioralScore = score('behavioralScore');

    return {
      technicalScore,
      behavioralScore,
      overallScore: InterviewAnalysisService.computeOverallScore(
        technicalScore,
        behavioralScore,
      ),
      technicalSummary: text('technicalSummary'),
      behavioralSummary: text('behavioralSummary'),
      strengths: list('strengths'),
      improvements: list('improvements'),
      recommendation: text('recommendation'),
    };
  }

  private serialize(analysis: Record<string, unknown>, application: {
    id: string;
    vacancy: { title: string; organization: { name: string } };
    candidate?: { fullName: string; email: string | null };
  }) {
    return {
      id: analysis.id,
      status: analysis.status,
      technicalScore: analysis.technicalScore,
      behavioralScore: analysis.behavioralScore,
      overallScore: analysis.overallScore,
      technicalSummary: analysis.technicalSummary,
      behavioralSummary: analysis.behavioralSummary,
      strengths: Array.isArray(analysis.strengths) ? analysis.strengths : [],
      improvements: Array.isArray(analysis.improvements)
        ? analysis.improvements
        : [],
      recommendation: analysis.recommendation,
      failureReason:
        analysis.status === 'failed' ? analysis.failureReason : null,
      analyzedAt: analysis.analyzedAt,
      application: {
        id: application.id,
        vacancy: {
          title: application.vacancy.title,
          organization: application.vacancy.organization.name,
        },
        candidate: application.candidate
          ? {
              fullName: application.candidate.fullName,
              email: application.candidate.email,
            }
          : undefined,
      },
    };
  }
}
