import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class RunInterviewAnalysisDto {
  @ApiPropertyOptional({
    example: false,
    description: 'Cuando es true, vuelve a analizar aun si existe un resultado final.',
  })
  @IsOptional()
  @IsBoolean()
  force?: boolean;
}
