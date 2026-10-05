import { Module } from '@nestjs/common';
import { InterviewsController } from './interviews.controller.js';
import { InterviewsService } from './interviews.service.js';
import { InterviewAnalysisModule } from '../interview-analysis/interview-analysis.module.js';

@Module({
  imports: [InterviewAnalysisModule],
  controllers: [InterviewsController],
  providers: [InterviewsService],
})
export class InterviewsModule {}
