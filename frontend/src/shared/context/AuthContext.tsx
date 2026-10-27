"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "../lib/supabase";
import { UserRole, UserProfile, Notificacion } from "../types";
import {
  ADMIN_USER,
  NOTIFS_ADMIN,
  NOTIFS_CAND,
} from "../data/mockData";
import { setRecruiterVerified } from "../components/auth/RecruiterAuthGuard";
import { setCandidateVerified } from "../components/auth/CandidateAuthGuard";

export interface CandidateProfileResponse {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  identityDocument?: {
    id: string;
    fileName: string;
    mimeType: string | null;
    sizeBytes: number | null;
    createdAt: string;
  } | null;
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
    resumeAnalysisStatus?: "processing" | "completed" | "failed" | null;
  } | null;
  cvProfile?: {
    professionalTitle: string;
    currentCompany: string;
    yearsOfExperience: number | null;
    summary: string;
  };
}

export interface CandidateResumeAnalysisResponse {
  workExperiences: Array<{
    id: string;
    company: string | null;
    role: string | null;
    startDate: string | null;
    endDate: string | null;
    description: string | null;
  }>;
  certifications: Array<{
    id: string;
    name: string | null;
    issuer: string | null;
    date: string | null;
  }>;
  technicalSkills: Array<{
    id: string;
    name: string;
    estimatedProficiency: number | null;
  }>;
}

export interface InterviewAnalysisResponse {
  id: string;
  status:
    | "pending"
    | "processing"
    | "completed"
    | "failed"
    | "not_available"
    | "ready_to_analyze";
  technicalScore: number | null;
  behavioralScore: number | null;
  overallScore: number | null;
  technicalSummary: string | null;
  behavioralSummary: string | null;
  strengths: string[];
  improvements: string[];
  recommendation: string | null;
  scoreExplanation?: {
    technical: string | null;
    behavioral: string | null;
    positiveFactors: string[];
    improvementFactors: string[];
  };
  failureReason: string | null;
  analyzedAt: string | null;
  interviewsReady?: boolean;
  application: { id: string; vacancy: { title: string; organization: string } };
}

export interface TechnicalTestAccessResponse {
  applicationId: string;
  enabled: boolean;
  matchPercentage: number | null;
  threshold: number;
  status:
    | "enabled"
    | "below_threshold"
    | "analysis_not_ready"
    | "analysis_failed"
    | "analysis_in_progress";
  message: string;
  vacancyTitle: string;
  evaluatedAt: string | null;
}

export interface RecruiterCandidateAnalysisResponse {
  candidate: {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    profile?: {
      professionalTitle?: string | null;
      currentCompany?: string | null;
      yearsOfExperience?: number | null;
    } | null;
    technicalSkills: Array<{ name: string; estimatedProficiency: number }>;
    cvFileName?: string | null;
    cvDownloadUrl?: string | null;
  };
  application: {
    id: string;
    status: string;
    submittedAt: string;
    matchScore?: number | null;
    vacancy: { id: string; title: string; organization: string };
  };
  analysis: InterviewAnalysisResponse;
  dofa?: {
    strengths: string[];
    opportunities: string[];
    weaknesses: string[];
    threats: string[];
    notes: {
      weaknesses: string;
      threats: string;
      opportunities: string;
    };
  };
  competencies?: {
    technicalPercentage: number | null;
    softPercentage: number | null;
    technicalBars: Array<{
      name: string;
      percentage: number;
      source: string;
      matched?: boolean;
    }>;
  };
  evidences?: Array<{
    id: string;
    competency: string;
    kind: 'technical' | 'soft' | 'cv' | 'general';
    summary: string;
    score: number | null;
    href: string;
  }>;
  interviews?: {
    technicalId: string | null;
    behavioralId: string | null;
    hasVideo: boolean;
  };
}

export interface RecruiterReportItem {
  applicationId: string;
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  initials: string;
  vacancyId: string;
  vacancyTitle: string;
  organization: string;
  overallScore: number | null;
  technicalScore: number | null;
  behavioralScore: number | null;
  recommendation: string | null;
  analyzedAt: string | null;
}

export interface RecruiterInterviewReviewSession {
  id: string;
  type: string;
  status: string;
  startedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  videoUrl: string | null;
  videoDownloadUrl: string | null;
  answers: Array<{
    id: string;
    responseText: string | null;
    question: { id: string; category: string; prompt: string };
  }>;
  markers: Array<{
    id: string;
    timestampMs: number;
    questionId: string;
    question: { id: string; category: string; prompt: string };
  }>;
  questions: Array<{ id: string; category: string; prompt: string }>;
}

export interface RecruiterInterviewReviewResponse {
  candidate: { id: string; fullName: string };
  vacancy: { id: string; title: string };
  applicationId: string;
  interview: RecruiterInterviewReviewSession | null;
  interviews: RecruiterInterviewReviewSession[];
}

export interface RecruiterDashboardStats {
  organizationName: string;
  totalVacancies: number;
  activeVacancies: number;
  totalApplicants: number;
  completedInterviews: number;
  averageMatchScore: number;
  vacanciesBreakdown: Array<{
    id: string;
    title: string;
    applicantCount: number;
    status: string;
  }>;
  statusBreakdown: {
    applied: number;
    reviewed: number;
    interview_scheduled: number;
    completed: number;
    rejected: number;
    hired: number;
  };
  topSkills: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  recentApplications: Array<{
    applicationId: string;
    candidateId: string;
    candidateName: string;
    candidateEmail: string;
    vacancyTitle: string;
    submittedAt: string;
    status: string;
    matchScore: number | null;
  }>;
}

interface AuthContextType {
  role: UserRole;
  user: UserProfile;
  candidateProfile: CandidateProfileResponse | null;
  notifications: Notificacion[];
  unreadCount: number;
  getRecruiterDashboardStats: () => Promise<RecruiterDashboardStats>;
  login: (
    email: string,
    password: string,
    expectedRole?: UserRole,
  ) => Promise<UserRole>;
  registerCandidate: (
    email: string,
    password: string,
    confirmPassword: string,
  ) => Promise<void>;
  registerRecruiter: (
    email: string,
    password: string,
    confirmPassword: string,
    companyName: string,
  ) => Promise<void>;
  refreshCandidateProfile: () => Promise<CandidateProfileResponse>;
  refreshCandidateCv: () => Promise<CandidateProfileResponse>;
  getCandidateCvAnalysisStatus: () => Promise<{
    cvId: string | null;
    status: "processing" | "completed" | "failed" | null;
  }>;
  getCandidateResumeAnalysis: () => Promise<CandidateResumeAnalysisResponse>;
  updateCandidateProfile: (
    data: Record<string, unknown>,
  ) => Promise<CandidateProfileResponse>;
  updateCandidateCv: (
    data: Record<string, unknown>,
  ) => Promise<CandidateProfileResponse>;
  uploadCandidateCv: (
    file: File,
  ) => Promise<{ fileName: string; downloadUrl: string | null }>;
  uploadIdentityDocument: (file: File) => Promise<{ message: string }>;
  getRecruiterIdentityDocument: (applicationId: string) => Promise<{
    candidateName: string;
    fileName: string;
    mimeType: string | null;
    downloadUrl: string;
    expiresInSeconds: number;
  }>;
  createVacancy: (data: {
    name: string;
    description: string;
    salary: number;
    requirements?: string;
    technicalSkills?: string[];
    interviewQuestions: Array<{
      category: "technical" | "behavioral";
      prompt: string;
      sortOrder: number;
    }>;
  }) => Promise<{
    id: string;
    name: string;
    description: string;
    salary: number;
  }>;
  generateInterviewQuestions: (data: {
    name: string;
    description: string;
    salary: number;
    technicalSkills?: string[];
    softSkills?: string[];
    area?: string;
    level?: string;
    modality?: string;
    useCases?: string;
  }) => Promise<
    Array<{
      category: "technical" | "behavioral";
      prompt: string;
      sortOrder: number;
    }>
  >;
  updateVacancy: (
    vacancyId: string,
    data: {
      name: string;
      description: string;
      salary: number;
      requirements?: string;
      status: string;
      technicalSkills?: string[];
      interviewQuestions?: Array<{
        category: "technical" | "behavioral";
        prompt: string;
        sortOrder: number;
      }>;
    },
  ) => Promise<{
    id: string;
    name: string;
    description: string;
    salary: number;
    status: string;
  }>;
  listVacancies: () => Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      salary: number;
      requirements?: string;
      status: string;
      interviewQuestions?: Array<{
        category: "technical" | "behavioral";
        prompt: string;
        sortOrder: number;
      }>;
    }>
  >;
  listVacancyApplicants: (vacancyId: string) => Promise<{
    vacancy: { id: string; name: string; description: string; status: string; organization: string };
    totalCandidates: number;
    ranking: VacancyApplicant[];
    candidates: VacancyApplicant[];
  }>;
  listAvailableVacancies: () => Promise<
    Array<{
      id: string;
      name: string;
      description: string;
      salary: number;
      status: string;
    }>
  >;
  applyToVacancy: (
    vacancyId: string,
  ) => Promise<{
    id: string;
    vacancyId: string;
    status: string;
    submittedAt: string;
  }>;
  listCandidateApplications: () => Promise<
    Array<{
      id: string;
      vacancyId: string;
      status: string;
      submittedAt: string;
      vacancy: {
        title: string;
        description: string;
        salary: number;
        status: string;
        organization: { name: string };
      };
    }>
  >;
  startTechnicalInterview: (vacancyId: string) => Promise<{
    interviewId: string;
    status: string;
    startedAt: string | null;
    remainingSeconds: number | null;
    durationSeconds: number;
    vacancy: { title: string; organization: string };
    questions: Array<{
      id: string;
      category: string;
      prompt: string;
      answer: string | null;
    }>;
  }>;
  startBehavioralInterview: (vacancyId: string) => Promise<{
    interviewId: string;
    status: string;
    startedAt: string | null;
    remainingSeconds: number | null;
    durationSeconds: number;
    vacancy: { title: string; organization: string };
    questions: Array<{
      id: string;
      category: string;
      prompt: string;
      answer: string | null;
    }>;
  }>;
  submitTechnicalAnswer: (
    interviewId: string,
    questionId: string,
    responseText: string,
  ) => Promise<{ id: string; questionId: string; responseText: string | null }>;
  markVideoQuestion: (
    interviewId: string,
    questionId: string,
    timestampMs: number,
  ) => Promise<{ id: string; questionId: string; timestampMs: number }>;
  completeTechnicalInterview: (
    interviewId: string,
  ) => Promise<{ interviewId: string; status: string; timedOut?: boolean }>;
  uploadInterviewVideo: (
    interviewId: string,
    video: Blob,
  ) => Promise<{ interviewId: string; videoUrl: string }>;
  listInterviewAnalyses: () => Promise<InterviewAnalysisResponse[]>;
  getCandidateInterviewAnalysis: (
    applicationId: string,
  ) => Promise<InterviewAnalysisResponse>;
  getRecruiterApplicationAnalysis: (applicationId: string) => Promise<RecruiterCandidateAnalysisResponse>;
  getRecruiterCandidateCvDownloadUrl: (applicationId: string) => Promise<{ downloadUrl: string }>;
  listRecruiterReports: () => Promise<RecruiterReportItem[]>;
  getRecruiterInterviewReview: (
    applicationId: string,
    interviewType?: 'technical' | 'behavioral',
  ) => Promise<RecruiterInterviewReviewResponse>;
  runCandidateInterviewAnalysis: (
    applicationId: string,
    force?: boolean,
  ) => Promise<InterviewAnalysisResponse>;
  getTechnicalTestAccess: (
    applicationId: string,
  ) => Promise<TechnicalTestAccessResponse>;
  getVacancyMatch: (
    vacancyId: string,
  ) => Promise<{ matchPercentage: number; evaluatedSkills: number }>;
  getVacancyMatches: () => Promise<Array<{ vacancyId: string; matchPercentage: number; evaluatedSkills: number }>>;
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

export interface VacancyApplicant {
  applicationId: string;
  candidateId: string;
  fullName: string;
  email: string;
  phone?: string | null;
  submittedAt: string;
  status: string;
  score: number;
  scoreSource: 'interview_ai' | 'stored_match' | 'cv_skills';
  rank: number;
  medal: 'gold' | 'silver' | 'bronze' | null;
  interviewAnalysis?: {
    status: string;
    technicalScore: number | null;
    behavioralScore: number | null;
    overallScore: number | null;
  } | null;
  profile?: { professionalTitle?: string | null; currentCompany?: string | null } | null;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";
let sessionReplacementRedirectPending = false;

function initialsFromName(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function userFromCandidate(profile: CandidateProfileResponse): UserProfile {
  return {
    name: profile.fullName,
    email: profile.email,
    phone: profile.phone,
    roleTitle: profile.candidateProfile?.professionalTitle || "Candidato",
    avatarInitials: initialsFromName(profile.fullName),
  };
}

async function parseResponse(response: Response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (
      payload.code === "SESSION_REPLACED" &&
      !sessionReplacementRedirectPending
    ) {
      sessionReplacementRedirectPending = true;
      await supabase.auth.signOut({ scope: "local" });
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("talentia:session-replaced"));
      }
    }
    const message = Array.isArray(payload.message)
      ? payload.message[0]
      : payload.message;
    throw new Error(message ?? "No fue posible completar la operación.");
  }
  return payload;
}

async function requestAuth(
  path: string,
  body: Record<string, string>,
): Promise<AuthResponse> {
  return parseResponse(
    await fetch(`${API_URL}/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

let memoryAccessToken: string | null = null;
let memoryTokenExp = 0;

export function setMemoryAccessToken(token: string | null, expiresAt?: number) {
  memoryAccessToken = token;
  memoryTokenExp = expiresAt ? expiresAt * 1000 : (token ? Date.now() + 3600_000 : 0);
}

async function getAccessToken(): Promise<string> {
  const now = Date.now();
  if (memoryAccessToken && now < memoryTokenExp - 10_000) {
    return memoryAccessToken;
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) {
    memoryAccessToken = null;
    throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  }
  memoryAccessToken = data.session.access_token;
  memoryTokenExp = data.session.expires_at ? data.session.expires_at * 1000 : now + 3600_000;
  return memoryAccessToken;
}

async function requestCandidate(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  return parseResponse(
    await fetch(`${API_URL}/candidate/${path}`, { ...init, headers }),
  );
}

async function requestApi(path: string, init: RequestInit = {}) {
  const token = await getAccessToken();
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData))
    headers.set("Content-Type", "application/json");
  return parseResponse(await fetch(`${API_URL}/${path}`, { ...init, headers }));
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sessionRole, setSessionRole] = useState<UserRole | null>(null);
  const [candidateProfile, setCandidateProfile] =
    useState<CandidateProfileResponse | null>(null);
  const [adminNotifs, setAdminNotifs] = useState<Notificacion[]>(NOTIFS_ADMIN);
  const [candNotifs, setCandNotifs] = useState<Notificacion[]>(NOTIFS_CAND);
  const [bancoFilter, setBancoFilter] = useState<string>(
    "Desarrollo de Software",
  );
  const hydratingRef = React.useRef(false);

  const hydrateCandidate = async () => {
    if (hydratingRef.current) return;
    hydratingRef.current = true;
    try {
      const profile = await requestCandidate("profile");
      setCandidateProfile(profile);
      return profile;
    } catch {
      return null;
    } finally {
      hydratingRef.current = false;
    }
  };

  useEffect(() => {
    const handleSessionReplaced = () => {
      router.replace("/login?reason=session-replaced");
    };
    window.addEventListener("talentia:session-replaced", handleSessionReplaced);
    return () => window.removeEventListener("talentia:session-replaced", handleSessionReplaced);
  }, [router]);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setMemoryAccessToken(data.session.access_token, data.session.expires_at);
      }
      const role = data.session?.user.app_metadata?.role as string | undefined;
      const normalizedRole = role === "admin" ? "recruiter" : role;
      if (normalizedRole === "recruiter" || normalizedRole === "candidate") {
        setSessionRole(normalizedRole);
        if (normalizedRole === "candidate") void hydrateCandidate();
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setMemoryAccessToken(session?.access_token ?? null, session?.expires_at);
        const role = session?.user.app_metadata?.role as string | undefined;
        const normalizedRole = role === "admin" ? "recruiter" : role;
        setSessionRole(
          normalizedRole === "recruiter" || normalizedRole === "candidate"
            ? normalizedRole
            : null,
        );
        if (normalizedRole === "candidate") void hydrateCandidate();
        if (!session) setCandidateProfile(null);
      },
    );
    return () => listener.subscription.unsubscribe();
  }, []);

  const role: UserRole =
    sessionRole ??
    (pathname.startsWith("/candidato") ? "candidate" : "recruiter");
  const user =
    candidateProfile && role === "candidate"
      ? userFromCandidate(candidateProfile)
      : role === "recruiter"
        ? ADMIN_USER
        : {
            name: "Candidato",
            email: "",
            roleTitle: "Candidato",
            avatarInitials: "CA",
            phone: "",
          };
  const activeNotifs = role === "recruiter" ? adminNotifs : candNotifs;
  const unreadCount = activeNotifs.filter(
    (notification) => notification.unread,
  ).length;

  const applySession = async (auth: AuthResponse) => {
    sessionReplacementRedirectPending = false;
    await supabase.auth.setSession({
      access_token: auth.access_token,
      refresh_token: auth.refresh_token,
    });
    setSessionRole(auth.user.role);
    if (auth.user.role === "candidate") await hydrateCandidate();
  };

  const login = async (
    email: string,
    password: string,
    expectedRole?: UserRole,
  ) => {
    const auth = await requestAuth("login", { email, password });
    if (expectedRole && auth.user.role !== expectedRole) {
      throw new Error(
        expectedRole === "recruiter"
          ? "Esta cuenta no es de reclutador. Selecciona «Soy candidato» o usa otra cuenta."
          : "Esta cuenta no es de candidato. Selecciona «Soy reclutador» o usa otra cuenta.",
      );
    }
    await applySession(auth);
    return auth.user.role;
  };

  const registerCandidate = async (
    email: string,
    password: string,
    confirmPassword: string,
  ) => {
    const auth = await requestAuth("register", {
      email,
      password,
      confirmPassword,
    });
    await applySession(auth);
  };

  const registerRecruiter = async (
    email: string,
    password: string,
    confirmPassword: string,
    companyName: string,
  ) => {
    const auth = await requestAuth("register/recruiter", {
      email,
      password,
      confirmPassword,
      fullName: companyName,
    });
    await applySession(auth);
  };

  const createVacancy = async (data: {
    name: string;
    description: string;
    salary: number;
    requirements?: string;
    technicalSkills?: string[];
    interviewQuestions: Array<{
      category: "technical" | "behavioral";
      prompt: string;
      sortOrder: number;
    }>;
  }) => {
    return requestApi("vacancies", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  const generateInterviewQuestions = async (data: {
    name: string;
    description: string;
    salary: number;
    technicalSkills?: string[];
    softSkills?: string[];
    area?: string;
    level?: string;
    modality?: string;
    useCases?: string;
  }) => {
    return requestApi("vacancies/generate-interview-questions", {
      method: "POST",
      body: JSON.stringify(data),
    });
  };

  const updateVacancy = async (
    vacancyId: string,
    data: {
      name: string;
      description: string;
      salary: number;
      requirements?: string;
      status: string;
      technicalSkills?: string[];
      interviewQuestions?: Array<{
        category: "technical" | "behavioral";
        prompt: string;
        sortOrder: number;
      }>;
    },
  ) => {
    return requestApi(`vacancies/${vacancyId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    });
  };

  const listVacancies = async () => {
    return requestApi("vacancies");
  };

  const listVacancyApplicants = async (vacancyId: string) => {
    return requestApi(`vacancies/${vacancyId}/applications`) as Promise<{
      vacancy: { id: string; name: string; description: string; status: string; organization: string };
      totalCandidates: number;
      ranking: VacancyApplicant[];
      candidates: VacancyApplicant[];
    }>;
  };

  const listAvailableVacancies = async () => {
    return requestApi("vacancies/available");
  };

  const applyToVacancy = async (vacancyId: string) => {
    return requestApi(`candidate/applications/${vacancyId}`, {
      method: "POST",
    });
  };

  const listCandidateApplications = async () => {
    return requestCandidate("applications");
  };

  const startTechnicalInterview = async (vacancyId: string) => {
    return requestApi("candidate/interviews/technical/start", {
      method: "POST",
      body: JSON.stringify({ vacancyId }),
    });
  };

  const startBehavioralInterview = async (vacancyId: string) => {
    return requestApi("candidate/interviews/behavioral/start", {
      method: "POST",
      body: JSON.stringify({ vacancyId }),
    });
  };

  const submitTechnicalAnswer = async (
    interviewId: string,
    questionId: string,
    responseText: string,
  ) => {
    return requestApi(`candidate/interviews/${interviewId}/answers`, {
      method: "POST",
      body: JSON.stringify({ questionId, responseText }),
    });
  };

  const markVideoQuestion = async (
    interviewId: string,
    questionId: string,
    timestampMs: number,
  ) => {
    return requestApi(`candidate/interviews/${interviewId}/video-markers`, {
      method: "POST",
      body: JSON.stringify({ questionId, timestampMs }),
    });
  };

  const completeTechnicalInterview = async (interviewId: string) => {
    return requestApi(`candidate/interviews/${interviewId}/complete`, {
      method: "PATCH",
    });
  };

  const uploadInterviewVideo = async (interviewId: string, video: Blob) => {
    const formData = new FormData();
    formData.append("video", video, `entrevista-${interviewId}.webm`);
    return requestApi(`candidate/interviews/${interviewId}/video`, {
      method: "POST",
      body: formData,
    });
  };

  const getVacancyMatch = async (vacancyId: string) => {
    return requestApi(`vacancies/${vacancyId}/match`);
  };

  const getVacancyMatches = async () => {
    return requestApi("vacancies/matches") as Promise<Array<{ vacancyId: string; matchPercentage: number; evaluatedSkills: number }>>;
  };

  const listInterviewAnalyses = async () => {
    return requestApi("candidate/interview-analyses") as Promise<
      InterviewAnalysisResponse[]
    >;
  };

  const getCandidateInterviewAnalysis = async (applicationId: string) => {
    return requestApi(
      `candidate/applications/${applicationId}/interview-analysis`,
    ) as Promise<InterviewAnalysisResponse>;
  };

  const runCandidateInterviewAnalysis = async (
    applicationId: string,
    force = true,
  ) => {
    return requestApi(
      `candidate/applications/${applicationId}/interview-analysis`,
      {
        method: "POST",
        body: JSON.stringify({ force }),
      },
    ) as Promise<InterviewAnalysisResponse>;
  };

  const getRecruiterApplicationAnalysis = async (applicationId: string) => {
    return requestApi(
      `recruiter/applications/${applicationId}/interview-analysis`,
    ) as Promise<RecruiterCandidateAnalysisResponse>;
  };

  const getRecruiterCandidateCvDownloadUrl = async (applicationId: string) => {
    return requestApi(
      `recruiter/applications/${applicationId}/cv-download`,
    ) as Promise<{ downloadUrl: string }>;
  };

  const getRecruiterDashboardStats = async () => {
    return requestApi('recruiter/dashboard/stats') as Promise<RecruiterDashboardStats>;
  };

  const listRecruiterReports = async () => {
    return requestApi('recruiter/reports') as Promise<RecruiterReportItem[]>;
  };

  const getRecruiterInterviewReview = async (
    applicationId: string,
    interviewType: 'technical' | 'behavioral' = 'behavioral',
  ) => {
    const query = interviewType ? `?interviewType=${interviewType}` : '';
    return requestApi(
      `recruiter/applications/${applicationId}/interview-review${query}`,
    ) as Promise<RecruiterInterviewReviewResponse>;
  };

  const getTechnicalTestAccess = async (applicationId: string) => {
    return requestApi(
      `candidate/applications/${applicationId}/technical-test-access`,
    ) as Promise<TechnicalTestAccessResponse>;
  };

  const refreshCandidateProfile = async () => {
    const profile = await requestCandidate("profile");
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const refreshCandidateCv = async () => {
    const profile = await requestCandidate("cv");
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const getCandidateCvAnalysisStatus = async () => {
    return requestCandidate("cv/analysis-status") as Promise<{
      cvId: string | null;
      status: "processing" | "completed" | "failed" | null;
    }>;
  };

  const getCandidateResumeAnalysis = async () => {
    return requestApi("candidate/resume/analysis") as Promise<CandidateResumeAnalysisResponse>;
  };

  const updateCandidateProfile = async (data: Record<string, unknown>) => {
    const profile = await requestCandidate("profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const updateCandidateCv = async (data: Record<string, unknown>) => {
    const profile = await requestCandidate("cv", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    setCandidateProfile(profile);
    return profile as CandidateProfileResponse;
  };

  const uploadCandidateCv = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return requestCandidate("cv/file", { method: "POST", body: formData });
  };

  const uploadIdentityDocument = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const result = await requestCandidate("identity-document", {
      method: "POST",
      body: formData,
    });
    await refreshCandidateProfile();
    return result as { message: string };
  };

  const getRecruiterIdentityDocument = async (applicationId: string) => {
    return requestApi(
      `recruiter/applications/${encodeURIComponent(applicationId)}/identity-document`,
    );
  };

  const logout = async () => {
    setMemoryAccessToken(null);
    setRecruiterVerified(false);
    setCandidateVerified(false);
    setSessionRole(null);
    setCandidateProfile(null);
    await supabase.auth.signOut();
    router.replace("/login");
  };

  const markAllNotifsRead = () => {
    if (role === "recruiter")
      setAdminNotifs((previous) =>
        previous.map((notification) => ({ ...notification, unread: false })),
      );
    else
      setCandNotifs((previous) =>
        previous.map((notification) => ({ ...notification, unread: false })),
      );
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        candidateProfile,
        notifications: activeNotifs,
        unreadCount,
        login,
        registerCandidate,
        registerRecruiter,
        refreshCandidateProfile,
        refreshCandidateCv,
        getCandidateCvAnalysisStatus,
        getCandidateResumeAnalysis,
        updateCandidateProfile,
        updateCandidateCv,
        uploadCandidateCv,
        uploadIdentityDocument,
        getRecruiterIdentityDocument,
        createVacancy,
        generateInterviewQuestions,
        updateVacancy,
        listVacancies,
        listVacancyApplicants,
        listAvailableVacancies,
        applyToVacancy,
        listCandidateApplications,
        startTechnicalInterview,
        startBehavioralInterview,
        submitTechnicalAnswer,
        markVideoQuestion,
        completeTechnicalInterview,
        uploadInterviewVideo,
        getVacancyMatch,
        getVacancyMatches,
        listInterviewAnalyses,
        getCandidateInterviewAnalysis,
        runCandidateInterviewAnalysis,
        getRecruiterApplicationAnalysis,
        getRecruiterCandidateCvDownloadUrl,
        getRecruiterDashboardStats,
        listRecruiterReports,
        getRecruiterInterviewReview,
        getTechnicalTestAccess,
        logout,
        markAllNotifsRead,
        bancoFilter,
        setBancoFilter,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
