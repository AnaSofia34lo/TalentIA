import { Inject, Injectable } from '@nestjs/common';
import {
  VACANCY_REPOSITORY,
  type VacancyRepositoryPort,
} from '../ports/vacancy-repository.port.js';
import type { Vacancy } from '../../domain/entities/vacancy.entity.js';

@Injectable()
export class ListPublishedVacanciesUseCase {
  constructor(
    @Inject(VACANCY_REPOSITORY)
    private readonly vacancies: VacancyRepositoryPort,
  ) {}

  execute(): Promise<Vacancy[]> {
    return this.vacancies.findPublished();
  }
}
