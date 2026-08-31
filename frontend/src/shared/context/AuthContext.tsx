'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { UserRole, UserProfile, Notificacion } from '../types';
import { ADMIN_USER, CANDIDATE_USER, NOTIFS_ADMIN, NOTIFS_CAND } from '../data/mockData';

interface AuthContextType {
  role: UserRole;
  user: UserProfile;
  notifications: Notificacion[];
  unreadCount: number;
  login: (role: UserRole) => void;
  logout: () => void;
  markAllNotifsRead: () => void;
  bancoFilter: string;
  setBancoFilter: (filter: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [adminNotifs, setAdminNotifs] = useState<Notificacion[]>(NOTIFS_ADMIN);
  const [candNotifs, setCandNotifs] = useState<Notificacion[]>(NOTIFS_CAND);
  const [bancoFilter, setBancoFilter] = useState<string>('Desarrollo de Software');

  // Derive role and user directly from current pathname (or default to admin)
  const role: UserRole = pathname.startsWith('/candidato') ? 'candidate' : 'admin';
  const user: UserProfile = role === 'admin' ? ADMIN_USER : CANDIDATE_USER;

  const activeNotifs = role === 'admin' ? adminNotifs : candNotifs;
  const unreadCount = activeNotifs.filter((n) => n.unread).length;

  const login = (selectedRole: UserRole) => {
    if (selectedRole === 'admin') {
      router.push('/admin/dashboard');
    } else {
      router.push('/candidato/inicio');
    }
  };

  const logout = () => {
    router.push('/login');
  };

  const markAllNotifsRead = () => {
    if (role === 'admin') {
      setAdminNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    } else {
      setCandNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        notifications: activeNotifs,
        unreadCount,
        login,
        logout,
        markAllNotifsRead,
        bancoFilter,
        setBancoFilter
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
