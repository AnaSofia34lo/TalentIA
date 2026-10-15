import { Module } from '@nestjs/common';
import { InterviewAnalysisController } from './interview-analysis.controller.js';
import { InterviewAnalysisService } from './interview-analysis.service.js';

@Module({ controllers: [InterviewAnalysisController], providers: [InterviewAnalysisService], exports: [InterviewAnalysisService] })
export class InterviewAnalysisModule {}
