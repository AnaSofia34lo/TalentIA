import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import { CreateVacancyDto } from '../../application/dtos/create-vacancy.dto.js';
import { CreateVacancyUseCase } from '../../application/use-cases/create-vacancy.use-case.js';
import { UpdateVacancyDto } from '../../application/dtos/update-vacancy.dto.js';
import { UpdateVacancyUseCase } from '../../application/use-cases/update-vacancy.use-case.js';
import { ListRecruiterVacanciesUseCase } from '../../application/use-cases/list-recruiter-vacancies.use-case.js';
import { ListPublishedVacanciesUseCase } from '../../application/use-cases/list-published-vacancies.use-case.js';
import { CalculateVacancyMatchUseCase } from '../../application/use-cases/calculate-vacancy-match.use-case.js';
import { GenerateInterviewQuestionsUseCase } from '../../application/use-cases/generate-interview-questions.use-case.js';
import { GenerateInterviewQuestionsDto } from '../../application/dtos/generate-interview-questions.dto.js';
import { ListVacancyApplicantsUseCase } from '../../application/use-cases/list-vacancy-applicants.use-case.js';
import type { Vacancy } from '../../domain/entities/vacancy.entity.js';

@ApiTags('Vacantes')
@ApiBearerAuth('JWT-auth')
@Controller('vacancies')
export class VacanciesController {
  constructor(
    private readonly createVacancy: CreateVacancyUseCase,
    private readonly updateVacancy: UpdateVacancyUseCase,
    private readonly listRecruiterVacancies: ListRecruiterVacanciesUseCase,
    private readonly listPublishedVacancies: ListPublishedVacanciesUseCase,
    private readonly calculateVacancyMatch: CalculateVacancyMatchUseCase,
    private readonly generateInterviewQuestions: GenerateInterviewQuestionsUseCase,
    private readonly listVacancyApplicants: ListVacancyApplicantsUseCase,
  ) {}

  @Get('available')
  @Roles('candidate')
  @ApiOperation({
    summary: 'Lista vacantes publicadas (vista candidato)',
    description:
      'Devuelve nombre y descripción de vacantes con status published para que el candidato las vea.',
  })
  @ApiResponse({ status: 200, description: 'Vacantes publicadas' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'El usuario autenticado no es candidato' })
  async listAvailable() {
    const vacancies = await this.listPublishedVacancies.execute();
    return vacancies.map((vacancy) => this.serialize(vacancy));
  }

  @Get(':vacancyId/applications')
  @Roles('recruiter')
  @ApiOperation({
    summary: 'Consulta candidatos postulados y ranking IA de una vacante',
    description: 'Devuelve todos los candidatos de la vacante ordenados por score descendente. Los tres primeros incluyen medal gold, silver o bronze.',
  })
  @ApiParam({ name: 'vacancyId', example: '4bd3f7f1-1d8c-4e4d-9f78-fb4fb3cc90ef', description: 'UUID de la vacante.' })
  @ApiResponse({
    status: 200,
    description: 'Candidatos completos y ranking de los tres mejores.',
    schema: {
      example: {
        vacancy: { id: '4bd3f7f1-1d8c-4e4d-9f78-fb4fb3cc90ef', name: 'Desarrollador Backend', description: 'Construcción de APIs.', status: 'published', organization: 'Innovaciones Andinas S.A.S.' },
        totalCandidates: 4,
        ranking: [
          { applicationId: 'a1', candidateId: 'u1', fullName: 'Mariana Torres', score: 95, rank: 1, medal: 'gold', scoreSource: 'interview_ai', status: 'reviewed' },
          { applicationId: 'a2', candidateId: 'u2', fullName: 'Andrés Salazar', score: 89, rank: 2, medal: 'silver', scoreSource: 'stored_match', status: 'shortlisted' },
          { applicationId: 'a3', candidateId: 'u3', fullName: 'Camila Restrepo', score: 83, rank: 3, medal: 'bronze', scoreSource: 'cv_skills', status: 'applied' },
        ],
        candidates: [],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado.' })
  @ApiResponse({ status: 403, description: 'Solo recruiters.' })
  @ApiResponse({ status: 404, description: 'La vacante no existe o no pertenece a la organización.' })
  async applicants(
    @CurrentUser('id') recruiterId: string,
    @Param('vacancyId') vacancyId: string,
    @CurrentUser('organizationId') organizationId?: string,
  ) {
    return this.listVacancyApplicants.execute(recruiterId, vacancyId, organizationId);
  }

  @Get(':vacancyId/match')
  @Roles('candidate')
  @ApiOperation({
    summary: 'Calcula Match IA con habilidades técnicas extraídas del CV',
  })
  @ApiResponse({
    status: 200,
    description: 'Porcentaje de compatibilidad y evidencia trazable por habilidad',
  })
  async match(
    @Param('vacancyId') vacancyId: string,
    @CurrentUser('id') candidateId: string,
  ) {
    return this.calculateVacancyMatch.execute(vacancyId, candidateId);
  }

  @Get()
  @Roles('recruiter')
  @ApiOperation({
    summary: 'Lista las vacantes del reclutador autenticado',
    description:
      'Devuelve nombre (title) y descripción creados en HU-09/HU-10, ordenados del más reciente al más antiguo.',
  })
  @ApiResponse({ status: 200, description: 'Listado de vacantes del reclutador' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'El usuario autenticado no es reclutador' })
  async list(@CurrentUser('id') recruiterId: string) {
    const vacancies = await this.listRecruiterVacancies.execute(recruiterId);
    return vacancies.map((vacancy) => this.serialize(vacancy));
  }

  @Post()
  @Roles('recruiter')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Publica una vacante (nombre y descripción)',
    description:
      'HU-09 y HU-10. Crea y publica una vacante asociada al reclutador y su organización (status published).',
  })
  @ApiBody({ type: CreateVacancyDto })
  @ApiResponse({ status: 201, description: 'Vacante publicada' })
  @ApiResponse({ status: 400, description: 'Validación fallida o sin organización' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'El usuario autenticado no es reclutador' })
  async create(
    @CurrentUser('id') recruiterId: string,
    @Body() dto: CreateVacancyDto,
  ) {
    const vacancy = await this.createVacancy.execute(recruiterId, dto);
    return this.serialize(vacancy);
  }

  @Post('generate-interview-questions')
  @Roles('recruiter')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Genera 10 preguntas técnicas y 10 de habilidades blandas con IA' })
  async generateQuestions(@Body() dto: GenerateInterviewQuestionsDto) {
    return this.generateInterviewQuestions.execute(dto);
  }

  @Patch(':vacancyId')
  @Roles('recruiter')
  @ApiOperation({ summary: 'Edita una vacante y cambia su estado' })
  @ApiBody({ type: UpdateVacancyDto })
  async update(
    @Param('vacancyId') vacancyId: string,
    @CurrentUser('id') recruiterId: string,
    @Body() dto: UpdateVacancyDto,
  ) {
    const vacancy = await this.updateVacancy.execute(recruiterId, vacancyId, dto);
    return this.serialize(vacancy);
  }

  private serialize(vacancy: Vacancy) {
    return {
      id: vacancy.id,
      name: vacancy.name,
      description: vacancy.description,
      salary: vacancy.salary,
      requirements: vacancy.requirements,
      slug: vacancy.slug,
      status: vacancy.status,
      organizationId: vacancy.organizationId,
      createdByUserId: vacancy.createdByUserId,
      interviewQuestions: vacancy.interviewQuestions,
    };
  }
}
