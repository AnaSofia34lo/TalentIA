'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { UserRole, UserProfile, Notificacion } from '../types';
import { ADMIN_USER, CANDIDATE_USER, NOTIFS_ADMIN, NOTIFS_CAND } from '../data/mockData';

export interface CandidateProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  candidateProfile: {
    location?: string | null;
    linkedinUrl?: string | null;
    portfolioUrl?: string | null;
    professionalTitle?: string | null;
    currentCompany?: string | null;
    yearsOfExperience?: number | null;
    summary?: string | null;
  } | null;
  cv?: {
    id: string;
    fileName: string;
    mimeType?: string | null;
    sizeBytes?: number | null;
    createdAt: string;
    downloadUrl?: string | null;
  } | null;
  cvProfile?: {
    professionalTitle: string;
    currentCompany: string;
    yearsOfExperience: number | null;
    summary: string;
  };
}

interface AuthContextType {
  role: UserRole;
  user: UserProfile;
  candidateProfile: CandidateProfileResponse | null;
  notifications: Notificacion[];
  unreadCount: number;
  login: (email: string, password: string) => Promise<UserRole>;
  registerCandidate: (email: string, password: string, confirmPassword: string) => Promise<void>;
  refreshCandidateProfile: () => Promise<CandidateProfileResponse>;
  refreshCandidateCv: () => Promise<CandidateProfileResponse>;
  updateCandidateProfile: (data: Record<string, unknown>) => Promise<CandidateProfileResponse>;
  updateCandidateCv: (data: Record<string, unknown>) => Promise<CandidateProfileResponse>;
  uploadCandidateCv: (file: File) => Promise<{ fileName: string; downloadUrl: string | null }>;
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

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

function userFromCandidate(profile: CandidateProfileResponse): UserProfile {
  return {
    name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    roleTitle: profile.candidateProfile?.professionalTitle || 'Candidato',
    avatarInitials: initialsFromName(profile.fullName),
  };
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(payload.message) ? payload.message[0] : payload.message;
    throw new Error(message ?? 'No fue posible completar la operación.');
  }
  return payload;
}

async function requestAuth(path: string, body: Record<string, string>): Promise<AuthResponse> {
  return parseResponse(await fetch(`${API_URL}/auth/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }));
}

async function requestCandidate(path: string, init: RequestInit = {}) {
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error('Tu sesión expiró. Inicia sesión nuevamente.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${data.session.access_token}`);
  if (init.body && !(init.body instanceof FormData)) headers.set('Content-Type', 'application/json');
  return parseResponse(await fetch(`${API_URL}/candidate/${path}`, { ...init, headers }));
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionRole, setSessionRole] = useState<UserRole | null>(null);
  const [candidateProfile, setCandidateProfile] = useState<CandidateProfileResponse | null>(null);
  const [adminNotifs, setAdminNotifs] = useState<Notificacion[]>(NOTIFS_ADMIN);
  const [candNotifs, setCandNotifs] = useState<Notificacion[]>(NOTIFS_CAND);
  const [bancoFilter, setBancoFilter] = useState<string>('Desarrollo de Software');

  const hydrateCandidate = async () => {
    try {
      const profile = await requestCandidate('profile');
      setCandidateProfile(profile);
      return profile;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.app_metadata?.role as string | undefined;
      const normalizedRole = role === 'admin' ? 'recruiter' : role;
      if (normalizedRole === 'recruiter' || normalizedRole === 'candidate') {
        setSessionRole(normalizedRole);
        if (normalizedRole === 'candidate') void hydrateCandidate();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      const role = session?.user.app_metadata?.role as string | undefined;
      const normalizedRole = role === 'admin' ? 'recruiter' : role;
      setSessionRole(normalizedRole === 'recruiter' || normalizedRole === 'candidate' ? normalizedRole : null);
      if (normalizedRole === 'candidate') void hydrateCandidate();
      if (!session) setCandidateProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  const role: UserRole = sessionRole ?? (pathname.startsWith('/candidato') ? 'candidate' : 'recruiter');
  const user = candidateProfile && role === 'candidate' ? userFromCandidate(candidateProfile) : role === 'recruiter' ? ADMIN_USER : CANDIDATE_USER;
  const activeNotifs = role === 'recruiter' ? adminNotifs : candNotifs;
  const unreadCount = activeNotifs.filter((notification) => notification.unread).length;

  const applySession = async (auth: AuthResponse) => {
    await supabase.auth.setSession({ access_token: auth.access_token, refresh_token: auth.refresh_token });
    setSessionRole(auth.user.role);
    if (auth.user.role === 'candidate') await hydrateCandidate();
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

  const refreshCandidateProfile = async () => {
    const profile = await requestCandidate('profile');
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const refreshCandidateCv = async () => {
    const profile = await requestCandidate('cv');
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const updateCandidateProfile = async (data: Record<string, unknown>) => {
    const profile = await requestCandidate('profile', { method: 'PATCH', body: JSON.stringify(data) });
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const updateCandidateCv = async (data: Record<string, unknown>) => {
    const profile = await requestCandidate('cv', { method: 'PATCH', body: JSON.stringify(data) });
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const uploadCandidateCv = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return requestCandidate('cv/file', { method: 'POST', body: formData });
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setSessionRole(null);
    setCandidateProfile(null);
    router.push('/login');
  };

  const markAllNotifsRead = () => {
    if (role === 'recruiter') setAdminNotifs((previous) => previous.map((notification) => ({ ...notification, unread: false })));
    else setCandNotifs((previous) => previous.map((notification) => ({ ...notification, unread: false })));
  };

  return <AuthContext.Provider value={{ role, user, candidateProfile, notifications: activeNotifs, unreadCount, login, registerCandidate, refreshCandidateProfile, refreshCandidateCv, updateCandidateProfile, updateCandidateCv, uploadCandidateCv, logout, markAllNotifsRead, bancoFilter, setBancoFilter }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
