import { Buffer } from 'node:buffer';
import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SupabaseService } from '../supabase/supabase.service.js';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator.js';
import { PrismaService } from '../database/prisma.service.js';

interface CachedUserSession {
  user: {
    id: string;
    email?: string;
    role: string;
    organizationId?: string | null;
  };
  expiresAt: number;
}

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
  private static readonly tokenCache = new Map<string, CachedUserSession>();
  private static readonly CACHE_TTL_MS = 60_000; // 60 segundos de caché por token activo

  constructor(
    private readonly supabase: SupabaseService,
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (
      this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
        context.getHandler(),
        context.getClass(),
      ])
    ) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      headers: { authorization?: string };
      user?: unknown;
    }>();
    const authorization = request.headers.authorization;
    const token = authorization?.match(/^Bearer\s+(.+)$/i)?.[1];

    if (!token) {
      throw new UnauthorizedException('Se requiere un token Bearer.');
    }

    const now = Date.now();
    const cached = SupabaseAuthGuard.tokenCache.get(token);
    if (cached && now < cached.expiresAt) {
      request.user = cached.user;
      return true;
    }

    const { data, error } = await this.supabase.getClient().auth.getUser(token);
    if (error || !data.user) {
      SupabaseAuthGuard.tokenCache.delete(token);
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const localUser = await this.prisma.user.findUnique({
      where: { id: data.user.id },
      select: {
        id: true,
        role: true,
        organizationId: true,
        activeSessionId: true,
      },
    });
    const sessionId = this.sessionIdFromAccessToken(token);
    if (!sessionId) {
      throw new UnauthorizedException('Token inv\u00e1lido o expirado.');
    }

    if (!localUser) {
      throw new UnauthorizedException('La cuenta no est\u00e1 disponible.');
    }

    if (localUser.activeSessionId !== sessionId) {
      throw new UnauthorizedException({
        code: 'SESSION_REPLACED',
        message: 'Tu sesi\u00f3n se cerr\u00f3 porque esta cuenta inici\u00f3 sesi\u00f3n en otro dispositivo.',
      });
    }

    const role = localUser?.role
      ?? (data.user.app_metadata?.role === 'admin' ? 'recruiter' : data.user.app_metadata?.role ?? 'candidate');

    const authenticatedUser = {
      id: data.user.id,
      email: data.user.email,
      role,
      organizationId: localUser?.organizationId,
    };

    // Almacena en caché en memoria para responder de inmediato en las siguientes peticiones
    SupabaseAuthGuard.tokenCache.set(token, {
      user: authenticatedUser,
      expiresAt: now + SupabaseAuthGuard.CACHE_TTL_MS,
    });

    // Limpieza oportunista si la caché crece
    if (SupabaseAuthGuard.tokenCache.size > 200) {
      for (const [key, value] of SupabaseAuthGuard.tokenCache.entries()) {
        if (now >= value.expiresAt) {
          SupabaseAuthGuard.tokenCache.delete(key);
        }
      }
    }

    request.user = authenticatedUser;
    return true;
  }

  private sessionIdFromAccessToken(token: string): string | null {
    try {
      const payload = token.split('.')[1];
      if (!payload) return null;
      const claims = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { session_id?: unknown };
      return typeof claims.session_id === 'string' ? claims.session_id : null;
    } catch {
      return null;
    }
  }
}
