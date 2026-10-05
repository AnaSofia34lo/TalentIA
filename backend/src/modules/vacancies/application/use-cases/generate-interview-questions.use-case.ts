import { Inject, Injectable } from '@nestjs/common';
import {
  INTERVIEW_QUESTION_GENERATOR,
  type InterviewQuestionGeneratorPort,
} from '../ports/interview-question-generator.port.js';
import type { GenerateInterviewQuestionsDto } from '../dtos/generate-interview-questions.dto.js';

@Injectable()
export class GenerateInterviewQuestionsUseCase {
  constructor(
    @Inject(INTERVIEW_QUESTION_GENERATOR)
    private readonly generator: InterviewQuestionGeneratorPort,
  ) {}

  execute(dto: GenerateInterviewQuestionsDto) {
    return this.generator.generate(dto);
  }
}
