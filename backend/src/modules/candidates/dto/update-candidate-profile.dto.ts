import { IsOptional, IsString, IsUrl, Length } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateCandidateProfileDto {
  @ApiProperty({ example: 'Camila Restrepo Gómez', description: 'Nombre completo visible en toda la plataforma.' })
  @IsString({ message: 'El nombre completo debe ser texto.' })
  @Length(2, 120, { message: 'El nombre completo debe tener entre 2 y 120 caracteres.' })
  fullName: string;

  @IsOptional()
  @ApiPropertyOptional({ example: '+57 300 123 4567' })
  @IsString({ message: 'El teléfono debe ser texto.' })
  @Length(7, 30, { message: 'El teléfono debe tener entre 7 y 30 caracteres.' })
  phone?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'Medellín' })
  @IsString()
  @Length(2, 100)
  location?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'https://www.linkedin.com/in/camila-restrepo' })
  @IsUrl({}, { message: 'LinkedIn debe ser una URL válida.' })
  linkedinUrl?: string;

  @IsOptional()
  @ApiPropertyOptional({ example: 'https://camilarestrepo.dev' })
  @IsUrl({}, { message: 'El portafolio debe ser una URL válida.' })
  portfolioUrl?: string;
}
