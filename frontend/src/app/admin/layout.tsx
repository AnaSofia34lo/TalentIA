import React from 'react';
import { AppShell } from '../../shared/components/layout/AppShell';
import { RecruiterAuthGuard } from '../../shared/components/auth/RecruiterAuthGuard';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RecruiterAuthGuard><AppShell>{children}</AppShell></RecruiterAuthGuard>;
}
