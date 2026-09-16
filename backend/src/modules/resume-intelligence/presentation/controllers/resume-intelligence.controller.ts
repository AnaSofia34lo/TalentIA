import { Controller, Get, Inject } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../../../common/decorators/current-user.decorator.js';
import { RESUME_REPOSITORY } from '../../application/ports/resume-repository.port.js';
import type { ResumeRepositoryPort } from '../../application/ports/resume-repository.port.js';

@ApiTags('Candidato — Inteligencia de CV')
@ApiBearerAuth('JWT-auth')
@Roles('candidate')
@Controller('candidate/resume')
export class ResumeIntelligenceController {
  constructor(
    @Inject(RESUME_REPOSITORY)
    private readonly resumeRepository: ResumeRepositoryPort,
  ) {}

  @Get('analysis')
  @ApiOperation({
    summary:
      'Consulta la experiencia laboral, certificaciones y skills extraídos por IA del CV',
  })
  @ApiResponse({
    status: 200,
    description: 'Resultados del último análisis de la hoja de vida',
    schema: {
      example: {
        workExperiences: [
          {
            id: 'uuid',
            company: 'Estudio Croma',
            role: 'Diseñadora UX/UI',
            startDate: '2021-01',
            endDate: 'Actual',
            description: 'Diseño de productos B2B.',
          },
        ],
        certifications: [
          {
            id: 'uuid',
            name: 'Google UX Design',
            issuer: 'Coursera',
            date: '2022',
          },
        ],
        technicalSkills: [
          { id: 'uuid', name: 'Figma', estimatedProficiency: 90 },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'El usuario autenticado no es candidato' })
  async getAnalysis(@CurrentUser('id') userId: string) {
    const snapshot = await this.resumeRepository.findByUserId(userId);
    return {
      workExperiences: snapshot.workExperiences.map((item) => ({
        id: item.id,
        company: item.company,
        role: item.role,
        startDate: item.startDate,
        endDate: item.endDate,
        description: item.description,
      })),
      certifications: snapshot.certifications.map((item) => ({
        id: item.id,
        name: item.name,
        issuer: item.issuer,
        date: item.date,
      })),
      technicalSkills: snapshot.technicalSkills.map((item) => ({
        id: item.id,
        name: item.name,
        estimatedProficiency: item.estimatedProficiency,
      })),
    };
  }
}
