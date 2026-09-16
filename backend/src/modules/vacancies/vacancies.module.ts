import { Module } from '@nestjs/common';
import { CreateVacancyUseCase } from './application/use-cases/create-vacancy.use-case.js';
import { UpdateVacancyUseCase } from './application/use-cases/update-vacancy.use-case.js';
import { ListRecruiterVacanciesUseCase } from './application/use-cases/list-recruiter-vacancies.use-case.js';
import { ListPublishedVacanciesUseCase } from './application/use-cases/list-published-vacancies.use-case.js';
import { CalculateVacancyMatchUseCase } from './application/use-cases/calculate-vacancy-match.use-case.js';
import { VACANCY_REPOSITORY } from './application/ports/vacancy-repository.port.js';
import { PrismaVacancyRepository } from './infrastructure/persistence/prisma-vacancy.repository.js';
import { VacanciesController } from './presentation/controllers/vacancies.controller.js';

@Module({
  controllers: [VacanciesController],
  providers: [
    CreateVacancyUseCase,
    UpdateVacancyUseCase,
    ListRecruiterVacanciesUseCase,
    ListPublishedVacanciesUseCase,
    CalculateVacancyMatchUseCase,
    {
      provide: VACANCY_REPOSITORY,
      useClass: PrismaVacancyRepository,
    },
  ],
})
export class VacanciesModule {}
