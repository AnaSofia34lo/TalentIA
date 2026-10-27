import { Module } from '@nestjs/common';
import { CandidatesController, RecruiterCandidateDocumentsController } from './candidates.controller.js';
import { CandidatesService } from './candidates.service.js';

@Module({
  controllers: [CandidatesController, RecruiterCandidateDocumentsController],
  providers: [CandidatesService],
  exports: [CandidatesService],
})
export class CandidatesModule {}
