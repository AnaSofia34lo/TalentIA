ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'applied';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'completed';
ALTER TYPE "ApplicationStatus" ADD VALUE IF NOT EXISTS 'technical_test';

ALTER TABLE "candidate_applications" ALTER COLUMN "status" SET DEFAULT 'applied';
