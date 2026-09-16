import { Inject, Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CandidatesService } from '../../../candidates/candidates.service.js';
import { UpdateCandidateCvDto } from '../../../candidates/dto/update-candidate-cv.dto.js';
import { SupabaseService } from '../../../../infrastructure/supabase/supabase.service.js';
import { WorkExperience } from '../../domain/entities/work-experience.entity.js';
import { Certification } from '../../domain/entities/certification.entity.js';
import { TechnicalSkill } from '../../domain/entities/technical-skill.entity.js';
import { RESUME_PARSER } from '../ports/resume-parser.port.js';
import type { ResumeParserPort } from '../ports/resume-parser.port.js';
import { RESUME_REPOSITORY } from '../ports/resume-repository.port.js';
import type { ResumeRepositoryPort } from '../ports/resume-repository.port.js';
import {
  ResumeTextExtractor,
  UnreadableResumeError,
} from '../../infrastructure/text-extraction/resume-text-extractor.js';
import { InvalidResumeParseError } from '../../infrastructure/ai/gemini-resume-parser.adapter.js';

export type AnalyzeCandidateResumePayload = {
  userId: string;
  storageAssetId: string;
};

@Injectable()
export class AnalyzeCandidateResumeUseCase {
  private readonly logger = new Logger(AnalyzeCandidateResumeUseCase.name);

  constructor(
    @Inject(RESUME_REPOSITORY)
    private readonly resumeRepository: ResumeRepositoryPort,
    @Inject(RESUME_PARSER)
    private readonly resumeParser: ResumeParserPort,
    private readonly textExtractor: ResumeTextExtractor,
    private readonly supabase: SupabaseService,
    private readonly candidates: CandidatesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async execute(payload: AnalyzeCandidateResumePayload): Promise<void> {
    const { userId, storageAssetId } = payload;

    const asset = await this.resumeRepository.findCvAsset(storageAssetId, userId);
    if (!asset) {
      this.logger.warn(
        `StorageAsset ${storageAssetId} no encontrado para user ${userId}; se omite análisis.`,
      );
      return;
    }

    const buffer = await this.downloadCv(asset.fileUrl);
    const text = await this.textExtractor.extract(
      buffer,
      asset.mimeType,
      asset.fileName,
    );
    const extracted = await this.resumeParser.parse(text);

    const workExperiences = extracted.workExperience
      .map((item) => WorkExperience.fromExtracted(userId, item))
      .filter((item): item is WorkExperience => item !== null);

    const certifications = extracted.certifications
      .map((item) => Certification.fromExtracted(userId, item))
      .filter((item): item is Certification => item !== null);

    const technicalSkills = extracted.technicalSkills
      .map((item) => TechnicalSkill.fromExtracted(userId, item))
      .filter((item): item is TechnicalSkill => item !== null);

    await this.resumeRepository.replaceAnalysis(userId, {
      workExperiences,
      certifications,
      technicalSkills,
    });

    await this.autocompleteProfile(userId, workExperiences);

    this.eventEmitter.emit('candidate.resume.analyzed', {
      userId,
      storageAssetId,
      workExperienceCount: workExperiences.length,
      certificationCount: certifications.length,
      technicalSkillCount: technicalSkills.length,
    });
  }

  async executeSafe(payload: AnalyzeCandidateResumePayload): Promise<void> {
    try {
      await this.execute(payload);
    } catch (error) {
      if (
        error instanceof UnreadableResumeError ||
        error instanceof InvalidResumeParseError
      ) {
        this.logger.warn(
          `Análisis de CV controlado falló para ${payload.userId}: ${error.message}`,
        );
        return;
      }
      this.logger.error(
        `Error inesperado analizando CV de ${payload.userId}: ${String(error)}`,
      );
    }
  }

  private async downloadCv(fileUrl: string): Promise<Buffer> {
    const bucket = this.supabase.getBucketName('cv');
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .download(fileUrl);

    if (error || !data) {
      throw new UnreadableResumeError(
        `No se pudo descargar el CV desde Storage: ${error?.message ?? 'sin datos'}`,
      );
    }

    return Buffer.from(await data.arrayBuffer());
  }

  private async autocompleteProfile(
    userId: string,
    experiences: WorkExperience[],
  ): Promise<void> {
    if (experiences.length === 0) return;

    const latest = this.pickMostRecent(experiences);
    const dto = this.buildCvDto(latest, experiences);
    if (!dto) {
      this.logger.warn(
        `Experiencia extraída insuficiente para autocompletar perfil de ${userId}.`,
      );
      return;
    }

    try {
      await this.candidates.updateCv(userId, dto);
    } catch (error) {
      this.logger.warn(
        `No se pudo autocompletar cvProfile para ${userId}: ${String(error)}`,
      );
    }
  }

  buildCvDto(
    latest: WorkExperience,
    all: WorkExperience[],
  ): UpdateCandidateCvDto | null {
    const professionalTitle = latest.role?.trim() ?? '';
    const currentCompany = latest.company?.trim() ?? '';
    const summarySource =
      latest.description?.trim() ||
      all
        .map((item) => `${item.role} en ${item.company}`)
        .join('. ');

    if (professionalTitle.length < 2 || currentCompany.length < 2) return null;

    let summary = summarySource.trim();
    if (summary.length < 20) {
      summary = `${professionalTitle} con experiencia en ${currentCompany}. Extraído automáticamente del CV.`;
    }
    if (summary.length > 2000) {
      summary = summary.slice(0, 2000);
    }

    return {
      professionalTitle: professionalTitle.slice(0, 120),
      currentCompany: currentCompany.slice(0, 120),
      yearsOfExperience: this.estimateYears(all),
      summary,
    };
  }

  estimateYears(experiences: WorkExperience[]): number {
    const years: number[] = [];
    for (const item of experiences) {
      const start = this.parseYear(item.startDate);
      const end = this.parseYear(item.endDate) ?? new Date().getFullYear();
      if (start !== null && end >= start) {
        years.push(end - start);
      }
    }
    if (years.length === 0) {
      return Math.min(60, experiences.length);
    }
    const total = years.reduce((acc, value) => acc + value, 0);
    return Math.min(60, Math.max(0, total));
  }

  pickMostRecent(experiences: WorkExperience[]): WorkExperience {
    return [...experiences].sort((a, b) => {
      const scoreA = this.recencyScore(a);
      const scoreB = this.recencyScore(b);
      return scoreB - scoreA;
    })[0];
  }

  private recencyScore(item: WorkExperience): number {
    const end = item.endDate?.toLowerCase() ?? '';
    if (!item.endDate || /actual|present|current|hoy|ahora/.test(end)) {
      return 10_000 + (this.parseYear(item.startDate) ?? 0);
    }
    return this.parseYear(item.endDate) ?? this.parseYear(item.startDate) ?? 0;
  }

  private parseYear(value: string | null): number | null {
    if (!value) return null;
    const match = value.match(/(19|20)\d{2}/);
    if (!match) return null;
    return Number(match[0]);
  }
}
