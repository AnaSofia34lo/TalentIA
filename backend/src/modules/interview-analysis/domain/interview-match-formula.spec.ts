import { describe, expect, it } from 'vitest';
import { computeInterviewMatchPercentage } from './interview-match-formula.js';

describe('computeInterviewMatchPercentage — HU-33', () => {
  it('aplica la fórmula 60% técnico + 40% blando', () => {
    expect(computeInterviewMatchPercentage(100, 50)).toBe(80);
    expect(computeInterviewMatchPercentage(80, 70)).toBe(76);
  });

  it('acota puntajes fuera de rango', () => {
    expect(computeInterviewMatchPercentage(150, -10)).toBe(60);
  });
});
