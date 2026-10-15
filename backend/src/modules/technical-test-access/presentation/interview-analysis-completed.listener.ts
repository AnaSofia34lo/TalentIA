import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  INTERVIEW_ANALYSIS_COMPLETED_EVENT,
  type InterviewAnalysisCompletedPayload,
} from '../../interview-analysis/domain/interview-analysis-completed.event.js';
import { TechnicalTestAccessService } from '../application/technical-test-access.service.js';

@Injectable()
export class InterviewAnalysisCompletedListener {
  constructor(
    private readonly technicalTestAccess: TechnicalTestAccessService,
  ) {}

  @OnEvent(INTERVIEW_ANALYSIS_COMPLETED_EVENT)
  async handle(payload: InterviewAnalysisCompletedPayload) {
    await this.technicalTestAccess.syncFromOverallScore(
      payload.applicationId,
      payload.overallScore,
    );
  }
}
