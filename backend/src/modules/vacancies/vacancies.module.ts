import { Module } from '@nestjs/common';
import { CreateVacancyUseCase } from './application/use-cases/create-vacancy.use-case.js';
import { UpdateVacancyUseCase } from './application/use-cases/update-vacancy.use-case.js';
import { ListRecruiterVacanciesUseCase } from './application/use-cases/list-recruiter-vacancies.use-case.js';
import { ListPublishedVacanciesUseCase } from './application/use-cases/list-published-vacancies.use-case.js';
import { CalculateVacancyMatchUseCase } from './application/use-cases/calculate-vacancy-match.use-case.js';
import { GenerateInterviewQuestionsUseCase } from './application/use-cases/generate-interview-questions.use-case.js';
import { INTERVIEW_QUESTION_GENERATOR } from './application/ports/interview-question-generator.port.js';
import { GeminiInterviewQuestionGenerator } from './infrastructure/ai/gemini-interview-question-generator.js';
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
    GenerateInterviewQuestionsUseCase,
    {
      provide: INTERVIEW_QUESTION_GENERATOR,
      useClass: GeminiInterviewQuestionGenerator,
    },
    {
      provide: VACANCY_REPOSITORY,
      useClass: PrismaVacancyRepository,
    },
  ],
})
export class VacanciesModule {}
