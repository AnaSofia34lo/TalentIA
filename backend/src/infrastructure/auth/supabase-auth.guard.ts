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

@Injectable()
export class SupabaseAuthGuard implements CanActivate {
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

    const { data, error } = await this.supabase.getClient().auth.getUser(token);
    if (error || !data.user) {
      throw new UnauthorizedException('Token inválido o expirado.');
    }

    const localUser = await this.prisma.user.findUnique({ where: { id: data.user.id } });
    const role = localUser?.role
      ?? (data.user.app_metadata?.role === 'admin' ? 'recruiter' : data.user.app_metadata?.role ?? 'candidate');

    request.user = {
      id: data.user.id,
      email: data.user.email,
      role,
      organizationId: localUser?.organizationId,
    };
    return true;
  }
}
