import type { Vacancy } from '../../domain/entities/vacancy.entity.js';

export const VACANCY_REPOSITORY = Symbol('VACANCY_REPOSITORY');

export type CreateVacancyPersistence = {
  name: string;
  description: string;
  createdByUserId: string;
  organizationId: string;
  slug: string;
  status?: 'draft' | 'published' | 'paused' | 'closed';
};

export interface VacancyRepositoryPort {
  create(data: CreateVacancyPersistence): Promise<Vacancy>;
  findByRecruiterId(recruiterId: string): Promise<Vacancy[]>;
  findPublished(): Promise<Vacancy[]>;
  findOrganizationIdByUserId(userId: string): Promise<string | null>;
  slugExists(slug: string): Promise<boolean>;
}
