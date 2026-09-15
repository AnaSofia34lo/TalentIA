import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import {
  ResumeAnalysisSnapshot,
  ResumeRepositoryPort,
} from '../../application/ports/resume-repository.port.js';
import { WorkExperience } from '../../domain/entities/work-experience.entity.js';
import { Certification } from '../../domain/entities/certification.entity.js';
import { TechnicalSkill } from '../../domain/entities/technical-skill.entity.js';

@Injectable()
export class PrismaResumeRepositoryAdapter implements ResumeRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async findCvAsset(storageAssetId: string, userId: string) {
    const asset = await this.prisma.storageAsset.findFirst({
      where: { id: storageAssetId, userId, kind: 'cv' },
    });
    if (!asset) return null;
    return {
      fileUrl: asset.fileUrl,
      mimeType: asset.mimeType,
      fileName: asset.fileName,
    };
  }

  async replaceAnalysis(
    userId: string,
    data: {
      workExperiences: WorkExperience[];
      certifications: Certification[];
      technicalSkills: TechnicalSkill[];
    },
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.workExperience.deleteMany({ where: { userId } });
      await tx.certification.deleteMany({ where: { userId } });
      await tx.candidateTechnicalSkill.deleteMany({ where: { userId } });

      if (data.workExperiences.length > 0) {
        await tx.workExperience.createMany({
          data: data.workExperiences.map((item) => ({
            userId,
            company: item.company,
            role: item.role,
            startDate: item.startDate,
            endDate: item.endDate,
            description: item.description,
          })),
        });
      }

      if (data.certifications.length > 0) {
        await tx.certification.createMany({
          data: data.certifications.map((item) => ({
            userId,
            name: item.name,
            issuer: item.issuer,
            date: item.date,
          })),
        });
      }

      if (data.technicalSkills.length > 0) {
        await tx.candidateTechnicalSkill.createMany({
          data: data.technicalSkills.map((item) => ({
            userId,
            name: item.name,
            estimatedProficiency: item.estimatedProficiency,
          })),
        });
      }
    });
  }

  async findByUserId(userId: string): Promise<ResumeAnalysisSnapshot> {
    const [workExperiences, certifications, technicalSkills] = await Promise.all([
      this.prisma.workExperience.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.certification.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.candidateTechnicalSkill.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return {
      workExperiences: workExperiences.map(
        (row) =>
          new WorkExperience({
            id: row.id,
            userId: row.userId,
            company: row.company,
            role: row.role,
            startDate: row.startDate,
            endDate: row.endDate,
            description: row.description,
          }),
      ),
      certifications: certifications.map(
        (row) =>
          new Certification({
            id: row.id,
            userId: row.userId,
            name: row.name,
            issuer: row.issuer,
            date: row.date,
          }),
      ),
      technicalSkills: technicalSkills.map(
        (row) =>
          new TechnicalSkill({
            id: row.id,
            userId: row.userId,
            name: row.name,
            estimatedProficiency: row.estimatedProficiency,
          }),
      ),
    };
  }
}
