'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export function CandidateAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.app_metadata?.role;
      if (!data.session || role !== 'candidate') {
        router.replace('/login');
        return;
      }
      if (active) setAuthorized(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!authorized) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">Verificando sesión...</div>;
  }

  return <>{children}</>;
}
