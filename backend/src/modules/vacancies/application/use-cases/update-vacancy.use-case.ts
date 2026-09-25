import { BadRequestException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Vacancy } from '../../domain/entities/vacancy.entity.js';
import { VACANCY_REPOSITORY, type VacancyRepositoryPort } from '../ports/vacancy-repository.port.js';
import type { UpdateVacancyDto } from '../dtos/update-vacancy.dto.js';

@Injectable()
export class UpdateVacancyUseCase {
  constructor(
    @Inject(VACANCY_REPOSITORY)
    private readonly vacancies: VacancyRepositoryPort,
  ) {}

  async execute(recruiterId: string, vacancyId: string, dto: UpdateVacancyDto): Promise<Vacancy> {
    if (dto.name === undefined || dto.description === undefined || dto.salary === undefined) {
      throw new BadRequestException('Nombre, descripción y salario son obligatorios al editar una vacante.');
    }

    try {
      new Vacancy({
        name: dto.name,
        description: dto.description,
        salary: dto.salary,
        createdByUserId: recruiterId,
        organizationId: 'validation',
      });
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : 'Datos de vacante inválidos.');
    }

    const vacancy = await this.vacancies.update({
      id: vacancyId,
      recruiterId,
      name: dto.name,
      description: dto.description,
      salary: dto.salary,
      status: dto.status ?? 'published',
      technicalSkills: dto.technicalSkills,
    });
    if (!vacancy) throw new NotFoundException('La vacante no existe o no pertenece al reclutador.');
    return vacancy;
  }
}