import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service.js';

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
  ) {}

  async analyzeApplication(applicationId: string, force = false) {
    const application = await this.loadApplication(applicationId);
    const technical = application.interviews.find(
      (interview) => interview.type === 'technical',
    );
    const behavioral = application.interviews.find(
      (interview) => interview.type === 'behavioral',
    );
    if (!technical || technical.status !== 'completed') {
      throw new BadRequestException(
        'La entrevista técnica debe estar finalizada antes del análisis.',
      );
    }
    if (
      !behavioral ||
      behavioral.status !== 'completed' ||
      !behavioral.videoUrl
    ) {
      throw new BadRequestException(
        'La entrevista de habilidades blandas con video debe estar finalizada antes del análisis.',
      );
    }

    const current = application.interviewAnalysis;
    if (current?.status === 'completed' && !force)
      return this.serialize(current, application);

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
          data: { status: 'reviewed', reviewedAt: new Date() },
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
      return this.serialize(analysis, application);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'No se pudo completar el análisis de IA.';
      await this.prisma.interviewAnalysis.update({
        where: { applicationId },
        data: { status: 'failed', failureReason: message },
      });
      this.logger.error(
        `Falló el análisis de la postulación ${applicationId}: ${message}`,
      );
      throw new BadRequestException(
        'No fue posible analizar las entrevistas con IA. Intenta nuevamente más tarde.',
      );
    }
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
      },
    });
    if (!application)
      throw new NotFoundException(
        'La postulación no existe o no pertenece al candidato.',
      );

    if (!application.interviewAnalysis) {
      return {
        id: application.id,
        application: {
          id: application.id,
          vacancy: {
            title: application.vacancy.title,
            organization: application.vacancy.organization.name,
          },
        },
        status: 'not_available',
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
      };
    }

    return this.serialize(application.interviewAnalysis, application);
  }

  async getRecruiterAnalysis(recruiterId: string, applicationId: string) {
    const recruiter = await this.prisma.user.findUnique({
      where: { id: recruiterId },
      select: { organizationId: true },
    });
    if (!recruiter?.organizationId)
      throw new NotFoundException(
        'El recruiter no tiene una organización asociada.',
      );
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
    if (!analysis)
      throw new NotFoundException(
        'No existe un análisis para esta postulación.',
      );
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
    if (!recruiter?.organizationId)
      throw new NotFoundException(
        'El recruiter no tiene una organización asociada.',
      );
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, organizationId: recruiter.organizationId },
      select: { id: true },
    });
    if (!application)
      throw new NotFoundException(
        'La postulación no pertenece a tu organización.',
      );
    return this.analyzeApplication(application.id, force);
  }

  async analyzeForCompletion(applicationId: string) {
    try {
      await this.analyzeApplication(applicationId);
    } catch (error) {
      this.logger.warn(
        `El análisis automático quedó pendiente para ${applicationId}: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
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
              include: { answers: { select: { responseText: true } } },
            },
            videoMarkers: {
              include: {
                question: { select: { prompt: true } },
                orderBy: { timestampMs: 'asc' },
              },
            },
          },
          orderBy: { createdAt: 'asc' },
        },
        interviewAnalysis: true,
      },
    });
    if (!application) throw new NotFoundException('La postulación no existe.');
    return application;
  }

  private async requestAiAnalysis(
    application: Awaited<
      ReturnType<InterviewAnalysisService['loadApplication']>
    >,
    technical: any,
    behavioral: any,
  ): Promise<AnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY no está configurada.');
    const video = await this.downloadVideo(behavioral.videoUrl);
    const ai = new GoogleGenAI({ apiKey });
    const context = {
      vacancy: {
        title: application.vacancy.title,
        description: application.vacancy.description,
        requirements: application.vacancy.requirements,
        technicalSkills: application.vacancy.skills,
      },
      technicalInterview: technical.questions.map((question: any) => ({
        question: question.prompt,
        response: question.answers[0]?.responseText ?? '',
      })),
      behavioralQuestionMarkers: behavioral.videoMarkers.map((marker: any) => ({
        question: marker.question.prompt,
        timestampMs: marker.timestampMs,
      })),
    };
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: [
                'Eres un evaluador de selección humana. Analiza con evidencia las respuestas técnicas y el video de entrevista conductual frente a la vacante.',
                'No infieras atributos sensibles, identidad, edad, origen, discapacidad, género u otras características protegidas. Evalúa únicamente contenido, competencias comunicativas observables y relación con los requisitos.',
                'Los puntajes son enteros o decimales entre 0 y 100. Las fortalezas y mejoras deben ser frases breves, respetuosas y accionables.',
                'Devuelve únicamente el JSON solicitado.',
                JSON.stringify(context),
              ].join('\n'),
            },
            { inlineData: { mimeType: video.mimeType, data: video.base64 } },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: ANALYSIS_SCHEMA,
        temperature: 0.2,
      },
    });
    return this.normalize(response.text ?? '');
  }

  private async downloadVideo(path: string) {
    const maxBytes = Number(process.env.MAX_AI_VIDEO_BYTES ?? 20 * 1024 * 1024);
    const bucket = this.supabase.getBucketName('video');
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .download(path);
    if (error || !data)
      throw new Error(
        `No se pudo obtener el video: ${error?.message ?? 'archivo no encontrado'}`,
      );
    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.byteLength > maxBytes)
      throw new Error(
        `El video supera el límite de análisis de ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
      );
    return {
      base64: buffer.toString('base64'),
      mimeType: data.type || 'video/webm',
    };
  }

  private normalize(raw: string): AnalysisResult {
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      throw new Error('La IA devolvió un resultado de análisis inválido.');
    }
    const data = value as Record<string, unknown>;
    const score = (key: string) => {
      const value = Number(data[key]);
      if (!Number.isFinite(value)) throw new Error(`La IA no entregó ${key}.`);
      return Math.max(0, Math.min(100, value));
    };
    const text = (key: string) =>
      typeof data[key] === 'string' && data[key].trim()
        ? data[key].trim()
        : (() => {
            throw new Error(`La IA no entregó ${key}.`);
          })();
    const list = (key: string) =>
      Array.isArray(data[key])
        ? data[key]
            .filter(
              (item): item is string =>
                typeof item === 'string' && Boolean(item.trim()),
            )
            .slice(0, 5)
        : [];
    return {
      technicalScore: score('technicalScore'),
      behavioralScore: score('behavioralScore'),
      overallScore: score('overallScore'),
      technicalSummary: text('technicalSummary'),
      behavioralSummary: text('behavioralSummary'),
      strengths: list('strengths'),
      improvements: list('improvements'),
      recommendation: text('recommendation'),
    };
  }

  private serialize(analysis: any, application: any) {
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
