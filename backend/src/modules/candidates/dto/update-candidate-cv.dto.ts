import { Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsString, Length, Max, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCandidateCvDto {
  @ApiProperty({ example: 'Diseñadora UX/UI' })
  @IsString()
  @ApiProperty({ example: 'Estudio Croma' })
  @IsNotEmpty({ message: 'El cargo actual o principal es obligatorio.' })
  @Length(2, 120)
  professionalTitle: string;

  @IsString()
  @IsNotEmpty({ message: 'La empresa es obligatoria.' })
  @Length(2, 120)
  currentCompany: string;

  @Type(() => Number)
  @ApiProperty({ example: 4, minimum: 0, maximum: 60, type: Number })
  @IsInt({ message: 'Los años de experiencia deben ser un número entero.' })
  @Min(0)
  @Max(60)
  yearsOfExperience: number;

  @IsString()
  @ApiProperty({ example: 'Diseñadora UX/UI con experiencia en productos digitales B2B.' })
  @IsNotEmpty({ message: 'El resumen profesional es obligatorio.' })
  @Length(20, 2000)
  summary: string;
}
