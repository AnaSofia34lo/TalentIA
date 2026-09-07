import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';

@Injectable()
export class DatabaseBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DatabaseBootstrapService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap() {
    try {
      await this.prisma.$connect();
      this.logger.log('✅ Conexión a la base de datos establecida.');

      const tables = await this.prisma.$queryRaw<Array<{ table_name: string }>>`
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
      `;

      const tableNames = new Set(tables.map((table) => table.table_name));
      const requiredTables = [
        'organizations',
        'users',
        'candidate_profiles',
        'vacancies',
        'vacancy_requirements',
        'vacancy_skills',
        'candidate_applications',
        'interviews',
        'interview_questions',
        'interview_answers',
        'evaluations',
        'storage_assets',
        'audit_logs',
      ];

      const missingTables = requiredTables.filter(
        (table) => !tableNames.has(table),
      );

      if (missingTables.length === 0) {
        this.logger.log('✅ Las tablas ya existen en la base de datos.');
        return;
      }

      this.logger.log(
        `⚠️ Faltan tablas: ${missingTables.join(', ')}. Creándolas...`,
      );

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS organizations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          status TEXT NOT NULL DEFAULT 'active',
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email TEXT NOT NULL UNIQUE,
          "passwordHash" TEXT,
          "fullName" TEXT NOT NULL,
          phone TEXT,
          role TEXT NOT NULL DEFAULT 'candidate',
          "authProvider" TEXT NOT NULL DEFAULT 'local',
          "isActive" BOOLEAN NOT NULL DEFAULT true,
          "candidateStatus" TEXT NOT NULL DEFAULT 'active',
          "organizationId" UUID,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT users_organization_fk FOREIGN KEY ("organizationId") REFERENCES organizations(id) ON DELETE SET NULL
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS candidate_profiles (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL UNIQUE,
          "professionalTitle" TEXT,
          summary TEXT,
          "yearsOfExperience" INTEGER,
          location TEXT,
          "linkedinUrl" TEXT,
          "portfolioUrl" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT candidate_profiles_user_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vacancies (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "organizationId" UUID NOT NULL,
          "createdByUserId" UUID NOT NULL,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          requirements TEXT,
          status TEXT NOT NULL DEFAULT 'draft',
          "publishedAt" TIMESTAMPTZ,
          "deadlineAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT vacancies_organization_fk FOREIGN KEY ("organizationId") REFERENCES organizations(id) ON DELETE CASCADE,
          CONSTRAINT vacancies_creator_fk FOREIGN KEY ("createdByUserId") REFERENCES users(id) ON DELETE RESTRICT
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vacancy_requirements (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "vacancyId" UUID NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          "isMandatory" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT vacancy_requirements_vacancy_fk FOREIGN KEY ("vacancyId") REFERENCES vacancies(id) ON DELETE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS vacancy_skills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "vacancyId" UUID NOT NULL,
          name TEXT NOT NULL,
          weight INTEGER NOT NULL DEFAULT 1,
          CONSTRAINT vacancy_skills_vacancy_fk FOREIGN KEY ("vacancyId") REFERENCES vacancies(id) ON DELETE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS candidate_applications (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "candidateId" UUID NOT NULL,
          "vacancyId" UUID NOT NULL,
          "organizationId" UUID NOT NULL,
          status TEXT NOT NULL DEFAULT 'pending',
          "matchScore" DOUBLE PRECISION,
          "coverLetter" TEXT,
          "submittedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "reviewedAt" TIMESTAMPTZ,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT candidate_applications_candidate_fk FOREIGN KEY ("candidateId") REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT candidate_applications_vacancy_fk FOREIGN KEY ("vacancyId") REFERENCES vacancies(id) ON DELETE CASCADE,
          CONSTRAINT candidate_applications_organization_fk FOREIGN KEY ("organizationId") REFERENCES organizations(id) ON DELETE CASCADE,
          CONSTRAINT candidate_applications_unique UNIQUE ("candidateId", "vacancyId")
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS interviews (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "applicationId" UUID NOT NULL,
          "vacancyId" UUID NOT NULL,
          "candidateId" UUID NOT NULL,
          "interviewerId" UUID,
          type TEXT NOT NULL DEFAULT 'live_ai',
          status TEXT NOT NULL DEFAULT 'scheduled',
          "scheduledAt" TIMESTAMPTZ,
          "startedAt" TIMESTAMPTZ,
          "completedAt" TIMESTAMPTZ,
          summary TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT interviews_application_fk FOREIGN KEY ("applicationId") REFERENCES candidate_applications(id) ON DELETE CASCADE,
          CONSTRAINT interviews_vacancy_fk FOREIGN KEY ("vacancyId") REFERENCES vacancies(id) ON DELETE CASCADE,
          CONSTRAINT interviews_candidate_fk FOREIGN KEY ("candidateId") REFERENCES users(id) ON DELETE CASCADE,
          CONSTRAINT interviews_interviewer_fk FOREIGN KEY ("interviewerId") REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS interview_questions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "interviewId" UUID NOT NULL,
          category TEXT NOT NULL,
          prompt TEXT NOT NULL,
          "expectedAnswer" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT interview_questions_interview_fk FOREIGN KEY ("interviewId") REFERENCES interviews(id) ON DELETE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS interview_answers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "interviewId" UUID NOT NULL,
          "questionId" UUID NOT NULL,
          "candidateId" UUID NOT NULL,
          "responseText" TEXT,
          "videoUrl" TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT interview_answers_interview_fk FOREIGN KEY ("interviewId") REFERENCES interviews(id) ON DELETE CASCADE,
          CONSTRAINT interview_answers_question_fk FOREIGN KEY ("questionId") REFERENCES interview_questions(id) ON DELETE CASCADE,
          CONSTRAINT interview_answers_candidate_fk FOREIGN KEY ("candidateId") REFERENCES users(id) ON DELETE CASCADE
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS evaluations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "applicationId" UUID NOT NULL,
          "interviewId" UUID,
          "reviewerId" UUID,
          type TEXT NOT NULL,
          score DOUBLE PRECISION,
          summary TEXT,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT evaluations_application_fk FOREIGN KEY ("applicationId") REFERENCES candidate_applications(id) ON DELETE CASCADE,
          CONSTRAINT evaluations_interview_fk FOREIGN KEY ("interviewId") REFERENCES interviews(id) ON DELETE SET NULL,
          CONSTRAINT evaluations_reviewer_fk FOREIGN KEY ("reviewerId") REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS storage_assets (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID,
          "bucketName" TEXT NOT NULL,
          "fileName" TEXT NOT NULL,
          "fileUrl" TEXT NOT NULL,
          "mimeType" TEXT,
          kind TEXT NOT NULL,
          "sizeBytes" INTEGER,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT storage_assets_user_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      await this.prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          action TEXT NOT NULL,
          "entityType" TEXT NOT NULL,
          "entityId" TEXT,
          "userId" UUID,
          details JSONB,
          "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT audit_logs_user_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
        );
      `);

      this.logger.log('✅ Tablas creadas correctamente si faltaban.');
    } catch (error) {
      this.logger.error(
        '❌ Error al conectar o inicializar la base de datos.',
        error instanceof Error ? error.message : String(error),
      );
    }
  }
}
