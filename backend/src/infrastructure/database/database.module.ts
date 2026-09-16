import { Global, Module } from '@nestjs/common';
import { DatabaseBootstrapService } from './database-bootstrap.service.js';
import { DemoRecruiterSeedService } from './demo-recruiter.seed.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, DatabaseBootstrapService, DemoRecruiterSeedService],
  exports: [PrismaService, DatabaseBootstrapService],
})
export class DatabaseModule {}
