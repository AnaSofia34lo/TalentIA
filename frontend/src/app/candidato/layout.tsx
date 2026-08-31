import React from 'react';
import { AppShell } from '../../shared/components/layout/AppShell';

export default function CandidatoLayout({ children }: { children: React.ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
