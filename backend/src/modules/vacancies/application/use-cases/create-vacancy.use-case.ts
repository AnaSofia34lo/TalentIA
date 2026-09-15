import {
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Vacancy } from '../../domain/entities/vacancy.entity.js';
import { VACANCY_REPOSITORY } from '../ports/vacancy-repository.port.js';
import type { VacancyRepositoryPort } from '../ports/vacancy-repository.port.js';
import type { CreateVacancyDto } from '../dtos/create-vacancy.dto.js';

@Injectable()
export class CreateVacancyUseCase {
  constructor(
    @Inject(VACANCY_REPOSITORY)
    private readonly vacancies: VacancyRepositoryPort,
  ) {}

  async execute(
    recruiterId: string,
    dto: CreateVacancyDto,
  ): Promise<Vacancy> {
    const organizationId =
      await this.vacancies.findOrganizationIdByUserId(recruiterId);

    if (!organizationId) {
      throw new BadRequestException(
        'El reclutador no tiene una organización asociada. Completa el registro de empresa.',
      );
    }

    let vacancy: Vacancy;
    try {
      vacancy = new Vacancy({
        name: dto.name,
        description: dto.description,
        createdByUserId: recruiterId,
        organizationId,
      });
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Datos de vacante inválidos.',
      );
    }

    const slug = await this.buildUniqueSlug(vacancy.name);

    return this.vacancies.create({
      name: vacancy.name,
      description: vacancy.description,
      createdByUserId: recruiterId,
      organizationId,
      slug,
      status: 'published',
    });
  }

  buildSlug(name: string): string {
    const base = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80);
    return base || `vacante-${randomUUID().slice(0, 8)}`;
  }

  private async buildUniqueSlug(name: string): Promise<string> {
    const base = this.buildSlug(name);
    if (!(await this.vacancies.slugExists(base))) return base;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const candidate = `${base}-${randomUUID().slice(0, 6)}`;
      if (!(await this.vacancies.slugExists(candidate))) return candidate;
    }

    return `${base}-${randomUUID()}`;
  }
}
