import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../../common/decorators/current-user.decorator.js';
import { Roles } from '../../../common/decorators/roles.decorator.js';
import { TechnicalTestAccessService } from '../application/technical-test-access.service.js';

@ApiTags('Prueba tecnica')
@ApiBearerAuth('JWT-auth')
@Controller()
export class TechnicalTestAccessController {
  constructor(
    private readonly technicalTestAccess: TechnicalTestAccessService,
  ) {}

  @Get('candidate/applications/:applicationId/technical-test-access')
  @Roles('candidate')
  @ApiOperation({
    summary:
      'Consulta si la prueba tecnica esta habilitada para una postulacion',
    description:
      'Evalua el Match IA (overallScore) contra el umbral configurable (por defecto 75%).',
  })
  @ApiParam({ name: 'applicationId' })
  @ApiResponse({ status: 200, description: 'Estado de habilitacion' })
  @ApiResponse({ status: 404, description: 'Postulacion no encontrada' })
  getAccess(
    @CurrentUser('id') candidateId: string,
    @Param('applicationId') applicationId: string,
  ) {
    return this.technicalTestAccess.getAccessForCandidate(
      candidateId,
      applicationId,
    );
  }
}
