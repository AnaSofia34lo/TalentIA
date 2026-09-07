import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
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

  async login(email: string, password: string) {
    const { data, error } = await this.supabase
      .getAuthClient()
      .auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
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
        role: data.user.app_metadata?.role ?? 'candidate',
      },
    };
  }
}
