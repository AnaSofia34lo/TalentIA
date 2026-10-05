import type { Vacancy } from '../../domain/entities/vacancy.entity.js';

export const VACANCY_REPOSITORY = Symbol('VACANCY_REPOSITORY');

export type VacancyInterviewQuestionPersistence = {
  category: 'technical' | 'behavioral';
  prompt: string;
  sortOrder: number;
};

export type CreateVacancyPersistence = {
  name: string;
  description: string;
  salary: number;
  requirements?: string;
  createdByUserId: string;
  organizationId: string;
  slug: string;
  status?: 'draft' | 'published' | 'paused' | 'closed';
  technicalSkills?: string[];
  interviewQuestions: VacancyInterviewQuestionPersistence[];
};

export type UpdateVacancyPersistence = {
  id: string;
  recruiterId: string;
  name: string;
  description: string;
  salary: number;
  requirements?: string;
  status: 'draft' | 'published' | 'paused' | 'closed';
  technicalSkills?: string[];
  interviewQuestions?: VacancyInterviewQuestionPersistence[];
};

export interface VacancyRepositoryPort {
  create(data: CreateVacancyPersistence): Promise<Vacancy>;
  update(data: UpdateVacancyPersistence): Promise<Vacancy | null>;
  findByRecruiterId(recruiterId: string): Promise<Vacancy[]>;
  findPublished(): Promise<Vacancy[]>;
  findOrganizationIdByUserId(userId: string): Promise<string | null>;
  slugExists(slug: string): Promise<boolean>;
  findMatchData(
    vacancyId: string,
    candidateId: string,
  ): Promise<{
    vacancySkills: Array<{ name: string; weight: number }>;
    candidateSkills: Array<{ name: string; estimatedProficiency: number }>;
  } | null>;
}
