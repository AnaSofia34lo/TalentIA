import { PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CreateVacancyDto } from './create-vacancy.dto.js';

export class UpdateVacancyDto extends PartialType(CreateVacancyDto) {
  @IsOptional()
  @IsIn(['draft', 'published', 'paused', 'closed'], {
    message: 'El estado de la vacante no es válido.',
  })
  status?: 'draft' | 'published' | 'paused' | 'closed';
}