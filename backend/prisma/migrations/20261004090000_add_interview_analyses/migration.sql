CREATE TABLE "interview_analyses" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "technicalInterviewId" TEXT,
    "behavioralInterviewId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "technicalScore" DOUBLE PRECISION,
    "behavioralScore" DOUBLE PRECISION,
    "overallScore" DOUBLE PRECISION,
    "technicalSummary" TEXT,
    "behavioralSummary" TEXT,
    "strengths" JSONB,
    "improvements" JSONB,
    "recommendation" TEXT,
    "failureReason" TEXT,
    "analyzedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "interview_analyses_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "interview_analyses_applicationId_key" ON "interview_analyses"("applicationId");
CREATE INDEX "interview_analyses_status_idx" ON "interview_analyses"("status");

ALTER TABLE "interview_analyses" ADD CONSTRAINT "interview_analyses_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "candidate_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
