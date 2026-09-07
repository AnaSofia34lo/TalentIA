import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Sistema')
@Controller('health')
export class HealthController {
  @Get()
  @Public()
  @ApiOperation({
    summary: 'Verifica que la API esté disponible',
    description: 'Endpoint de salud para validar que el backend está corriendo correctamente.',
  })
  @ApiResponse({
    status: 200,
    description: 'API disponible',
    schema: {
      type: 'object',
      example: {
        status: 'ok',
        timestamp: '2026-09-01T00:00:00.000Z',
      },
    },
  })
  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
