import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../infrastructure/database/prisma.service.js';
import { TechnicalTestThreshold } from '../domain/technical-test-threshold.js';

export type TechnicalTestAccessResult = {
  applicationId: string;
  enabled: boolean;
  matchPercentage: number | null;
  threshold: number;
  status:
    | 'enabled'
    | 'below_threshold'
    | 'analysis_not_ready'
    | 'analysis_failed'
    | 'analysis_in_progress';
  message: string;
  vacancyTitle: string;
  evaluatedAt: string | null;
};

@Injectable()
export class TechnicalTestAccessService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly threshold: TechnicalTestThreshold,
  ) {}

  async syncFromOverallScore(applicationId: string, overallScore: number) {
    const minimum = this.threshold.getMinimumMatchPercentage();
    const enabled = this.threshold.isEnabled(overallScore, minimum);
    const evaluatedAt = new Date();

    await this.prisma.candidateApplication.update({
      where: { id: applicationId },
      data: {
        technicalTestEnabled: enabled,
        technicalTestEvaluatedAt: evaluatedAt,
        matchScore: overallScore,
        ...(enabled ? { status: 'technical_test' as const } : {}),
      },
    });

    return {
      applicationId,
      enabled,
      matchPercentage: overallScore,
      threshold: minimum,
    };
  }

  async getAccessForCandidate(
    candidateId: string,
    applicationId: string,
  ): Promise<TechnicalTestAccessResult> {
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, candidateId },
      include: {
        vacancy: { select: { title: true } },
        interviewAnalysis: true,
      },
    });

    if (!application) {
      throw new NotFoundException(
        'La postulacion no existe o no pertenece al candidato.',
      );
    }

    const minimum = this.threshold.getMinimumMatchPercentage();
    const analysis = application.interviewAnalysis;

    if (!analysis) {
      return this.buildResult({
        applicationId,
        enabled: false,
        matchPercentage: null,
        threshold: minimum,
        status: 'analysis_not_ready',
        vacancyTitle: application.vacancy.title,
        evaluatedAt: application.technicalTestEvaluatedAt,
        message:
          'Aun no hay un analisis de entrevistas. Completa las entrevistas para habilitar la prueba tecnica.',
      });
    }

    if (analysis.status === 'processing' || analysis.status === 'pending') {
      return this.buildResult({
        applicationId,
        enabled: false,
        matchPercentage: analysis.overallScore,
        threshold: minimum,
        status: 'analysis_in_progress',
        vacancyTitle: application.vacancy.title,
        evaluatedAt: application.technicalTestEvaluatedAt,
        message:
          'El analisis de compatibilidad sigue en proceso. La prueba tecnica se habilitara si alcanzas el minimo requerido.',
      });
    }

    if (analysis.status === 'failed' || analysis.overallScore == null) {
      return this.buildResult({
        applicationId,
        enabled: false,
        matchPercentage: analysis.overallScore,
        threshold: minimum,
        status: 'analysis_failed',
        vacancyTitle: application.vacancy.title,
        evaluatedAt: application.technicalTestEvaluatedAt,
        message:
          'No fue posible obtener el porcentaje de compatibilidad. La prueba tecnica permanece bloqueada.',
      });
    }

    const synced = await this.syncFromOverallScore(
      applicationId,
      analysis.overallScore,
    );

    if (!synced.enabled) {
      return this.buildResult({
        applicationId,
        enabled: false,
        matchPercentage: synced.matchPercentage,
        threshold: minimum,
        status: 'below_threshold',
        vacancyTitle: application.vacancy.title,
        evaluatedAt: new Date(),
        message: `Tu compatibilidad es ${Math.round(synced.matchPercentage)}%. Se requiere al menos ${minimum}% para habilitar la prueba tecnica.`,
      });
    }

    return this.buildResult({
      applicationId,
      enabled: true,
      matchPercentage: synced.matchPercentage,
      threshold: minimum,
      status: 'enabled',
      vacancyTitle: application.vacancy.title,
      evaluatedAt: new Date(),
      message:
        'Prueba tecnica habilitada. Puedes continuar en el proceso de seleccion.',
    });
  }

  async assertAccessForCandidate(candidateId: string, applicationId: string) {
    const access = await this.getAccessForCandidate(candidateId, applicationId);
    if (!access.enabled) {
      throw new ForbiddenException(access.message);
    }
    return access;
  }

  private buildResult(input: {
    applicationId: string;
    enabled: boolean;
    matchPercentage: number | null;
    threshold: number;
    status: TechnicalTestAccessResult['status'];
    vacancyTitle: string;
    evaluatedAt: Date | string | null;
    message: string;
  }): TechnicalTestAccessResult {
    return {
      applicationId: input.applicationId,
      enabled: input.enabled,
      matchPercentage: input.matchPercentage,
      threshold: input.threshold,
      status: input.status,
      message: input.message,
      vacancyTitle: input.vacancyTitle,
      evaluatedAt:
        input.evaluatedAt instanceof Date
          ? input.evaluatedAt.toISOString()
          : input.evaluatedAt,
    };
  }
}
