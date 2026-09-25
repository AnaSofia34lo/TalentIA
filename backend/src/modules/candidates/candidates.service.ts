import {
  BadRequestException,
  Injectable,
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
  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getProfile(userId: string) {
    const user = await this.getCandidate(userId);
    return this.toProfileResponse(user);
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

    return this.toProfileResponse({ ...updated, candidateProfile: profile });
  }

  async getCv(userId: string) {
    const user = await this.getCandidate(userId);
    const profile = user.candidateProfile;
    const asset = await this.prisma.storageAsset.findFirst({
      where: { userId, kind: 'cv' },
      orderBy: { createdAt: 'desc' },
    });

    return {
      ...this.toProfileResponse(user),
      cv: asset
        ? {
            id: asset.id,
            fileName: asset.fileName,
            mimeType: asset.mimeType,
            sizeBytes: asset.sizeBytes,
            createdAt: asset.createdAt,
            downloadUrl: await this.createDownloadUrl(asset.fileUrl),
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
      },
    });

    this.eventEmitter.emit('candidate.cv.uploaded', {
      userId,
      storageAssetId: asset.id,
    });

    return {
      message: 'Hoja de vida cargada correctamente',
      fileName: asset.fileName,
      downloadUrl: await this.createDownloadUrl(asset.fileUrl),
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
