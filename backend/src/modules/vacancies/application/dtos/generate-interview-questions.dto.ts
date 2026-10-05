import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class GenerateInterviewQuestionsDto {
  @ApiProperty({ example: 'Desarrollador de Software' })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(160)
  name: string;

  @ApiProperty({ example: 'Responsable de diseñar y mantener servicios backend.' })
  @IsString()
  @IsNotEmpty()
  @MinLength(20)
  @MaxLength(5000)
  description: string;

  @ApiProperty({ example: 6500000 })
  @IsInt()
  @Min(0)
  salary: number;

  @ApiProperty({ example: ['Java', 'Python', 'NestJS'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  technicalSkills?: string[];

  @ApiProperty({ example: ['Comunicación', 'Autonomía'], required: false })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  softSkills?: string[];

  @ApiProperty({ example: 'Tecnología', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  area?: string;

  @ApiProperty({ example: 'Senior', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  level?: string;

  @ApiProperty({ example: 'Híbrido', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  modality?: string;

  @ApiProperty({ example: 'Delimitar alcance; analizar riesgos; proponer solución.', required: false })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  useCases?: string;
}
