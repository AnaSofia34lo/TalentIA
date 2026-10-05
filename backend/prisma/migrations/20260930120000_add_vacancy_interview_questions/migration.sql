CREATE TABLE "vacancy_interview_questions" (
    "id" TEXT NOT NULL,
    "vacancyId" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vacancy_interview_questions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "vacancy_interview_questions_vacancyId_sortOrder_key" ON "vacancy_interview_questions"("vacancyId", "sortOrder");
CREATE INDEX "vacancy_interview_questions_vacancyId_category_idx" ON "vacancy_interview_questions"("vacancyId", "category");

ALTER TABLE "vacancy_interview_questions" ADD CONSTRAINT "vacancy_interview_questions_vacancyId_fkey" FOREIGN KEY ("vacancyId") REFERENCES "vacancies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
