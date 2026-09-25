import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateVacancyDto {
  @ApiProperty({
    example: 'Desarrollador de Software (Java & Python)',
    description: 'Nombre / cargo de la vacante (HU-09).',
    minLength: 3,
    maxLength: 160,
  })
  @IsString()
  @IsNotEmpty({ message: 'Campo obligatorio' })
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres.' })
  @MaxLength(160, { message: 'El nombre no puede superar 160 caracteres.' })
  name: string;

  @ApiProperty({
    example:
      'Buscamos una persona con dominio de Java y Python que participe en el levantamiento de requisitos y ejecute el alcance acordado.',
    description: 'Descripción del cargo (HU-10).',
    minLength: 20,
    maxLength: 5000,
  })
  @IsString()
  @IsNotEmpty({ message: 'Campo obligatorio' })
  @MinLength(20, {
    message: 'La descripción debe tener al menos 20 caracteres.',
  })
  @MaxLength(5000, {
    message: 'La descripción no puede superar 5000 caracteres.',
  })
  description: string;

  @ApiProperty({
    example: 6500000,
    description: 'Salario mensual ofrecido en pesos colombianos.',
    minimum: 0,
  })
  @IsInt({ message: 'El salario debe ser un número entero.' })
  @Min(0, { message: 'El salario no puede ser negativo.' })
  salary: number;

  @ApiProperty({
    example: ['Java', 'Python', 'NestJS'],
    description: 'Habilidades técnicas usadas para calcular Match IA (HU-08).',
    required: false,
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(50)
  @IsString({ each: true })
  @MaxLength(120, { each: true })
  technicalSkills?: string[];
}
