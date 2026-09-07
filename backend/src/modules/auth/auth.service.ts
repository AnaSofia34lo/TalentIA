import { Injectable, UnauthorizedException } from '@nestjs/common';
import { SupabaseService } from '../../infrastructure/supabase/supabase.service.js';

@Injectable()
export class AuthService {
  constructor(private readonly supabase: SupabaseService) {}

  async login(email: string, password: string) {
    const { data, error } = await this.supabase
      .getAuthClient()
      .auth.signInWithPassword({ email, password });

    if (error || !data.session || !data.user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return {
      access_token: data.session.access_token,
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
