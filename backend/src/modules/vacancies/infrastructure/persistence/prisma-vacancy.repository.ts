import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../infrastructure/database/prisma.service.js';
import { Vacancy } from '../../domain/entities/vacancy.entity.js';
import type {
  CreateVacancyPersistence,
  UpdateVacancyPersistence,
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
        salary: data.salary,
        createdByUserId: data.createdByUserId,
        organizationId: data.organizationId,
        slug: data.slug,
        status,
        publishedAt: status === 'published' ? new Date() : null,
        skills: data.technicalSkills?.length
          ? {
              create: data.technicalSkills
                .map((name) => name.trim())
                .filter(Boolean)
                .filter(
                  (name, index, names) =>
                    names.findIndex(
                      (candidate) =>
                        candidate.toLocaleLowerCase() === name.toLocaleLowerCase(),
                    ) === index,
                )
                .map((name) => ({ name, weight: 1 })),
            }
          : undefined,
      },
    });

    return this.toEntity(row);
  }

  async update(data: UpdateVacancyPersistence): Promise<Vacancy | null> {
    const existing = await this.prisma.vacancy.findFirst({
      where: { id: data.id, createdByUserId: data.recruiterId },
      select: { id: true },
    });
    if (!existing) return null;

    const row = await this.prisma.$transaction(async (transaction) => {
      const updated = await transaction.vacancy.update({
        where: { id: data.id },
        data: {
          title: data.name,
          description: data.description,
          salary: data.salary,
          status: data.status,
          publishedAt: data.status === 'published' ? new Date() : null,
        },
      });
      if (data.technicalSkills !== undefined) {
        await transaction.vacancySkill.deleteMany({ where: { vacancyId: data.id } });
        const skills = data.technicalSkills
          .map((name) => name.trim())
          .filter(Boolean)
          .filter((name, index, names) => names.findIndex((candidate) => candidate.toLowerCase() === name.toLowerCase()) === index)
          .map((name) => ({ vacancyId: data.id, name, weight: 1 }));
        if (skills.length) await transaction.vacancySkill.createMany({ data: skills });
      }
      return updated;
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

  async findMatchData(vacancyId: string, candidateId: string) {
    const vacancy = await this.prisma.vacancy.findUnique({
      where: { id: vacancyId, status: 'published' },
      select: { skills: { select: { name: true, weight: true } } },
    });
    if (!vacancy) return null;

    const candidateSkills = await this.prisma.candidateTechnicalSkill.findMany({
      where: { userId: candidateId },
      select: { name: true, estimatedProficiency: true },
    });

    return { vacancySkills: vacancy.skills, candidateSkills };
  }

  private toEntity(row: {
    id: string;
    title: string;
    description: string;
    salary: number;
    createdByUserId: string;
    organizationId: string;
    slug: string;
    status: string;
  }): Vacancy {
    return new Vacancy({
      id: row.id,
      name: row.title,
      description: row.description,
      salary: row.salary,
      createdByUserId: row.createdByUserId,
      organizationId: row.organizationId,
      slug: row.slug,
      status: row.status,
    });
  }
}
