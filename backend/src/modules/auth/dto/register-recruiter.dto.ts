import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MinLength } from 'class-validator';

export class RegisterRecruiterDto {
  @ApiProperty({ example: 'talentia@empresa.co', description: 'Correo de acceso del recruiter.' })
  @IsEmail({}, { message: 'Ingresa un correo válido con texto antes del @ y un dominio válido.' })
  @IsNotEmpty({ message: 'Campo obligatorio' })
  email: string;

  @ApiProperty({ example: 'Empresa123!', description: 'Contraseña con mínimo 8 caracteres, mayúscula, minúscula, número y carácter especial.' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe contener una letra mayúscula.' })
  @Matches(/[a-z]/, { message: 'La contraseña debe contener una letra minúscula.' })
  @Matches(/[0-9]/, { message: 'La contraseña debe contener números.' })
  @Matches(/[!@#$%^&*.,-]/, { message: 'La contraseña debe contener un carácter especial.' })
  password: string;

  @ApiProperty({ example: 'Empresa123!', description: 'Debe coincidir exactamente con password.' })
  @IsString()
  @IsNotEmpty({ message: 'Campo obligatorio' })
  confirmPassword: string;

  @ApiProperty({ example: 'Innovaciones Andinas S.A.S.', description: 'Nombre legal o comercial de la empresa. Se guarda en users.fullName y organizations.name.' })
  @IsString()
  @IsNotEmpty({ message: 'Campo obligatorio' })
  @Length(2, 120, { message: 'El nombre de la empresa debe tener entre 2 y 120 caracteres.' })
  fullName: string;
}
