import { Injectable } from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor() {
    const url = process.env.SUPABASE_URL ?? 'https://example.supabase.co';
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'service-role-placeholder';

    this.client = createClient(url, key, {
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
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  getBucketName(type: 'cv' | 'video'): string {
    if (type === 'cv') {
      return process.env.SUPABASE_CV_BUCKET ?? 'hojas-de-vida';
    }

    return process.env.SUPABASE_VIDEO_BUCKET ?? 'entrevistas-videos';
  }
}
