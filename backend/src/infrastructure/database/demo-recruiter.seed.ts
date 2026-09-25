import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaService } from './prisma.service.js';
import { SupabaseService } from '../supabase/supabase.service.js';

export const DEMO_RECRUITER_DEFAULTS = {
  email: 'reclutador@prueba.com',
  password: 'Reclutador123*',
  companyName: 'Empresa Prueba TalentIA',
} as const;

@Injectable()
export class DemoRecruiterSeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(DemoRecruiterSeedService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly supabase: SupabaseService,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.DEMO_RECRUITER_ENABLED !== 'true') {
      return;
    }
    try {
      await this.ensureDemoRecruiter();
    } catch (error) {
      this.logger.warn(
        `No se pudo asegurar la cuenta demo de reclutador: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  private async ensureDemoRecruiter() {
    const email = (
      process.env.DEMO_RECRUITER_EMAIL?.trim() || DEMO_RECRUITER_DEFAULTS.email
    ).toLowerCase();
    const password =
      process.env.DEMO_RECRUITER_PASSWORD?.trim() ||
      DEMO_RECRUITER_DEFAULTS.password;
    const companyName =
      process.env.DEMO_RECRUITER_COMPANY?.trim() ||
      DEMO_RECRUITER_DEFAULTS.companyName;

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing?.role === 'recruiter' && existing.organizationId) {
      this.logger.log(
        `Cuenta demo reclutador lista → ${email} / ${password}`,
      );
      return;
    }

    const authUserId = await this.ensureSupabaseUser(
      email,
      password,
      companyName,
    );
    const organization = await this.prisma.organization.upsert({
      where: { slug: this.organizationSlug(companyName) },
      create: {
        name: companyName,
        slug: this.organizationSlug(companyName),
      },
      update: { name: companyName },
    });

    await this.prisma.user.upsert({
      where: { email },
      create: {
        id: authUserId,
        email,
        fullName: companyName,
        role: 'recruiter',
        authProvider: 'supabase',
        organizationId: organization.id,
      },
      update: {
        fullName: companyName,
        role: 'recruiter',
        authProvider: 'supabase',
        organizationId: organization.id,
      },
    });

    this.logger.log(
      `Cuenta demo reclutador creada → login: ${email} / ${password}`,
    );
  }

  private async ensureSupabaseUser(
    email: string,
    password: string,
    companyName: string,
  ): Promise<string> {
    const { data, error } = await this.supabase.getClient().auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      app_metadata: { role: 'recruiter' },
      user_metadata: { fullName: companyName, companyName },
    });

    if (data.user) return data.user.id;

    if (error?.code === 'email_exists' || error?.status === 422) {
      const existingId = await this.findAuthUserIdByEmail(email);
      if (!existingId) {
        throw new Error(
          `El correo ${email} existe en Auth pero no se pudo resolver su id.`,
        );
      }

      await this.supabase.getClient().auth.admin.updateUserById(existingId, {
        password,
        email_confirm: true,
        app_metadata: { role: 'recruiter' },
        user_metadata: { fullName: companyName, companyName },
      });
      return existingId;
    }

    throw new Error(error?.message ?? 'No se pudo crear el usuario demo en Auth');
  }

  private async findAuthUserIdByEmail(email: string): Promise<string | null> {
    const normalized = email.toLowerCase();
    let page = 1;
    const perPage = 200;

    while (page <= 10) {
      const { data, error } = await this.supabase
        .getClient()
        .auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(error.message);

      const match = data.users.find(
        (user) => user.email?.toLowerCase() === normalized,
      );
      if (match) return match.id;
      if (data.users.length < perPage) break;
      page += 1;
    }

    return null;
  }

  private organizationSlug(name: string) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || 'ds4b-talentia';
  }
}
