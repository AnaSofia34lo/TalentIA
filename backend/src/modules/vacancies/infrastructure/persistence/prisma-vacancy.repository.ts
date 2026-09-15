import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { Vacancy } from '../../domain/entities/vacancy.entity.js';
import type {
  CreateVacancyPersistence,
  VacancyRepositoryPort,
} from '../../application/ports/vacancy-repository.port.js';

@Injectable()
export class PrismaVacancyRepository implements VacancyRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateVacancyPersistence): Promise<Vacancy> {
    const status = data.status ?? 'published';
    const row = await this.prisma.vacancy.create({
      data: {
        title: data.name,
        description: data.description,
        createdByUserId: data.createdByUserId,
        organizationId: data.organizationId,
        slug: data.slug,
        status,
        publishedAt: status === 'published' ? new Date() : null,
      },
    });

    return this.toEntity(row);
  }

  async findByRecruiterId(recruiterId: string): Promise<Vacancy[]> {
    const rows = await this.prisma.vacancy.findMany({
      where: { createdByUserId: recruiterId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findPublished(): Promise<Vacancy[]> {
    const rows = await this.prisma.vacancy.findMany({
      where: { status: 'published' },
      orderBy: { publishedAt: 'desc' },
    });
    return rows.map((row) => this.toEntity(row));
  }

  async findOrganizationIdByUserId(userId: string): Promise<string | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });
    return user?.organizationId ?? null;
  }

  async slugExists(slug: string): Promise<boolean> {
    const existing = await this.prisma.vacancy.findUnique({
      where: { slug },
      select: { id: true },
    });
    return Boolean(existing);
  }

  private toEntity(row: {
    id: string;
    title: string;
    description: string;
    createdByUserId: string;
    organizationId: string;
    slug: string;
    status: string;
  }): Vacancy {
    return new Vacancy({
      id: row.id,
      name: row.title,
      description: row.description,
      createdByUserId: row.createdByUserId,
      organizationId: row.organizationId,
      slug: row.slug,
      status: row.status,
    });
  }
}
