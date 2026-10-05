import { Body, Controller, MaxFileSizeValidator, Param, ParseFilePipe, Patch, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { InterviewsService } from './interviews.service.js';
import { StartTechnicalInterviewDto } from './dto/start-technical-interview.dto.js';
import { SubmitInterviewAnswerDto } from './dto/submit-interview-answer.dto.js';
import { MarkVideoQuestionDto } from './dto/mark-video-question.dto.js';

@ApiTags('Entrevistas')
@ApiBearerAuth('JWT-auth')
@Roles('candidate')
@Controller('candidate/interviews')
export class InterviewsController {
  constructor(private readonly interviews: InterviewsService) {}

  @Post('technical/start')
  @ApiOperation({ summary: 'Inicia o recupera la entrevista técnica de una postulación' })
  startTechnical(@CurrentUser('id') candidateId: string, @Body() dto: StartTechnicalInterviewDto) {
    return this.interviews.startTechnical(candidateId, dto);
  }

  @Post('behavioral/start')
  @ApiOperation({ summary: 'Inicia o recupera la entrevista de habilidades blandas' })
  startBehavioral(@CurrentUser('id') candidateId: string, @Body() dto: StartTechnicalInterviewDto) {
    return this.interviews.startBehavioral(candidateId, dto);
  }

  @Post(':interviewId/answers')
  @ApiOperation({ summary: 'Guarda una respuesta de entrevista técnica' })
  submitAnswer(
    @CurrentUser('id') candidateId: string,
    @Param('interviewId') interviewId: string,
    @Body() dto: SubmitInterviewAnswerDto,
  ) {
    return this.interviews.submitAnswer(candidateId, interviewId, dto);
  }

  @Post(':interviewId/video-markers')
  @ApiOperation({ summary: 'Marca el momento del video correspondiente a una pregunta' })
  markVideoQuestion(
    @CurrentUser('id') candidateId: string,
    @Param('interviewId') interviewId: string,
    @Body() dto: MarkVideoQuestionDto,
  ) {
    return this.interviews.markVideoQuestion(candidateId, interviewId, dto);
  }

  @Patch(':interviewId/complete')
  @ApiOperation({ summary: 'Finaliza una entrevista técnica completa' })
  complete(@CurrentUser('id') candidateId: string, @Param('interviewId') interviewId: string) {
    return this.interviews.complete(candidateId, interviewId);
  }

  @Post(':interviewId/video')
  @UseInterceptors(FileInterceptor('video'))
  @ApiOperation({ summary: 'Guarda el video de la entrevista de habilidades blandas' })
  uploadVideo(
    @CurrentUser('id') candidateId: string,
    @Param('interviewId') interviewId: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 })], fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.interviews.uploadVideo(candidateId, interviewId, file);
  }
}
