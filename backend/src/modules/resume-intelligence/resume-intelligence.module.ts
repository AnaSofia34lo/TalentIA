import { Module } from '@nestjs/common';
import { CandidatesModule } from '../candidates/candidates.module.js';
import { AnalyzeCandidateResumeUseCase } from './application/use-cases/analyze-candidate-resume.use-case.js';
import { RESUME_PARSER } from './application/ports/resume-parser.port.js';
import { RESUME_REPOSITORY } from './application/ports/resume-repository.port.js';
import { GeminiResumeParserAdapter } from './infrastructure/ai/gemini-resume-parser.adapter.js';
import { PrismaResumeRepositoryAdapter } from './infrastructure/persistence/prisma-resume-repository.adapter.js';
import { ResumeTextExtractor } from './infrastructure/text-extraction/resume-text-extractor.js';
import { CandidateCvUploadedListener } from './presentation/listeners/candidate-cv-uploaded.listener.js';
import { ResumeIntelligenceController } from './presentation/controllers/resume-intelligence.controller.js';

@Module({
  imports: [CandidatesModule],
  controllers: [ResumeIntelligenceController],
  providers: [
    ResumeTextExtractor,
    AnalyzeCandidateResumeUseCase,
    CandidateCvUploadedListener,
    {
      provide: RESUME_PARSER,
      useClass: GeminiResumeParserAdapter,
    },
    {
      provide: RESUME_REPOSITORY,
      useClass: PrismaResumeRepositoryAdapter,
    },
  ],
})
export class ResumeIntelligenceModule {}
