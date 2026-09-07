import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';

class LoginDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Inicia sesión y devuelve un JWT',
    description: 'Endpoint de autenticación para usuarios del sistema. Retorna un access token JWT con el rol del usuario.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          example: 'ana.ramirez@talentia.co',
          description: 'Correo electrónico del usuario.',
        },
        password: {
          type: 'string',
          example: 'Password123!',
          description: 'Contraseña del usuario.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso',
    schema: {
      type: 'object',
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        user: {
          id: 'demo-user-id',
          email: 'ana.ramirez@talentia.co',
          role: 'admin',
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  @ApiResponse({ status: 400, description: 'El correo o la contraseña no cumplen las validaciones requeridas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Get('me')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Obtiene el usuario autenticado',
    description: 'Valida el Bearer JWT emitido por Supabase y devuelve su identidad y rol.',
  })
  @ApiResponse({
    status: 200,
    description: 'Identidad autenticada',
    schema: {
      example: {
        id: '2e3d1d5c-6f5f-4d30-a9dd-4e4cfd4b4f87',
        email: 'ana.ramirez@talentia.co',
        role: 'admin',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Falta el token o es inválido/expiró' })
  me(@Req() request: { user: unknown }) {
    return request.user;
  }
}
