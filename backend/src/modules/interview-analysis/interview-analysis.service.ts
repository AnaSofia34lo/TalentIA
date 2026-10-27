import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { GoogleGenAI, Type } from '@google/genai';
import { MAX_UPLOAD_BYTES } from '../../common/constants/upload.constants.js';
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
    const applications = await this.prisma.candidateApplication.findMany({
      where: { candidateId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        vacancy: {
          select: { title: true, organization: { select: { name: true } } },
        },
        interviewAnalysis: true,
        interviews: { select: { type: true, status: true, videoUrl: true } },
      },
    });

    return applications.map((application) => {
      if (application.interviewAnalysis) {
        return this.serialize(application.interviewAnalysis, application);
      }
      const technicalReady = application.interviews.some(
        (interview) => interview.type === 'technical' && interview.status === 'completed',
      );
      const behavioralReady = application.interviews.some(
        (interview) => interview.type === 'behavioral' &&
          interview.status === 'completed' && Boolean(interview.videoUrl),
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
    });
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

  async getRecruiterAnalysis(
    recruiterId: string,
    applicationId: string,
    orgId?: string | null,
  ) {
    let organizationId = orgId;
    if (!organizationId) {
      const recruiter = await this.prisma.user.findUnique({
        where: { id: recruiterId },
        select: { organizationId: true },
      });
      organizationId = recruiter?.organizationId ?? null;
    }
    if (!organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organizacion asociada.',
      );
    }
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, organizationId },
      include: {
        candidate: {
          include: {
            candidateProfile: true,
            technicalSkills: {
              select: { name: true, estimatedProficiency: true },
            },
            documents: {
              where: { kind: 'cv' },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
        vacancy: {
          include: {
            organization: { select: { name: true } },
            skills: { select: { name: true, weight: true } },
          },
        },
        interviewAnalysis: true,
        interviews: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            videoUrl: true,
            answers: {
              select: {
                id: true,
                responseText: true,
                question: { select: { id: true, category: true, prompt: true } },
              },
            },
            videoMarkers: {
              select: {
                id: true,
                timestampMs: true,
                questionId: true,
                question: { select: { id: true, category: true, prompt: true } },
              },
              orderBy: { timestampMs: 'asc' },
            },
          },
        },
      },
    });
    if (!application) {
      throw new NotFoundException(
        'La postulacion no existe o no pertenece a la organización.',
      );
    }

    const technicalReady = application.interviews.some(
      (interview) =>
        interview.type === 'technical' && interview.status === 'completed',
    );
    const behavioralInterview =
      application.interviews.find(
        (interview) =>
          interview.id === application.interviewAnalysis?.behavioralInterviewId &&
          interview.type === 'behavioral',
      ) ??
      this.pickCompletedInterview(application.interviews, 'behavioral');
    const behavioralReady = Boolean(behavioralInterview);
    const technicalInterview =
      application.interviews.find(
        (interview) =>
          interview.id === application.interviewAnalysis?.technicalInterviewId &&
          interview.type === 'technical',
      ) ?? this.pickCompletedInterview(application.interviews, 'technical');

    const cvAsset = application.candidate.documents[0];
    const analysisBlock = application.interviewAnalysis
      ? {
          ...this.serialize(application.interviewAnalysis, application),
          interviewsReady: true,
        }
      : {
          id: application.id,
          status:
            technicalReady && behavioralReady
              ? 'ready_to_analyze'
              : 'not_available',
          technicalScore: null,
          behavioralScore: null,
          overallScore: null,
          technicalSummary: null,
          behavioralSummary: null,
          strengths: [] as string[],
          improvements: [] as string[],
          recommendation: null,
          failureReason: null,
          analyzedAt: null,
          interviewsReady: technicalReady && behavioralReady,
          application: {
            id: application.id,
            vacancy: {
              title: application.vacancy.title,
              organization: application.vacancy.organization.name,
            },
          },
        };

    const strengths = Array.isArray(analysisBlock.strengths)
      ? analysisBlock.strengths
      : [];
    const improvements = Array.isArray(analysisBlock.improvements)
      ? analysisBlock.improvements
      : [];

    const skillBars = this.buildTechnicalSkillBars(
      application.vacancy.skills,
      application.candidate.technicalSkills,
    );

    const evidences = this.buildEvidences({
      strengths,
      improvements,
      technicalSummary:
        typeof analysisBlock.technicalSummary === 'string'
          ? analysisBlock.technicalSummary
          : null,
      behavioralSummary:
        typeof analysisBlock.behavioralSummary === 'string'
          ? analysisBlock.behavioralSummary
          : null,
      technicalInterviewId: technicalInterview?.id ?? null,
      behavioralInterviewId: behavioralInterview?.id ?? null,
      technicalAnswers: technicalInterview?.answers ?? [],
      videoMarkers: behavioralInterview?.videoMarkers ?? [],
      applicationId: application.id,
      candidateId: application.candidateId,
    });

    return {
      candidate: {
        id: application.candidateId,
        fullName: application.candidate.fullName,
        email: application.candidate.email,
        phone: application.candidate.phone,
        profile: application.candidate.candidateProfile,
        technicalSkills: application.candidate.technicalSkills,
        cvFileName: cvAsset?.fileName ?? null,
        cvDownloadUrl: null,
      },
      application: {
        id: application.id,
        status: application.status,
        submittedAt: application.submittedAt,
        matchScore: application.matchScore,
        vacancy: {
          id: application.vacancyId,
          title: application.vacancy.title,
          organization: application.vacancy.organization.name,
        },
      },
      analysis: analysisBlock,
      dofa: {
        strengths,
        opportunities: improvements,
        weaknesses: improvements.length
          ? improvements
          : [],
        threats: [] as string[],
        notes: {
          weaknesses:
            improvements.length === 0
              ? 'Sin evidencia suficiente para listar debilidades específicas.'
              : 'Derivadas de los puntos de mejora identificados por la IA en esta postulación.',
          threats:
            'Sin evidencia suficiente en el análisis actual para identificar amenazas o riesgos.',
          opportunities:
            improvements.length === 0
              ? 'Sin evidencia suficiente para listar oportunidades de desarrollo.'
              : 'Áreas de desarrollo sugeridas por el análisis de entrevistas de esta postulación.',
        },
      },
      competencies: {
        technicalPercentage: analysisBlock.technicalScore,
        softPercentage: analysisBlock.behavioralScore,
        technicalBars: skillBars,
      },
      evidences,
      interviews: {
        technicalId: technicalInterview?.id ?? null,
        behavioralId: behavioralInterview?.id ?? null,
        hasVideo: Boolean(behavioralInterview?.videoUrl),
      },
    };
  }

  async getRecruiterInterviewReview(
    recruiterId: string,
    applicationId: string,
    interviewType: 'technical' | 'behavioral' = 'behavioral',
    orgId?: string | null,
  ) {
    let organizationId = orgId;
    if (!organizationId) {
      const recruiter = await this.prisma.user.findUnique({
        where: { id: recruiterId },
        select: { organizationId: true },
      });
      organizationId = recruiter?.organizationId ?? null;
    }
    if (!organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organizacion asociada.',
      );
    }

    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, organizationId },
      include: {
        candidate: { select: { id: true, fullName: true } },
        vacancy: { select: { id: true, title: true } },
        interviews: {
          where: { type: interviewType },
          orderBy: { createdAt: 'desc' },
          include: {
            answers: {
              select: {
                id: true,
                responseText: true,
                question: {
                  select: { id: true, category: true, prompt: true },
                },
              },
              orderBy: { createdAt: 'asc' },
            },
            videoMarkers: {
              select: {
                id: true,
                timestampMs: true,
                questionId: true,
                question: {
                  select: { id: true, category: true, prompt: true },
                },
              },
              orderBy: { timestampMs: 'asc' },
            },
            questions: {
              select: { id: true, category: true, prompt: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        },
      },
    });

    if (!application) {
      throw new NotFoundException(
        'La postulacion no existe o no pertenece a la organización.',
      );
    }

    const interviews = await Promise.all(
      application.interviews.map(async (interview) => ({
        id: interview.id,
        type: interview.type,
        status: interview.status,
        startedAt: interview.startedAt,
        completedAt: interview.completedAt,
        createdAt: interview.createdAt,
        updatedAt: interview.updatedAt,
        videoUrl: interview.videoUrl,
        videoDownloadUrl: interview.videoUrl
          ? await this.createVideoDownloadUrl(interview.videoUrl)
          : null,
        answers: interview.answers.map((answer) => ({
          id: answer.id,
          responseText: answer.responseText,
          question: answer.question,
        })),
        markers: interview.videoMarkers.map((marker) => ({
          id: marker.id,
          timestampMs: marker.timestampMs,
          questionId: marker.questionId,
          question: marker.question,
        })),
        questions: interview.questions,
      })),
    );
    const interview = interviews[0] ?? null;

    return {
      candidate: application.candidate,
      vacancy: application.vacancy,
      applicationId: application.id,
      interview,
      interviews,
    };
  }

  async getRecruiterCandidateCvDownloadUrl(
    recruiterId: string,
    applicationId: string,
    orgId?: string | null,
  ) {
    let organizationId = orgId;
    if (!organizationId) {
      const recruiter = await this.prisma.user.findUnique({
        where: { id: recruiterId },
        select: { organizationId: true },
      });
      organizationId = recruiter?.organizationId ?? null;
    }
    if (!organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organizacion asociada.',
      );
    }

    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, organizationId },
      select: {
        candidate: {
          select: {
            documents: {
              where: { kind: 'cv' },
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: { fileUrl: true },
            },
          },
        },
      },
    });
    const cvPath = application?.candidate.documents[0]?.fileUrl;
    if (!cvPath) {
      throw new NotFoundException(
        'Este candidato no tiene una hoja de vida disponible.',
      );
    }

    const downloadUrl = await this.createCvDownloadUrl(cvPath);
    if (!downloadUrl) {
      throw new NotFoundException(
        'No se pudo preparar el enlace de descarga de la hoja de vida.',
      );
    }
    return { downloadUrl };
  }

  private async createVideoDownloadUrl(path: string) {
    const bucket = this.supabase.getBucketName('video');
    const storagePath = this.resolveStoragePath(path);
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .createSignedUrl(storagePath, 3600);
    return error ? null : data.signedUrl;
  }

  async getRecruiterDashboardStats(recruiterId: string, orgId?: string | null) {
    let organizationId = orgId;
    if (!organizationId) {
      const recruiter = await this.prisma.user.findUnique({
        where: { id: recruiterId },
        select: { organizationId: true },
      });
      organizationId = recruiter?.organizationId ?? null;
    }
    if (!organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organización asociada.',
      );
    }

    const organization = await this.prisma.organization.findUnique({
      where: { id: organizationId },
      select: { name: true },
    });

    const vacancies = await this.prisma.vacancy.findMany({
      where: { organizationId },
      select: {
        id: true,
        title: true,
        status: true,
        skills: { select: { name: true } },
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const applications = await this.prisma.candidateApplication.findMany({
      where: { organizationId },
      select: {
        id: true,
        status: true,
        matchScore: true,
        submittedAt: true,
        candidate: { select: { id: true, fullName: true, email: true } },
        vacancy: { select: { id: true, title: true } },
        interviewAnalysis: { select: { status: true, overallScore: true } },
        interviews: { select: { id: true, status: true } },
      },
      orderBy: { submittedAt: 'desc' },
    });

    const totalVacancies = vacancies.length;
    const activeVacancies = vacancies.filter(
      (v) => v.status === 'published',
    ).length;
    const totalApplicants = applications.length;

    let completedInterviews = 0;
    for (const app of applications) {
      completedInterviews += app.interviews.filter(
        (i) => i.status === 'completed',
      ).length;
    }

    const scores = applications
      .map((app) => app.interviewAnalysis?.overallScore ?? app.matchScore)
      .filter((s): s is number => s != null && s > 0);
    const averageMatchScore = scores.length
      ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
      : 0;

    const vacanciesBreakdown = vacancies.map((v) => ({
      id: v.id,
      title: v.title,
      applicantCount: v._count.applications,
      status: v.status,
    }));

    const statusBreakdown = {
      applied: 0,
      reviewed: 0,
      interview_scheduled: 0,
      completed: 0,
      rejected: 0,
      hired: 0,
    };
    for (const app of applications) {
      const st = app.status as keyof typeof statusBreakdown;
      if (st in statusBreakdown) {
        statusBreakdown[st]++;
      } else {
        statusBreakdown.applied++;
      }
    }

    const skillCounts: Record<string, number> = {};
    for (const v of vacancies) {
      for (const s of v.skills) {
        const name = s.name.trim();
        skillCounts[name] = (skillCounts[name] || 0) + 1;
      }
    }
    const sortedSkills = Object.entries(skillCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
    const maxSkillCount = sortedSkills[0]?.[1] || 1;
    const topSkills = sortedSkills.map(([name, count]) => ({
      name,
      count,
      percentage: Math.round((count / maxSkillCount) * 100),
    }));

    const recentApplications = applications.slice(0, 6).map((app) => ({
      applicationId: app.id,
      candidateId: app.candidate.id,
      candidateName: app.candidate.fullName,
      candidateEmail: app.candidate.email,
      vacancyTitle: app.vacancy.title,
      submittedAt: app.submittedAt,
      status: app.status,
      matchScore: app.interviewAnalysis?.overallScore ?? app.matchScore ?? null,
    }));

    return {
      organizationName: organization?.name || 'Mi Organización',
      totalVacancies,
      activeVacancies,
      totalApplicants,
      completedInterviews,
      averageMatchScore,
      vacanciesBreakdown,
      statusBreakdown,
      topSkills,
      recentApplications,
    };
  }

  async listRecruiterReports(recruiterId: string, orgId?: string | null) {
    let organizationId = orgId;
    if (!organizationId) {
      const recruiter = await this.prisma.user.findUnique({
        where: { id: recruiterId },
        select: { organizationId: true },
      });
      organizationId = recruiter?.organizationId ?? null;
    }
    if (!organizationId) {
      throw new NotFoundException(
        'El recruiter no tiene una organizacion asociada.',
      );
    }

    const rows = await this.prisma.interviewAnalysis.findMany({
      where: {
        status: 'completed',
        application: { organizationId },
      },
      orderBy: { analyzedAt: 'desc' },
      include: {
        application: {
          include: {
            candidate: {
              select: { id: true, fullName: true, email: true },
            },
            vacancy: {
              select: {
                id: true,
                title: true,
                organization: { select: { name: true } },
              },
            },
          },
        },
      },
    });

    return rows.map((row) => {
      const initials = row.application.candidate.fullName
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
      return {
        applicationId: row.applicationId,
        candidateId: row.application.candidate.id,
        candidateName: row.application.candidate.fullName,
        candidateEmail: row.application.candidate.email,
        initials: initials || 'CA',
        vacancyId: row.application.vacancy.id,
        vacancyTitle: row.application.vacancy.title,
        organization: row.application.vacancy.organization.name,
        overallScore: row.overallScore,
        technicalScore: row.technicalScore,
        behavioralScore: row.behavioralScore,
        recommendation: row.recommendation,
        analyzedAt: row.analyzedAt,
      };
    });
  }

  private buildTechnicalSkillBars(
    vacancySkills: Array<{ name: string; weight: number }>,
    candidateSkills: Array<{ name: string; estimatedProficiency: number }>,
  ) {
    if (!vacancySkills.length) {
      return candidateSkills.slice(0, 8).map((skill) => ({
        name: skill.name,
        percentage: Math.round(skill.estimatedProficiency),
        source: 'cv' as const,
      }));
    }
    const byName = new Map(
      candidateSkills.map((skill) => [
        skill.name.trim().toLowerCase(),
        skill.estimatedProficiency,
      ]),
    );
    return vacancySkills.map((skill) => {
      const match = byName.get(skill.name.trim().toLowerCase());
      return {
        name: skill.name,
        percentage: match !== undefined ? Math.round(match) : 0,
        source: match !== undefined ? ('cv' as const) : ('vacancy' as const),
        matched: match !== undefined,
      };
    });
  }

  private buildEvidences(input: {
    strengths: string[];
    improvements: string[];
    technicalSummary: string | null;
    behavioralSummary: string | null;
    technicalInterviewId: string | null;
    behavioralInterviewId: string | null;
    technicalAnswers: Array<{
      id: string;
      responseText: string | null;
      question: { id: string; category: string; prompt: string };
    }>;
    videoMarkers: Array<{
      id: string;
      timestampMs: number;
      questionId: string;
      question: { id: string; category: string; prompt: string };
    }>;
    applicationId: string;
    candidateId: string;
  }) {
    const evidences: Array<{
      id: string;
      competency: string;
      kind: 'technical' | 'soft' | 'cv' | 'general';
      summary: string;
      score: number | null;
      href: string;
    }> = [];

    for (const answer of input.technicalAnswers.slice(0, 6)) {
      evidences.push({
        id: `tech-${answer.id}`,
        competency: answer.question.category || 'Competencia técnica',
        kind: 'technical',
        summary:
          answer.responseText?.slice(0, 180) ||
          answer.question.prompt.slice(0, 180),
        score: null,
        href: `/admin/candidatos/${input.candidateId}/video?applicationId=${encodeURIComponent(input.applicationId)}&interviewType=technical&interviewId=${encodeURIComponent(input.technicalInterviewId ?? '')}&answerId=${encodeURIComponent(answer.id)}&questionId=${encodeURIComponent(answer.question.id)}`,
      });
    }

    for (const marker of input.videoMarkers.slice(0, 6)) {
      const seconds = Math.max(0, Math.round(marker.timestampMs / 1000));
      evidences.push({
        id: `soft-${marker.id}`,
        competency: marker.question.category || 'Habilidad blanda',
        kind: 'soft',
        summary: marker.question.prompt.slice(0, 180),
        score: null,
        href: `/admin/candidatos/${input.candidateId}/video?applicationId=${encodeURIComponent(input.applicationId)}&interviewType=behavioral&interviewId=${encodeURIComponent(input.behavioralInterviewId ?? '')}&markerId=${encodeURIComponent(marker.id)}&t=${seconds}`,
      });
    }

    if (!evidences.length && input.technicalSummary) {
      evidences.push({
        id: 'tech-summary',
        competency: 'Resumen técnico',
        kind: 'technical',
        summary: input.technicalSummary,
        score: null,
        href: `/admin/candidatos/${input.candidateId}/video?applicationId=${encodeURIComponent(input.applicationId)}&interviewType=technical`,
      });
    }
    if (input.behavioralSummary) {
      evidences.push({
        id: 'soft-summary',
        competency: 'Comunicación / habilidades blandas',
        kind: 'soft',
        summary: input.behavioralSummary,
        score: null,
        href: `/admin/candidatos/${input.candidateId}/video?applicationId=${encodeURIComponent(input.applicationId)}&interviewType=behavioral`,
      });
    }

    return evidences;
  }

  private async createCvDownloadUrl(path: string) {
    const bucket = this.supabase.getBucketName('cv');
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .createSignedUrl(path, 3600);
    return error ? null : data.signedUrl;
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

    const uploadedFile = await ai.files.upload({
      file: new Blob([new Uint8Array(video.buffer)], { type: video.mimeType }),
      config: {
        mimeType: video.mimeType,
        displayName: 'entrevista-conductual.webm',
      },
    });
    try {
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
        throw new Error(
          'Gemini no pudo preparar el video para analizarlo. Intenta nuevamente.',
        );
      }

      const response = await this.generateContentWithRetry(ai, [
        {
          role: 'user',
          parts: [
            {
              fileData: {
                mimeType: video.mimeType,
                fileUri: readyFile.uri,
              },
            },
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
          ],
        },
      ]);
      return this.normalize(response.text ?? '');
    } finally {
      if (uploadedFile.name) {
        await ai.files
          .delete({ name: uploadedFile.name })
          .catch((error: unknown) => {
            this.logger.warn(
              `No se pudo borrar el archivo temporal de Gemini: ${String(error)}`,
            );
          });
      }
    }
  }

  private async generateContentWithRetry(
    ai: GoogleGenAI,
    contents: Array<{
      role: 'user';
      parts: Array<
        | { text: string }
        | { fileData: { mimeType: string; fileUri: string } }
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
    const configuredMaxBytes = Number(process.env.MAX_AI_VIDEO_BYTES);
    const maxBytes =
      Number.isSafeInteger(configuredMaxBytes) && configuredMaxBytes > 0
        ? Math.min(configuredMaxBytes, MAX_UPLOAD_BYTES)
        : MAX_UPLOAD_BYTES;
    const path = this.resolveStoragePath(storagePath);
    const asset = await this.prisma.storageAsset.findFirst({
      where: { kind: 'interview_video', fileUrl: path },
      orderBy: { createdAt: 'desc' },
      select: { bucketName: true },
    });
    const bucket = asset?.bucketName ?? this.supabase.getBucketName('video');
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .download(path);
    if (error || !data) {
      this.logger.warn(
        `Video de entrevista no encontrado en Storage (bucket=${bucket}, path=${path}). Comprueba que el archivo siga en el bucket y que el registro de la entrevista apunte a la ruta correcta.`,
      );
      throw new Error(
        'No se encontro el video guardado. Verifica que no se haya movido o eliminado del bucket de videos y luego vuelve a intentar el analisis.',
      );
    }
    const buffer = Buffer.from(await data.arrayBuffer());
    if (buffer.byteLength > maxBytes) {
      throw new Error(
        `El video supera el limite de analisis de ${Math.floor(maxBytes / 1024 / 1024)} MB.`,
      );
    }
    return {
      buffer,
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
      scoreExplanation: {
        technical: analysis.technicalSummary,
        behavioral: analysis.behavioralSummary,
        positiveFactors: Array.isArray(analysis.strengths) ? analysis.strengths : [],
        improvementFactors: Array.isArray(analysis.improvements) ? analysis.improvements : [],
      },
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
