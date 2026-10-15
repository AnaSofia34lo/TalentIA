import { describe, expect, it } from 'vitest';
import { InterviewAnalysisService } from './interview-analysis.service.js';

describe('InterviewAnalysisService — HU-32 / HU-33', () => {
  it('calcula Match IA como promedio de tecnico y blandas', () => {
    expect(InterviewAnalysisService.computeOverallScore(80, 70)).toBe(75);
    expect(InterviewAnalysisService.computeOverallScore(74, 74)).toBe(74);
    expect(InterviewAnalysisService.computeOverallScore(100, 50)).toBe(75);
  });
});
