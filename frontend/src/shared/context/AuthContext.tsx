'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { UserRole, UserProfile, Notificacion } from '../types';
import { ADMIN_USER, CANDIDATE_USER, NOTIFS_ADMIN, NOTIFS_CAND } from '../data/mockData';

interface AuthContextType {
  role: UserRole;
  user: UserProfile;
  notifications: Notificacion[];
  unreadCount: number;
  login: (email: string, password: string) => Promise<UserRole>;
  registerCandidate: (email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  markAllNotifsRead: () => void;
  bancoFilter: string;
  setBancoFilter: (filter: string) => void;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: { role: UserRole; email?: string };
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3000';

async function requestAuth(path: string, body: Record<string, string>): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message;
    throw new Error(message ?? 'No fue posible completar la operación.');
  }
  return payload as AuthResponse;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionRole, setSessionRole] = useState<UserRole | null>(null);
  const [adminNotifs, setAdminNotifs] = useState<Notificacion[]>(NOTIFS_ADMIN);
  const [candNotifs, setCandNotifs] = useState<Notificacion[]>(NOTIFS_CAND);
  const [bancoFilter, setBancoFilter] = useState<string>('Desarrollo de Software');

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.app_metadata?.role as UserRole | undefined;
      if (role === 'admin' || role === 'candidate') setSessionRole(role);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user.app_metadata?.role as UserRole | undefined;
      setSessionRole(role === 'admin' || role === 'candidate' ? role : null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const role: UserRole = sessionRole ?? (pathname.startsWith('/candidato') ? 'candidate' : 'admin');
  const user = role === 'admin' ? ADMIN_USER : CANDIDATE_USER;
  const activeNotifs = role === 'admin' ? adminNotifs : candNotifs;
  const unreadCount = activeNotifs.filter((notification) => notification.unread).length;

  const applySession = async (auth: AuthResponse) => {
    await supabase.auth.setSession({
      access_token: auth.access_token,
      refresh_token: auth.refresh_token,
    });
    setSessionRole(auth.user.role);
  };

  const login = async (email: string, password: string) => {
    const auth = await requestAuth('login', { email, password });
    await applySession(auth);
    return auth.user.role;
  };

  const registerCandidate = async (email: string, password: string, confirmPassword: string) => {
    const auth = await requestAuth('register', { email, password, confirmPassword });
    await applySession(auth);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSessionRole(null);
    router.push('/login');
  };

  const markAllNotifsRead = () => {
    if (role === 'admin') {
      setAdminNotifs((previous) => previous.map((notification) => ({ ...notification, unread: false })));
    } else {
      setCandNotifs((previous) => previous.map((notification) => ({ ...notification, unread: false })));
    }
  };

  return (
    <AuthContext.Provider value={{ role, user, notifications: activeNotifs, unreadCount, login, registerCandidate, logout, markAllNotifsRead, bancoFilter, setBancoFilter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
