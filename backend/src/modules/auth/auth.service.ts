import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service.js';
import { PrismaService } from '../../infrastructure/database/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly prisma: PrismaService,
  ) {}

  async register(
    email: string,
    password: string,
    fullName = 'Candidato TalentIA',
  ) {
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'candidate' },
        user_metadata: { fullName },
      });

    if (error || !data.user) {
      if (error?.code === 'email_exists' || error?.status === 422) {
        throw new ConflictException('Este correo ya está registrado');
      }

      throw new UnauthorizedException(
        error?.message ?? 'No fue posible crear la cuenta',
      );
    }

    try {
      await this.prisma.user.create({
        data: {
          id: data.user.id,
          email,
          fullName,
          role: 'candidate',
          authProvider: 'supabase',
        },
      });
    } catch (databaseError) {
      await this.supabase.getClient().auth.admin.deleteUser(data.user.id);

      if ((databaseError as { code?: string }).code === 'P2002') {
        throw new ConflictException('Este correo ya está registrado');
      }

      throw databaseError;
    }

    return this.login(email, password);
  }

  async registerRecruiter(
    email: string,
    password: string,
    companyName: string,
  ) {
    const normalizedCompanyName = companyName.trim();
    const { data, error } = await this.supabase
      .getClient()
      .auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        app_metadata: { role: 'recruiter' },
        user_metadata: { fullName: normalizedCompanyName, companyName: normalizedCompanyName },
      });

    if (error || !data.user) {
      if (error?.code === 'email_exists' || error?.status === 422) {
        throw new ConflictException('Este correo ya está registrado');
      }
      throw new UnauthorizedException(error?.message ?? 'No fue posible crear la cuenta recruiter');
    }

    try {
      const organization = await this.prisma.$transaction(async (transaction) => {
        const organization = await transaction.organization.upsert({
          where: { slug: this.organizationSlug(normalizedCompanyName) },
          create: {
            name: normalizedCompanyName,
            slug: this.organizationSlug(normalizedCompanyName),
          },
          update: {},
        });

        await transaction.user.create({
          data: {
            id: data.user.id,
            email,
            fullName: normalizedCompanyName,
            role: 'recruiter',
            authProvider: 'supabase',
            organizationId: organization.id,
          },
        });

        return organization;
      });

      return {
        ...(await this.login(email, password)),
        organization: { id: organization.id, name: organization.name, slug: organization.slug },
      };
    } catch (databaseError) {
      await this.supabase.getClient().auth.admin.deleteUser(data.user.id);
      if ((databaseError as { code?: string }).code === 'P2002') {
        throw new ConflictException('Este correo ya está registrado');
      }
      throw databaseError;
    }
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    let account = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });
    if (!account) {
      account = await this.prisma.user.findFirst({
        where: { email: { equals: normalizedEmail, mode: 'insensitive' } },
      });
    }
    if (!account) {
      throw new NotFoundException(
        'Este correo no tiene una cuenta en TalentIA',
      );
    }

    const { data, error } = await this.supabase
      .getAuthClient()
      .auth.signInWithPassword({ email: account.email, password });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException(
        'La contraseña no coincide con la contraseña de la cuenta',
      );
    }

    const role = account.role;

    if (data.user.app_metadata?.role !== role) {
      await this.supabase.getClient().auth.admin.updateUserById(data.user.id, {
        app_metadata: { ...data.user.app_metadata, role },
      });
    }

    return {
      access_token: data.session.access_token,
      refresh_token: data.session.refresh_token,
      token_type: 'Bearer',
      expires_in: data.session.expires_in,
      expires_at: data.session.expires_at,
      user: {
        id: data.user.id,
        email: data.user.email,
        role,
        organizationId: account.organizationId,
      },
    };
  }

  private organizationSlug(name: string) {
    const slug = name
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    return slug || `empresa-${randomUUID().slice(0, 8)}`;
  }
}
