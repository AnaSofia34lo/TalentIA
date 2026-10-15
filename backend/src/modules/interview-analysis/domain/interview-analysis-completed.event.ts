export const INTERVIEW_ANALYSIS_COMPLETED_EVENT =
  'interview.analysis.completed';

export type InterviewAnalysisCompletedPayload = {
  applicationId: string;
  overallScore: number;
};
