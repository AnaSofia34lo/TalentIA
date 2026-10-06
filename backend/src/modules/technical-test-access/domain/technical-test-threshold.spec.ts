import { describe, expect, it } from 'vitest';
import { TechnicalTestThreshold } from './technical-test-threshold.js';

describe('TechnicalTestThreshold — HU-34', () => {
  const threshold = new TechnicalTestThreshold();

  it('usa 75% por defecto', () => {
    delete process.env.TECHNICAL_TEST_MATCH_THRESHOLD;
    expect(threshold.getMinimumMatchPercentage()).toBe(75);
  });

  it('bloquea en 74%', () => {
    expect(threshold.isEnabled(74, 75)).toBe(false);
  });

  it('habilita en exactamente 75%', () => {
    expect(threshold.isEnabled(75, 75)).toBe(true);
  });

  it('habilita en 76%', () => {
    expect(threshold.isEnabled(76, 75)).toBe(true);
  });
});
