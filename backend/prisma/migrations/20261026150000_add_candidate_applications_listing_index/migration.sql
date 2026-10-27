CREATE INDEX "candidate_applications_candidateId_submittedAt_idx"
ON "candidate_applications"("candidateId", "submittedAt" DESC);
