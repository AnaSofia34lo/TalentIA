CREATE TABLE "interview_video_markers" (
    "id" TEXT NOT NULL,
    "interviewId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "timestampMs" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "interview_video_markers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "interview_video_markers_interviewId_questionId_key" ON "interview_video_markers"("interviewId", "questionId");
CREATE INDEX "interview_video_markers_interviewId_timestampMs_idx" ON "interview_video_markers"("interviewId", "timestampMs");

ALTER TABLE "interview_video_markers" ADD CONSTRAINT "interview_video_markers_interviewId_fkey" FOREIGN KEY ("interviewId") REFERENCES "interviews"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "interview_video_markers" ADD CONSTRAINT "interview_video_markers_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "interview_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
