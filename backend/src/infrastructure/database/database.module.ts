import { Global, Module } from '@nestjs/common';
import { DatabaseBootstrapService } from './database-bootstrap.service.js';
import { PrismaService } from './prisma.service.js';

@Global()
@Module({
  providers: [PrismaService, DatabaseBootstrapService],
  exports: [PrismaService, DatabaseBootstrapService],
})
export class DatabaseModule {}
