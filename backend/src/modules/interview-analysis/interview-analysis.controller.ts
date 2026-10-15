import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { RunInterviewAnalysisDto } from './dto/run-interview-analysis.dto.js';
import { InterviewAnalysisService } from './interview-analysis.service.js';

const analysisExample = {
  id: '1a72b792-d071-42dd-9124-f2bd1a1fc16c',
  status: 'completed',
  technicalScore: 86,
  behavioralScore: 81,
  overallScore: 84,
  technicalSummary:
    'Demostró dominio práctico de APIs REST y pruebas automatizadas.',
  behavioralSummary:
    'Comunicó ejemplos concretos y mantuvo una estructura clara.',
  strengths: [
    'Explica decisiones técnicas con claridad',
    'Relaciona sus respuestas con casos reales',
  ],
  improvements: ['Profundizar la estrategia de observabilidad'],
  recommendation:
    'Perfil con buena correspondencia para continuar a revisión humana.',
  analyzedAt: '2026-10-04T14:00:00.000Z',
  application: {
    id: 'c3d58a33-3d9a-4ca6-a49f-6d9ef05edbbd',
    vacancy: {
      title: 'Desarrollador Backend',
      organization: 'Innovaciones Andinas S.A.S.',
    },
  },
};

@ApiTags('Análisis de entrevistas IA')
@ApiBearerAuth('JWT-auth')
@Controller()
export class InterviewAnalysisController {
  constructor(private readonly analyses: InterviewAnalysisService) {}

  @Get('candidate/interview-analyses')
  @Roles('candidate')
  @ApiOperation({
    summary: 'Consulta los análisis de IA de las entrevistas propias',
    description:
      'Solo devuelve resultados de postulaciones pertenecientes al candidato autenticado.',
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis disponibles, en proceso o fallidos.',
    schema: { type: 'array', example: [analysisExample] },
  })
  @ApiResponse({
    status: 401,
    description: 'JWT ausente, inválido o expirado.',
  })
  @ApiResponse({ status: 403, description: 'Solo candidatos.' })
  listCandidate(@CurrentUser('id') candidateId: string) {
    return this.analyses.getCandidateAnalyses(candidateId);
  }

  @Get('candidate/applications/:applicationId/interview-analysis')
  @Roles('candidate')
  @ApiOperation({
    summary:
      'Consulta el porcentaje de compatibilidad de una postulación propia',
    description:
      'Devuelve el resultado de entrevistas de la postulación autenticada, incluyendo si aún no está disponible.',
  })
  @ApiParam({
    name: 'applicationId',
    example: 'c3d58a33-3d9a-4ca6-a49f-6d9ef05edbbd',
    description: 'UUID de la postulación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Compatibilidad de entrevistas y estado del análisis.',
    schema: { example: { ...analysisExample, overallScore: 84 } },
  })
  @ApiResponse({
    status: 404,
    description: 'La postulación no existe o no pertenece al candidato.',
  })
  getCandidate(
    @CurrentUser('id') candidateId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.analyses.getCandidateAnalysis(candidateId, applicationId);
  }

  @Post('candidate/applications/:applicationId/interview-analysis')
  @Roles('candidate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecuta el analisis de IA de las entrevistas propias',
    description:
      'Permite al candidato disparar o reintentar el Match IA cuando ya completo la entrevista tecnica y la de habilidades blandas.',
  })
  @ApiParam({
    name: 'applicationId',
    example: 'c3d58a33-3d9a-4ca6-a49f-6d9ef05edbbd',
  })
  @ApiBody({
    type: RunInterviewAnalysisDto,
    examples: {
      normal: { value: { force: false } },
      rerun: { value: { force: true } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Analisis finalizado o resultado existente.',
    schema: { example: analysisExample },
  })
  @ApiResponse({
    status: 400,
    description: 'Faltan entrevistas completas o Gemini no pudo analizar.',
  })
  runCandidate(
    @CurrentUser('id') candidateId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: RunInterviewAnalysisDto,
  ) {
    return this.analyses.analyzeForCandidate(
      candidateId,
      applicationId,
      dto.force ?? true,
    );
  }

  @Post('recruiter/applications/:applicationId/interview-analysis')
  @Roles('recruiter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Ejecuta o repite el análisis de IA de una postulación',
    description:
      'Analiza las respuestas técnicas y el video conductual. El recruiter solo puede analizar postulaciones de su organización.',
  })
  @ApiParam({
    name: 'applicationId',
    example: 'c3d58a33-3d9a-4ca6-a49f-6d9ef05edbbd',
    description: 'UUID de la postulación.',
  })
  @ApiBody({
    type: RunInterviewAnalysisDto,
    examples: {
      normal: { value: { force: false } },
      rerun: { value: { force: true } },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Análisis finalizado o resultado existente.',
    schema: { example: analysisExample },
  })
  @ApiResponse({
    status: 400,
    description:
      'Falta una entrevista completada, el video excede el límite o Gemini no está disponible.',
  })
  @ApiResponse({
    status: 403,
    description: 'Solo recruiters de la organización propietaria.',
  })
  run(
    @CurrentUser('id') recruiterId: string,
    @Param('applicationId') applicationId: string,
    @Body() dto: RunInterviewAnalysisDto,
  ) {
    return this.analyses.analyzeForRecruiter(
      recruiterId,
      applicationId,
      dto.force,
    );
  }

  @Get('recruiter/applications/:applicationId/interview-analysis')
  @Roles('recruiter')
  @ApiOperation({
    summary: 'Consulta el análisis de IA de una postulación de la organización',
  })
  @ApiParam({
    name: 'applicationId',
    example: 'c3d58a33-3d9a-4ca6-a49f-6d9ef05edbbd',
    description: 'UUID de la postulación.',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultado del análisis.',
    schema: { example: analysisExample },
  })
  @ApiResponse({
    status: 404,
    description:
      'No existe el análisis o la postulación no pertenece a la organización.',
  })
  get(
    @CurrentUser('id') recruiterId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.analyses.getRecruiterAnalysis(recruiterId, applicationId);
  }
}
