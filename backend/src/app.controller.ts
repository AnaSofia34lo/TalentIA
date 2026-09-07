import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from './common/decorators/public.decorator.js';

@ApiTags('Sistema')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Obtiene el estado básico de la API' })
  @ApiResponse({ status: 200, description: 'API disponible', schema: { example: 'Hello World!' } })
  getHello(): string {
    return this.appService.getHello();
  }
}
