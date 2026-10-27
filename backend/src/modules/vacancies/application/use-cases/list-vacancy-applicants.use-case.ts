import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';

@Injectable()
export class ListVacancyApplicantsUseCase {
  constructor(private readonly prisma: PrismaService) {}

  async execute(recruiterId: string, vacancyId: string, orgId?: string | null) {
    let organizationId = orgId;
    if (!organizationId) {
      const recruiter = await this.prisma.user.findUnique({
        where: { id: recruiterId },
        select: { organizationId: true },
      });
      organizationId = recruiter?.organizationId ?? null;
    }
    if (!organizationId) {
      throw new NotFoundException('El recruiter no tiene una organización asociada.');
    }
    const vacancy = await this.prisma.vacancy.findFirst({
      where: {
        id: vacancyId,
        organizationId,
      },
      include: {
        organization: { select: { name: true } },
        skills: { select: { name: true, weight: true } },
        applications: {
          orderBy: { submittedAt: 'asc' },
          include: {
            candidate: {
              include: {
                candidateProfile: true,
                technicalSkills: { select: { name: true, estimatedProficiency: true } },
              },
            },
            interviewAnalysis: {
              select: {
                status: true,
                technicalScore: true,
                behavioralScore: true,
                overallScore: true,
                recommendation: true,
                analyzedAt: true,
              },
            },
          },
        },
      },
    });

    if (!vacancy) throw new NotFoundException('La vacante no existe o no pertenece a tu organización.');

    const candidates = vacancy.applications.map((application) => {
      const aiScore = application.interviewAnalysis?.status === 'completed'
        ? application.interviewAnalysis.overallScore
        : null;
      const cvScore = this.calculateCvScore(vacancy.skills, application.candidate.technicalSkills);
      const score = this.roundScore(aiScore ?? application.matchScore ?? cvScore);
      return {
        applicationId: application.id,
        candidateId: application.candidateId,
        fullName: application.candidate.fullName,
        email: application.candidate.email,
        phone: application.candidate.phone,
        submittedAt: application.submittedAt,
        status: application.status,
        score,
        scoreSource: aiScore !== null ? 'interview_ai' : application.matchScore !== null ? 'stored_match' : 'cv_skills',
        interviewAnalysis: application.interviewAnalysis,
        profile: application.candidate.candidateProfile,
      };
    }).sort((left, right) => right.score - left.score || left.submittedAt.getTime() - right.submittedAt.getTime());

    const rankedCandidates = candidates.map((candidate, index) => ({
      ...candidate,
      rank: index + 1,
      medal: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : null,
    }));

    return {
      vacancy: {
        id: vacancy.id,
        name: vacancy.title,
        description: vacancy.description,
        status: vacancy.status,
        organization: vacancy.organization.name,
      },
      totalCandidates: rankedCandidates.length,
      ranking: rankedCandidates.slice(0, 3),
      candidates: rankedCandidates,
    };
  }

  private calculateCvScore(
    requiredSkills: Array<{ name: string; weight: number }>,
    candidateSkills: Array<{ name: string; estimatedProficiency: number }>,
  ) {
    if (requiredSkills.length === 0) return 0;
    const totalWeight = requiredSkills.reduce((total, skill) => total + Math.max(1, skill.weight), 0);
    const weightedScore = requiredSkills.reduce((total, required) => {
      const candidate = candidateSkills.find((skill) => this.sameSkill(skill.name, required.name));
      return total + (candidate?.estimatedProficiency ?? 0) * Math.max(1, required.weight);
    }, 0);
    return weightedScore / totalWeight;
  }

  private sameSkill(left: string, right: string) {
    const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9+#.]+/g, ' ').trim();
    const normalizedLeft = normalize(left);
    const normalizedRight = normalize(right);
    return normalizedLeft === normalizedRight || normalizedLeft.includes(normalizedRight) || normalizedRight.includes(normalizedLeft);
  }

  private roundScore(value: number | null) {
    return Math.max(0, Math.min(100, Math.round(value ?? 0)));
  }
}
