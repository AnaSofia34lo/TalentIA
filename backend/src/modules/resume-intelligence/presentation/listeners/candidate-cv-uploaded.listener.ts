import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AnalyzeCandidateResumeUseCase } from '../../application/use-cases/analyze-candidate-resume.use-case.js';

@Injectable()
export class CandidateCvUploadedListener {
  private readonly logger = new Logger(CandidateCvUploadedListener.name);

  constructor(private readonly analyzeResume: AnalyzeCandidateResumeUseCase) {}

  @OnEvent('candidate.cv.uploaded')
  async handle(payload: { userId: string; storageAssetId: string }) {
    this.logger.log(
      `Evento candidate.cv.uploaded recibido para user=${payload.userId}`,
    );
    await this.analyzeResume.executeSafe(payload);
  }
}
