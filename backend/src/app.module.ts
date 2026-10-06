import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { DatabaseModule } from './infrastructure/database/database.module.js';
import { SupabaseModule } from './infrastructure/supabase/supabase.module.js';
import { AuthModule } from './modules/auth/auth.module.js';
import { CandidatesModule } from './modules/candidates/candidates.module.js';
import { HealthModule } from './modules/health/health.module.js';
import { ResumeIntelligenceModule } from './modules/resume-intelligence/resume-intelligence.module.js';
import { VacanciesModule } from './modules/vacancies/vacancies.module.js';
import { InterviewsModule } from './modules/interviews/interviews.module.js';
import { InterviewAnalysisModule } from './modules/interview-analysis/interview-analysis.module.js';
import { TechnicalTestAccessModule } from './modules/technical-test-access/technical-test-access.module.js';

@Module({
  imports: [
    EventEmitterModule.forRoot(),
    DatabaseModule,
    SupabaseModule,
    AuthModule,
    CandidatesModule,
    ResumeIntelligenceModule,
    VacanciesModule,
    InterviewsModule,
    InterviewAnalysisModule,
    TechnicalTestAccessModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
