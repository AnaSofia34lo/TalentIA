import {
  Body,
  Controller,
  Get,
  MaxFileSizeValidator,
  ParseFilePipe,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator.js';
import { CurrentUser } from '../../common/decorators/current-user.decorator.js';
import { CandidatesService } from './candidates.service.js';
import { UpdateCandidateCvDto } from './dto/update-candidate-cv.dto.js';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js';

@ApiTags('Candidato')
@ApiBearerAuth('JWT-auth')
@Roles('candidate')
@Controller('candidate')
export class CandidatesController {
  constructor(private readonly candidates: CandidatesService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Consulta el perfil personal del candidato autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil del candidato', schema: { example: { id: 'uuid', email: 'candidato@talentia.co', fullName: 'Camila Restrepo', phone: '+57 300 123 4567', candidateProfile: { location: 'Medellín', professionalTitle: 'Diseñadora UX/UI' } } } })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  @ApiResponse({ status: 403, description: 'El usuario autenticado no es candidato' })
  getProfile(@CurrentUser('id') userId: string) {
    return this.candidates.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Actualiza la información personal del candidato' })
  @ApiBody({ type: UpdateCandidateProfileDto, examples: { completo: { value: { fullName: 'Camila Restrepo Gómez', phone: '+57 300 123 4567', location: 'Medellín', linkedinUrl: 'https://www.linkedin.com/in/camila-restrepo', portfolioUrl: 'https://camilarestrepo.dev' } } } })
  @ApiResponse({ status: 200, description: 'Información guardada correctamente' })
  @ApiResponse({ status: 400, description: 'Formato inválido o campo obligatorio' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  updateProfile(@CurrentUser('id') userId: string, @Body() dto: UpdateCandidateProfileDto) {
    return this.candidates.updateProfile(userId, dto);
  }

  @Get('cv')
  @ApiOperation({ summary: 'Consulta la hoja de vida del candidato autenticado' })
  @ApiResponse({ status: 200, description: 'Datos profesionales y CV cargado' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  getCv(@CurrentUser('id') userId: string) {
    return this.candidates.getCv(userId);
  }

  @Patch('cv')
  @ApiOperation({ summary: 'Actualiza la experiencia profesional del candidato' })
  @ApiBody({ type: UpdateCandidateCvDto, examples: { completo: { value: { professionalTitle: 'Diseñadora UX/UI', currentCompany: 'Estudio Croma', yearsOfExperience: 4, summary: 'Diseñadora UX/UI con experiencia en productos digitales B2B.' } } } })
  @ApiResponse({ status: 200, description: 'Hoja de vida actualizada correctamente' })
  @ApiResponse({ status: 400, description: 'Formato inválido o campo obligatorio' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  updateCv(@CurrentUser('id') userId: string, @Body() dto: UpdateCandidateCvDto) {
    return this.candidates.updateCv(userId, dto);
  }

  @Post('cv/file')
  @ApiOperation({ summary: 'Carga o reemplaza el PDF de la hoja de vida' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ schema: { type: 'object', required: ['file'], properties: { file: { type: 'string', format: 'binary', description: 'Archivo PDF de máximo 5 MB.' } } } })
  @UseInterceptors(FileInterceptor('file'))
  @ApiResponse({ status: 201, description: 'Hoja de vida cargada correctamente' })
  @ApiResponse({ status: 400, description: 'Archivo obligatorio, no PDF o excede 5 MB' })
  @ApiResponse({ status: 401, description: 'JWT ausente, inválido o expirado' })
  uploadCv(
    @CurrentUser('id') userId: string,
    @UploadedFile(new ParseFilePipe({ validators: [new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 })], fileIsRequired: true })) file: Express.Multer.File,
  ) {
    return this.candidates.uploadCv(userId, file);
  }
}
