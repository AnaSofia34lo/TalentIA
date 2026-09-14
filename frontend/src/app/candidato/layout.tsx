import React from 'react';
import { AppShell } from '../../shared/components/layout/AppShell';
import { CandidateAuthGuard } from '../../shared/components/auth/CandidateAuthGuard';

export default function CandidatoLayout({ children }: { children: React.ReactNode }) {
  return <CandidateAuthGuard><AppShell>{children}</AppShell></CandidateAuthGuard>;
}
