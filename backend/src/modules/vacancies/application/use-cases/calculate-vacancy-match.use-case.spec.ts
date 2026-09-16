import { describe, expect, it } from 'vitest';
import { CalculateVacancyMatchUseCase } from './calculate-vacancy-match.use-case.js';

describe('CalculateVacancyMatchUseCase — HU-08', () => {
  const createUseCase = (data: {
    vacancySkills: Array<{ name: string; weight: number }>;
    candidateSkills: Array<{ name: string; estimatedProficiency: number }>;
  }) =>
    new CalculateVacancyMatchUseCase({
      findMatchData: async () => data,
    } as never);

  it('calcula el porcentaje con proficiency y deja evidencia por skill', async () => {
    const result = await createUseCase({
      vacancySkills: [
        { name: 'TypeScript', weight: 2 },
        { name: 'NestJS', weight: 1 },
      ],
      candidateSkills: [
        { name: 'typescript', estimatedProficiency: 90 },
        { name: 'React', estimatedProficiency: 80 },
      ],
    }).execute('vacancy-1', 'candidate-1');

    expect(result.matchPercentage).toBe(60);
    expect(result.evidence).toEqual([
      {
        requiredSkill: 'TypeScript',
        candidateSkill: 'typescript',
        proficiency: 90,
        matched: true,
        source: 'candidate_cv_ai_analysis',
      },
      {
        requiredSkill: 'NestJS',
        candidateSkill: null,
        proficiency: 0,
        matched: false,
        source: 'not_found_in_candidate_cv',
      },
    ]);
  });

  it('reconoce acentos y variantes de nombre sin inventar habilidades', () => {
    const useCase = createUseCase({ vacancySkills: [], candidateSkills: [] });

    expect(useCase.sameSkill('Programación', 'programacion')).toBe(true);
    expect(useCase.sameSkill('TypeScript', 'Java')).toBe(false);
  });
});