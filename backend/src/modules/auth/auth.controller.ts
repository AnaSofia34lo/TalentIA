import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { Public } from '../../common/decorators/public.decorator.js';
import { AuthService } from './auth.service.js';
import { RegisterRecruiterDto } from './dto/register-recruiter.dto.js';

class LoginDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Campo obligatorio' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe contener una letra mayúscula.' })
  @Matches(/[a-z]/, { message: 'La contraseña debe contener una letra minúscula.' })
  @Matches(/[0-9]/, { message: 'La contraseña debe contener números.' })
  @Matches(/[!@#$%^&*.,-]/, { message: 'La contraseña debe contener un carácter especial.' })
  password: string;
}

class RegisterDto {
  @IsEmail({}, { message: 'Ingresa un correo válido con texto antes del @ y un dominio válido.' })
  @IsNotEmpty({ message: 'Campo obligatorio' })
  email: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres.' })
  @Matches(/[A-Z]/, { message: 'La contraseña debe contener una letra mayúscula.' })
  @Matches(/[a-z]/, { message: 'La contraseña debe contener una letra minúscula.' })
  @Matches(/[0-9]/, { message: 'La contraseña debe contener números.' })
  @Matches(/[!@#$%^&*.,-]/, { message: 'La contraseña debe contener un carácter especial.' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'Campo obligatorio' })
  confirmPassword: string;

  @IsOptional()
  @IsString()
  fullName?: string;
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
    description:
      'Endpoint compartido para candidatos y reclutadores. Autentica con Supabase, sincroniza app_metadata.role desde Prisma y retorna access token JWT con el rol del usuario (candidate o recruiter).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: {
          type: 'string',
          example: 'reclutador@prueba.com',
          description: 'Correo del candidato o reclutador ya registrado.',
        },
        password: {
          type: 'string',
          example: 'Reclutador123*',
          description: 'Contraseña del usuario.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso (candidato o reclutador)',
    schema: {
      type: 'object',
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'v1-refresh-token-example',
        token_type: 'Bearer',
        expires_in: 3600,
        expires_at: 1780000000,
        user: {
          id: '2e3d1d5c-6f5f-4d30-a9dd-4e4cfd4b4f87',
          email: 'reclutador@prueba.com',
          role: 'recruiter',
          organizationId: 'a7d6d5b4-0c3b-4f88-9a0f-2e2f7f7c4c11',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'La contraseña no coincide con la contraseña de la cuenta',
    schema: { example: { statusCode: 401, message: 'La contraseña no coincide con la contraseña de la cuenta' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Este correo no tiene una cuenta en TalentIA',
    schema: { example: { statusCode: 404, message: 'Este correo no tiene una cuenta en TalentIA' } },
  })
  @ApiResponse({ status: 400, description: 'El correo o la contraseña no cumplen las validaciones requeridas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto.email, dto.password);
  }

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra un candidato',
    description: 'Crea el usuario en Supabase Auth, sincroniza su registro en Prisma y devuelve un JWT de sesión.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password', 'confirmPassword'],
      properties: {
        email: { type: 'string', example: 'candidato@talentia.co' },
        password: { type: 'string', example: 'Talento123!' },
        confirmPassword: { type: 'string', example: 'Talento123!' },
        fullName: { type: 'string', example: 'Camila Restrepo' },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Cuenta creada y sesión iniciada',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'v1-refresh-token-example',
        token_type: 'Bearer',
        expires_in: 3600,
        user: { id: '2e3d1d5c-6f5f-4d30-a9dd-4e4cfd4b4f87', email: 'candidato@talentia.co', role: 'candidate' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Campos obligatorios, correo o contraseña inválidos; o contraseñas diferentes' })
  @ApiResponse({ status: 409, description: 'Este correo ya está registrado' })
  async register(@Body() dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas deben ser iguales.');
    }

    return this.authService.register(dto.email, dto.password, dto.fullName);
  }

  @Post('register/recruiter')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Registra un recruiter y su organización',
    description: 'Endpoint independiente del registro de candidatos. Crea el usuario con role recruiter en Supabase Auth y users, crea o reutiliza la organización y devuelve un JWT de Supabase.',
  })
  @ApiBody({ type: RegisterRecruiterDto })
  @ApiResponse({
    status: 201,
    description: 'Recruiter creado, asociado a una organización y autenticado',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        refresh_token: 'v1-refresh-token-example',
        token_type: 'Bearer',
        expires_in: 3600,
        user: { id: '2e3d1d5c-6f5f-4d30-a9dd-4e4cfd4b4f87', email: 'talentia@empresa.co', role: 'recruiter', organizationId: 'a7d6d5b4-0c3b-4f88-9a0f-2e2f7f7c4c11' },
        organization: { id: 'a7d6d5b4-0c3b-4f88-9a0f-2e2f7f7c4c11', name: 'Innovaciones Andinas S.A.S.', slug: 'innovaciones-andinas-s-a-s' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Campos obligatorios, correo o contraseña inválidos; o contraseñas diferentes' })
  @ApiResponse({ status: 409, description: 'Este correo ya está registrado' })
  async registerRecruiter(@Body() dto: RegisterRecruiterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Las contraseñas deben ser iguales.');
    }
    return this.authService.registerRecruiter(dto.email, dto.password, dto.fullName);
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
        role: 'recruiter',
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Falta el token o es inválido/expiró' })
  me(@Req() request: { user: unknown }) {
    return request.user;
  }
}
