import { Module } from '@nestjs/common';
import { TechnicalTestAccessService } from './application/technical-test-access.service.js';
import { TechnicalTestThreshold } from './domain/technical-test-threshold.js';
import { InterviewAnalysisCompletedListener } from './presentation/interview-analysis-completed.listener.js';
import { TechnicalTestAccessController } from './presentation/technical-test-access.controller.js';

@Module({
  controllers: [TechnicalTestAccessController],
  providers: [
    TechnicalTestThreshold,
    TechnicalTestAccessService,
    InterviewAnalysisCompletedListener,
  ],
  exports: [TechnicalTestAccessService, TechnicalTestThreshold],
})
export class TechnicalTestAccessModule {}
