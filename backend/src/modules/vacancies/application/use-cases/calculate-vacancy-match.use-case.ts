import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  VACANCY_REPOSITORY,
  type VacancyRepositoryPort,
} from '../ports/vacancy-repository.port.js';

export type MatchEvidence = {
  requiredSkill: string;
  candidateSkill: string | null;
  proficiency: number;
  matched: boolean;
  source: 'candidate_cv_ai_analysis' | 'not_found_in_candidate_cv';
};

@Injectable()
export class CalculateVacancyMatchUseCase {
  constructor(
    @Inject(VACANCY_REPOSITORY)
    private readonly vacancies: VacancyRepositoryPort,
  ) {}

  async execute(vacancyId: string, candidateId: string) {
    const data = await this.vacancies.findMatchData(vacancyId, candidateId);
    if (!data) throw new NotFoundException('La vacante publicada no existe.');

    const evidence = data.vacancySkills.map((required) => {
      const candidate = data.candidateSkills.find((skill) =>
        this.sameSkill(skill.name, required.name),
      );
      const proficiency = candidate?.estimatedProficiency ?? 0;
      return {
        requiredSkill: required.name,
        candidateSkill: candidate?.name ?? null,
        proficiency,
        matched: candidate !== undefined,
        source: candidate
          ? 'candidate_cv_ai_analysis'
          : 'not_found_in_candidate_cv',
      } satisfies MatchEvidence;
    });

    const totalWeight = data.vacancySkills.reduce(
      (total, skill) => total + Math.max(1, skill.weight),
      0,
    );
    const weightedScore = evidence.reduce((total, item, index) => {
      const weight = Math.max(1, data.vacancySkills[index].weight);
      return total + item.proficiency * weight;
    }, 0);

    return {
      vacancyId,
      candidateId,
      matchPercentage:
        totalWeight === 0 ? 0 : Math.round(weightedScore / totalWeight),
      evaluatedSkills: evidence.length,
      evidence,
      evidenceSource: 'technical_skills_extracted_from_candidate_cv',
    };
  }

  sameSkill(left: string, right: string): boolean {
    const normalize = (value: string) =>
      value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLocaleLowerCase()
        .replace(/[^a-z0-9+#.]+/g, ' ')
        .trim();
    const normalizedLeft = normalize(left);
    const normalizedRight = normalize(right);
    return (
      normalizedLeft === normalizedRight ||
      normalizedLeft.includes(` ${normalizedRight} `) ||
      normalizedRight.includes(` ${normalizedLeft} `)
    );
  }
}