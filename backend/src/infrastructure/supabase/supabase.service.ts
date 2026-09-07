import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;
  private readonly authClient: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL ?? 'https://invalid.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'missing-service-role-key';
    const anonKey = process.env.SUPABASE_ANON_KEY ?? 'missing-anon-key';

    this.client = createClient(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
      global: {
        headers: {
          'X-Client-Info': 'talentia-backend',
        },
      },
    });

    this.authClient = createClient(url, anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
      },
    });
  }

  getClient(): SupabaseClient {
    this.assertConfiguration();
    return this.client;
  }

  getAuthClient(): SupabaseClient {
    this.assertConfiguration();
    return this.authClient;
  }

  private assertConfiguration(): void {
    if (
      !process.env.SUPABASE_URL ||
      !process.env.SUPABASE_ANON_KEY ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error(
        'Configura SUPABASE_URL, SUPABASE_ANON_KEY y SUPABASE_SERVICE_ROLE_KEY antes de usar autenticación.',
      );
    }
  }

  getBucketName(type: 'cv' | 'video'): string {
    if (type === 'cv') {
      return process.env.SUPABASE_CV_BUCKET ?? 'hojas-de-vida';
    }

    return process.env.SUPABASE_VIDEO_BUCKET ?? 'entrevistas-videos';
  }
}
