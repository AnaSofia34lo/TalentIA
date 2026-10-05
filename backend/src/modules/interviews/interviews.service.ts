import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service.js';
import type { StartTechnicalInterviewDto } from './dto/start-technical-interview.dto.js';
import type { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import type { MarkVideoQuestionDto } from './dto/mark-video-question.dto.js';
import { InterviewAnalysisService } from '../interview-analysis/interview-analysis.service.js';

@Injectable()
export class InterviewsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly interviewAnalysis: InterviewAnalysisService,
  ) {}

  async startTechnical(candidateId: string, dto: StartTechnicalInterviewDto) {
    return this.startInterview(candidateId, dto, 'technical');
  }

  async startBehavioral(candidateId: string, dto: StartTechnicalInterviewDto) {
    return this.startInterview(candidateId, dto, 'behavioral');
  }

  private async startInterview(
    candidateId: string,
    dto: StartTechnicalInterviewDto,
    type: 'technical' | 'behavioral',
  ) {
    const application = await this.prisma.candidateApplication.findFirst({
      where: { candidateId, vacancyId: dto.vacancyId },
      include: {
        vacancy: {
          include: {
            interviewQuestions: {
              where: { category: type },
              orderBy: { sortOrder: 'asc' },
            },
            organization: { select: { name: true } },
          },
        },
        interviews: {
          where: { type, status: { in: ['scheduled', 'in_progress'] } },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            questions: { orderBy: { createdAt: 'asc' } },
            answers: true,
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(
        'No existe una postulación para esta vacante.',
      );
    }
    if (application.vacancy.interviewQuestions.length !== 10) {
      throw new BadRequestException(
        `La vacante no tiene 10 preguntas de ${type === 'technical' ? 'técnicas' : 'habilidades blandas'} generadas.`,
      );
    }

    const existing = application.interviews[0];
    if (existing) return this.serialize(existing, application.vacancy);

    const interview = await this.prisma.interview.create({
      data: {
        applicationId: application.id,
        vacancyId: application.vacancyId,
        candidateId,
        type,
        status: 'in_progress',
        startedAt: new Date(),
        questions: {
          create: application.vacancy.interviewQuestions.map((question) => ({
            category: question.category,
            prompt: question.prompt,
            expectedAnswer: null,
          })),
        },
      },
      include: { questions: { orderBy: { createdAt: 'asc' } }, answers: true },
    });

    return this.serialize(interview, application.vacancy);
  }

  async submitAnswer(
    candidateId: string,
    interviewId: string,
    dto: SubmitInterviewAnswerDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        candidateId,
        type: 'technical',
        status: 'in_progress',
      },
      select: {
        id: true,
        candidateId: true,
        questions: { where: { id: dto.questionId }, select: { id: true } },
      },
    });
    if (!interview)
      throw new NotFoundException('La entrevista no está disponible.');
    if (interview.questions.length === 0)
      throw new BadRequestException(
        'La pregunta no pertenece a esta entrevista.',
      );

    const existing = await this.prisma.interviewAnswer.findFirst({
      where: { interviewId, questionId: dto.questionId, candidateId },
      select: { id: true },
    });
    const answer = existing
      ? await this.prisma.interviewAnswer.update({
          where: { id: existing.id },
          data: { responseText: dto.responseText?.trim() || null },
        })
      : await this.prisma.interviewAnswer.create({
          data: {
            interviewId,
            questionId: dto.questionId,
            candidateId,
            responseText: dto.responseText?.trim() || null,
          },
        });
    return {
      id: answer.id,
      questionId: answer.questionId,
      responseText: answer.responseText,
    };
  }

  async complete(candidateId: string, interviewId: string) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        candidateId,
        type: { in: ['technical', 'behavioral'] },
        status: 'in_progress',
      },
      include: {
        questions: { select: { id: true } },
        answers: { select: { questionId: true } },
        videoMarkers: { select: { questionId: true } },
      },
    });
    if (!interview)
      throw new NotFoundException('La entrevista no está disponible.');
    if (
      interview.type === 'technical' &&
      interview.answers.length < interview.questions.length
    ) {
      throw new BadRequestException(
        'Debes responder todas las preguntas antes de finalizar.',
      );
    }
    if (
      interview.type === 'behavioral' &&
      (!interview.videoUrl ||
        interview.videoMarkers.length < interview.questions.length)
    ) {
      throw new BadRequestException(
        'Debes completar la grabación y marcar todas las preguntas antes de finalizar.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.interview.update({
        where: { id: interviewId },
        data: { status: 'completed', completedAt: new Date() },
      }),
      ...(interview.type === 'behavioral'
        ? [
            this.prisma.candidateApplication.update({
              where: { id: interview.applicationId },
              data: { status: 'reviewed' },
            }),
          ]
        : []),
    ]);
    if (interview.type === 'behavioral' || interview.type === 'technical') {
      void this.interviewAnalysis.analyzeForCompletion(interview.applicationId);
    }
    return { interviewId, status: 'completed' };
  }

  async markVideoQuestion(
    candidateId: string,
    interviewId: string,
    dto: MarkVideoQuestionDto,
  ) {
    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        candidateId,
        type: 'behavioral',
        status: 'in_progress',
      },
      select: {
        id: true,
        questions: { where: { id: dto.questionId }, select: { id: true } },
      },
    });
    if (!interview)
      throw new NotFoundException('La entrevista en video no está disponible.');
    if (interview.questions.length === 0)
      throw new BadRequestException(
        'La pregunta no pertenece a esta entrevista.',
      );

    return this.prisma.interviewVideoMarker.upsert({
      where: {
        interviewId_questionId: { interviewId, questionId: dto.questionId },
      },
      create: {
        interviewId,
        questionId: dto.questionId,
        timestampMs: dto.timestampMs,
      },
      update: { timestampMs: dto.timestampMs },
    });
  }

  async uploadVideo(
    candidateId: string,
    interviewId: string,
    file?: Express.Multer.File,
  ) {
    if (!file)
      throw new BadRequestException(
        'El video de la entrevista es obligatorio.',
      );
    const isVideoFile =
      file.mimetype.startsWith('video/') ||
      /\.(webm|mp4|ogg|mov)$/i.test(file.originalname);
    if (!isVideoFile) {
      throw new BadRequestException('El archivo debe ser un video válido.');
    }

    const interview = await this.prisma.interview.findFirst({
      where: {
        id: interviewId,
        candidateId,
        type: 'behavioral',
        status: 'in_progress',
      },
      select: { id: true },
    });
    if (!interview)
      throw new NotFoundException('La entrevista en video no está disponible.');

    const bucket = this.supabase.getBucketName('video');
    const path = `${candidateId}/${interviewId}-${randomUUID()}.webm`;
    const { error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype.startsWith('video/')
          ? file.mimetype
          : 'video/webm',
        upsert: false,
      });
    if (error)
      throw new BadRequestException(
        `No se pudo guardar el video: ${error.message}`,
      );

    await this.prisma.$transaction([
      this.prisma.storageAsset.create({
        data: {
          userId: candidateId,
          bucketName: bucket,
          fileName: `${interviewId}.webm`,
          fileUrl: path,
          mimeType: file.mimetype.startsWith('video/')
            ? file.mimetype
            : 'video/webm',
          kind: 'interview_video',
          sizeBytes: file.size,
        },
      }),
      this.prisma.interview.update({
        where: { id: interviewId },
        data: { videoUrl: path },
      }),
    ]);

    return { interviewId, videoUrl: path };
  }

  private serialize(
    interview: {
      id: string;
      status: string;
      questions: Array<{ id: string; category: string; prompt: string }>;
      answers: Array<{ questionId: string; responseText: string | null }>;
    },
    vacancy: { title: string; organization: { name: string } },
  ) {
    return {
      interviewId: interview.id,
      status: interview.status,
      vacancy: {
        title: vacancy.title,
        organization: vacancy.organization.name,
      },
      questions: interview.questions.map((question) => ({
        id: question.id,
        category: question.category,
        prompt: question.prompt,
        answer:
          interview.answers.find((answer) => answer.questionId === question.id)
            ?.responseText ?? null,
      })),
    };
  }
}
