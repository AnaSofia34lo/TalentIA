import { Injectable } from '@nestjs/common';

@Injectable()
export class TechnicalTestThreshold {
  getMinimumMatchPercentage(): number {
    const raw = process.env.TECHNICAL_TEST_MATCH_THRESHOLD;
    const parsed = raw === undefined || raw === '' ? 75 : Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      return 75;
    }
    return parsed;
  }

  isEnabled(
    matchPercentage: number,
    threshold = this.getMinimumMatchPercentage(),
  ): boolean {
    return matchPercentage >= threshold;
  }
}
