/** Match IA de entrevistas (HU-33): 60% técnico + 40% habilidades blandas. */
export function computeInterviewMatchPercentage(
  technicalScore: number,
  behavioralScore: number,
): number {
  const technical = Math.max(0, Math.min(100, technicalScore));
  const behavioral = Math.max(0, Math.min(100, behavioralScore));
  return Math.round(technical * 0.6 + behavioral * 0.4);
}
