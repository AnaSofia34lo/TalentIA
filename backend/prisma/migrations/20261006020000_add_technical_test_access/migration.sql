-- AlterTable
ALTER TABLE "candidate_applications" ADD COLUMN IF NOT EXISTS "technicalTestEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "candidate_applications" ADD COLUMN IF NOT EXISTS "technicalTestEvaluatedAt" TIMESTAMP(3);
