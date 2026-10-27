import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service.js';
import { UpdateCandidateCvDto } from './dto/update-candidate-cv.dto.js';
import { UpdateCandidateProfileDto } from './dto/update-candidate-profile.dto.js';

@Injectable()
export class CandidatesService {
  private readonly logger = new Logger(CandidatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const user = await this.getCandidate(userId);
    const identityDocument = await this.prisma.storageAsset.findFirst({
      where: { userId, kind: 'identity_document' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
    const profile = this.toProfileResponse(user);
    return { ...profile, identityDocument };
  }

  async updateProfile(userId: string, dto: UpdateCandidateProfileDto) {
    const user = await this.getCandidate(userId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        fullName: dto.fullName.trim(),
        phone: dto.phone?.trim() || null,
      },
      include: { candidateProfile: true },
    });

    const profile = await this.prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        location: dto.location?.trim() || null,
        linkedinUrl: dto.linkedinUrl || null,
        portfolioUrl: dto.portfolioUrl || null,
      },
      update: {
        location: dto.location?.trim() || null,
        linkedinUrl: dto.linkedinUrl || null,
        portfolioUrl: dto.portfolioUrl || null,
      },
    });

    await this.supabase.getClient().auth.admin.updateUserById(userId, {
      user_metadata: { fullName: updated.fullName },
    });

    return this.getProfile(userId);
  }

  async getCv(userId: string) {
    const user = await this.getCandidate(userId);
    const profile = user.candidateProfile;
    const [asset, identityDocument] = await Promise.all([
      this.prisma.storageAsset.findFirst({
        where: { userId, kind: 'cv' },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.storageAsset.findFirst({
        where: { userId, kind: 'identity_document' },
        orderBy: { createdAt: 'desc' },
        select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
      }),
    ]);

    return {
      ...this.toProfileResponse(user),
      identityDocument,
      cv: asset
        ? {
            id: asset.id,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            sizeBytes: asset.sizeBytes,
            createdAt: asset.createdAt,
            downloadUrl: await this.createDownloadUrl(asset.fileUrl),
            resumeAnalysisStatus: asset.resumeAnalysisStatus,
          }
        : null,
      cvProfile: {
        professionalTitle: profile?.professionalTitle ?? '',
        currentCompany: profile?.currentCompany ?? '',
        yearsOfExperience: profile?.yearsOfExperience ?? null,
        summary: profile?.summary ?? '',
      },
    };
  }

  async getCvAnalysisStatus(userId: string) {
    const asset = await this.prisma.storageAsset.findFirst({
      where: { userId, kind: 'cv' },
      orderBy: { createdAt: 'desc' },
      select: { id: true, resumeAnalysisStatus: true },
    });
    return {
      cvId: asset?.id ?? null,
      status: asset?.resumeAnalysisStatus ?? null,
    };
  }

  async applyToVacancy(candidateId: string, vacancyId: string) {
    await this.getCandidate(candidateId);

    const vacancy = await this.prisma.vacancy.findFirst({
      where: { id: vacancyId, status: 'published' },
      select: { id: true, organizationId: true },
    });
    if (!vacancy) {
      throw new NotFoundException('La vacante no está disponible para postulación.');
    }

    const existingApplication = await this.prisma.candidateApplication.findUnique({
      where: { candidateId_vacancyId: { candidateId, vacancyId } },
      select: { id: true },
    });
    if (existingApplication) {
      throw new ConflictException('Ya te postulaste a esta vacante.');
    }

    const application = await this.prisma.candidateApplication.create({
      data: {
        candidateId,
        vacancyId: vacancy.id,
        organizationId: vacancy.organizationId,
      },
      select: { id: true, vacancyId: true, status: true, submittedAt: true },
    });

    return application;
  }

  async listApplications(candidateId: string) {
    await this.getCandidate(candidateId);

    return this.prisma.candidateApplication.findMany({
      where: { candidateId },
      orderBy: { submittedAt: 'desc' },
      select: {
        id: true,
        vacancyId: true,
        status: true,
        submittedAt: true,
        matchScore: true,
        vacancy: {
          select: {
            title: true,
            description: true,
            salary: true,
            status: true,
            organization: { select: { name: true } },
          },
        },
        interviews: {
          select: {
            id: true,
            type: true,
            status: true,
            videoUrl: true,
          },
        },
        interviewAnalysis: {
          select: {
            id: true,
            status: true,
            overallScore: true,
            technicalScore: true,
            behavioralScore: true,
          },
        },
      },
    });
  }

  async updateCv(userId: string, dto: UpdateCandidateCvDto) {
    await this.getCandidate(userId);
    await this.prisma.candidateProfile.upsert({
      where: { userId },
      create: {
        userId,
        professionalTitle: dto.professionalTitle.trim(),
        currentCompany: dto.currentCompany.trim(),
        yearsOfExperience: dto.yearsOfExperience,
        summary: dto.summary.trim(),
      },
      update: {
        professionalTitle: dto.professionalTitle.trim(),
        currentCompany: dto.currentCompany.trim(),
        yearsOfExperience: dto.yearsOfExperience,
        summary: dto.summary.trim(),
      },
    });

    return this.getCv(userId);
  }

  async uploadCv(userId: string, file?: Express.Multer.File) {
    await this.getCandidate(userId);
    if (!file) throw new BadRequestException('El archivo PDF es obligatorio.');
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('El archivo debe estar en formato PDF.');
    }

    const bucket = this.supabase.getBucketName('cv');
    const path = `${userId}/${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .upload(path, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) throw new BadRequestException(`No se pudo cargar el CV: ${error.message}`);

    const asset = await this.prisma.storageAsset.create({
      data: {
        userId,
        bucketName: bucket,
        fileName: file.originalname,
        fileUrl: path,
        mimeType: file.mimetype,
        kind: 'cv',
        sizeBytes: file.size,
        resumeAnalysisStatus: 'processing',
      },
    });

    const markAnalysisAsFailed = async (reason: string) => {
      this.logger.error(`No se pudo iniciar el análisis del CV ${asset.id}: ${reason}`);
      await this.prisma.storageAsset
        .updateMany({
          where: { id: asset.id, kind: 'cv' },
          data: { resumeAnalysisStatus: 'failed' },
        })
        .catch((statusError: unknown) => {
          this.logger.error(`No se pudo guardar el estado del CV ${asset.id}: ${String(statusError)}`);
        });
    };

    void this.eventEmitter
      .emitAsync('candidate.cv.uploaded', {
        userId,
        storageAssetId: asset.id,
      })
      .then((listeners) => {
        if (listeners.length === 0) {
          return markAnalysisAsFailed('No hay un proceso de análisis registrado.');
        }
      })
      .catch((error: unknown) => markAnalysisAsFailed(String(error)));

    return {
      message: 'Hoja de vida cargada correctamente',
      fileName: asset.fileName,
      downloadUrl: await this.createDownloadUrl(asset.fileUrl),
    };
  }

  async uploadIdentityDocument(userId: string, file?: Express.Multer.File) {
    await this.getCandidate(userId);
    if (!file) throw new BadRequestException('El documento de identidad es obligatorio.');
    const allowedTypes = new Set(['application/pdf', 'image/jpeg', 'image/png', 'image/webp']);
    if (!allowedTypes.has(file.mimetype)) {
      throw new BadRequestException('El documento debe ser PDF o imagen JPG, PNG o WEBP.');
    }

    const bucket = this.supabase.getBucketName('identity-document');
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const path = `${userId}/${randomUUID()}-${safeName}`;
    const { error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .upload(path, file.buffer, { contentType: file.mimetype, upsert: false });
    if (error) throw new BadRequestException(`No se pudo cargar el documento: ${error.message}`);

    const asset = await this.prisma.storageAsset.create({
      data: {
        userId,
        bucketName: bucket,
        fileName: file.originalname,
        fileUrl: path,
        mimeType: file.mimetype,
        kind: 'identity_document',
        sizeBytes: file.size,
      },
      select: { id: true, fileName: true, mimeType: true, sizeBytes: true, createdAt: true },
    });
    return { message: 'Documento de identidad cargado correctamente.', identityDocument: asset };
  }

  async getRecruiterIdentityDocument(recruiterId: string, applicationId: string) {
    const recruiter = await this.prisma.user.findUnique({
      where: { id: recruiterId },
      select: { organizationId: true },
    });
    if (!recruiter?.organizationId) {
      throw new NotFoundException('El recruiter no tiene una organizacion asociada.');
    }
    const application = await this.prisma.candidateApplication.findFirst({
      where: { id: applicationId, organizationId: recruiter.organizationId },
      select: { candidateId: true, candidate: { select: { fullName: true } } },
    });
    if (!application) throw new NotFoundException('La postulacion no pertenece a tu organizacion.');

    const asset = await this.prisma.storageAsset.findFirst({
      where: { userId: application.candidateId, kind: 'identity_document' },
      orderBy: { createdAt: 'desc' },
    });
    if (!asset) throw new NotFoundException('El candidato aun no ha cargado su documento de identidad.');
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(asset.bucketName)
      .createSignedUrl(asset.fileUrl, 300);
    if (error) throw new BadRequestException('No se pudo generar el acceso al documento.');
    return {
      candidateName: application.candidate.fullName,
      fileName: asset.fileName,
      mimeType: asset.mimeType,
      downloadUrl: data.signedUrl,
      expiresInSeconds: 300,
    };
  }

  private async getCandidate(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { candidateProfile: true },
    });
    if (!user || user.role !== 'candidate') {
      throw new NotFoundException('No se encontró el candidato autenticado.');
    }
    return user;
  }

  private toProfileResponse(user: {
    id: string;
    email: string;
    fullName: string;
    phone: string | null;
    candidateProfile: {
      location: string | null;
      linkedinUrl: string | null;
      portfolioUrl: string | null;
      professionalTitle: string | null;
    } | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phone: user.phone ?? '',
      candidateProfile: user.candidateProfile,
    };
  }

  private async createDownloadUrl(path: string) {
    const bucket = this.supabase.getBucketName('cv');
    const { data, error } = await this.supabase
      .getClient()
      .storage.from(bucket)
      .createSignedUrl(path, 3600);
    return error ? null : data.signedUrl;
  }
}
