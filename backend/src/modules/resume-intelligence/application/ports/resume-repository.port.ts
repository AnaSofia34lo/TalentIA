import { WorkExperience } from '../../domain/entities/work-experience.entity.js';
import { Certification } from '../../domain/entities/certification.entity.js';
import { TechnicalSkill } from '../../domain/entities/technical-skill.entity.js';

export const RESUME_REPOSITORY = Symbol('RESUME_REPOSITORY');

export type ResumeAnalysisSnapshot = {
  workExperiences: WorkExperience[];
  certifications: Certification[];
  technicalSkills: TechnicalSkill[];
};

export interface ResumeRepositoryPort {
  replaceAnalysis(
    userId: string,
    data: {
      workExperiences: WorkExperience[];
      certifications: Certification[];
      technicalSkills: TechnicalSkill[];
    },
  ): Promise<void>;

  findByUserId(userId: string): Promise<ResumeAnalysisSnapshot>;

  findCvAsset(
    storageAssetId: string,
    userId: string,
  ): Promise<{ fileUrl: string; mimeType: string | null; fileName: string } | null>;
}
