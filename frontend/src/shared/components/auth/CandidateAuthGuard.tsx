'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

let candidateVerifiedInMemory = false;

export function setCandidateVerified(status: boolean) {
  candidateVerifiedInMemory = status;
}

export function CandidateAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(() => candidateVerifiedInMemory);

  useEffect(() => {
    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.app_metadata?.role;
      if (!data.session || role !== 'candidate') {
        candidateVerifiedInMemory = false;
        router.replace('/login');
        return;
      }
      candidateVerifiedInMemory = true;
      if (active) setAuthorized(true);
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-[var(--ink-soft)]">
        Verificando sesión...
      </div>
    );
  }

  return <>{children}</>;
}
