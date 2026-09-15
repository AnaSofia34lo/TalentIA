import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

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
}
