"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightIcon, AwardIcon, BriefcaseIcon, VideoIcon } from "../../../shared/components/ui/Icons";
import { InterviewAnalysisResponse, useAuth } from "../../../shared/context/AuthContext";

type ApplicationItem = {
  id: string;
  vacancyId: string;
  status: string;
  submittedAt: string;
  vacancy: { title: string; organization: { name: string } };
};

const interviewStatuses = new Set(["applied", "pending", "interview_scheduled"]);
const testStatuses = new Set(["technical_test", "shortlisted"]);
const closedStatuses = new Set(["completed", "rejected", "hired"]);

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    applied: "Postulado",
    pending: "Entrevista pendiente",
    interview_scheduled: "Entrevista pendiente",
    technical_test: "Prueba tecnica",
    shortlisted: "Prueba tecnica",
    reviewed: "En revision",
    completed: "Finalizado",
    rejected: "No seleccionado",
    hired: "Contratado",
  };
  return labels[status] ?? status;
}

function applicationHref(application: ApplicationItem) {
  if (interviewStatuses.has(application.status)) {
    return `/candidato/postulaciones/entrevista?vacancyId=${encodeURIComponent(application.vacancyId)}&vacancy=${encodeURIComponent(application.vacancy.title)}`;
  }
  if (testStatuses.has(application.status)) {
    return `/candidato/prueba-tecnica?applicationId=${encodeURIComponent(application.id)}`;
  }
  return "/candidato/resultados";
}

function actionLabel(status: string) {
  if (interviewStatuses.has(status)) return "Iniciar entrevista";
  if (testStatuses.has(status)) return "Hacer prueba";
  return "Ver proceso";
}

export default function CandidatoInicioPage() {
  const { user, listCandidateApplications, listInterviewAnalyses } = useAuth();
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);
  const [analyses, setAnalyses] = React.useState<InterviewAnalysisResponse[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");
  const [reloadKey, setReloadKey] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    void Promise.allSettled([listCandidateApplications(), listInterviewAnalyses()]).then(([applicationResult, analysisResult]) => {
      if (!active) return;
      if (applicationResult.status === "rejected") {
        setError(applicationResult.reason instanceof Error ? applicationResult.reason.message : "No fue posible cargar tus postulaciones.");
        setApplications([]);
      } else {
        setApplications(Array.isArray(applicationResult.value) ? applicationResult.value as ApplicationItem[] : []);
      }
      setAnalyses(analysisResult.status === "fulfilled" && Array.isArray(analysisResult.value) ? analysisResult.value : []);
      setLoading(false);
    });
    return () => { active = false; };
  }, [listCandidateApplications, listInterviewAnalyses, reloadKey]);

  const activeApplications = applications.filter((application) => !closedStatuses.has(application.status));
  const pendingInterviews = applications.filter((application) => interviewStatuses.has(application.status));
  const pendingActions = applications.filter((application) => !closedStatuses.has(application.status));
  const completedAnalyses = analyses.filter((analysis) => analysis.status === "completed");
  const analysisByApplication = new Map(analyses.map((analysis) => [analysis.application.id, analysis]));
  const metricValue = (value: number) => loading ? "..." : String(value);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, {user.name?.trim().split(/\s+/)[0] || "Candidato"}</h1>
          <p className="page-sub">Este es el estado actualizado de tus procesos de seleccion.</p>
        </div>
        <Link href="/candidato/vacantes" className="btn btn-primary">Explorar vacantes <ArrowRightIcon size={15} /></Link>
      </div>

      {error && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--red-tint)] p-3 text-sm text-[var(--red)]" role="alert">
          <span>{error}</span>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => { setError(""); setLoading(true); setReloadKey((key) => key + 1); }}>Reintentar</button>
        </div>
      )}

      <div className="mb-6 grid grid-cols-1 gap-4.5 md:grid-cols-3">
        <Link href="/candidato/postulaciones" className="card kpi-card transition hover:-translate-y-0.5">
          <div className="kpi-icon" style={{ background: "var(--navy-tint)", color: "var(--navy)" }}><BriefcaseIcon size={18} /></div>
          <div className="kpi-value">{metricValue(activeApplications.length)}</div>
          <div className="kpi-label">Procesos activos</div>
        </Link>
        <Link href="/candidato/postulaciones" className="card kpi-card transition hover:-translate-y-0.5">
          <div className="kpi-icon" style={{ background: "var(--purple-tint)", color: "var(--purple)" }}><VideoIcon size={18} /></div>
          <div className="kpi-value">{metricValue(pendingInterviews.length)}</div>
          <div className="kpi-label">Entrevistas por iniciar</div>
        </Link>
        <Link href="/candidato/resultados" className="card kpi-card transition hover:-translate-y-0.5">
          <div className="kpi-icon" style={{ background: "var(--green-tint)", color: "var(--green)" }}><AwardIcon size={18} /></div>
          <div className="kpi-value">{metricValue(completedAnalyses.length)}</div>
          <div className="kpi-label">Resultados disponibles</div>
        </Link>
      </div>

      <section className="card card-pad mb-5" aria-labelledby="next-actions-title">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 id="next-actions-title" className="text-base font-bold">Proximos pasos</h2>
            <p className="mt-1 text-sm text-[var(--ink-soft)]">Acciones pendientes en tus postulaciones.</p>
          </div>
          <Link href="/candidato/postulaciones" className="text-sm font-semibold text-[var(--purple)] hover:underline">Ver todas</Link>
        </div>
        {loading ? <p className="text-sm text-[var(--ink-soft)]">Cargando tus procesos...</p> : pendingActions.length === 0 ? (
          <div className="rounded-xl bg-[var(--bg)] p-5 text-center">
            <p className="text-sm text-[var(--ink-soft)]">Aun no tienes acciones pendientes.</p>
            <Link href="/candidato/vacantes" className="btn btn-outline btn-sm mt-3">Buscar vacantes</Link>
          </div>
        ) : pendingActions.slice(0, 3).map((application) => {
          const analysis = analysisByApplication.get(application.id);
          const href = applicationHref(application);
          const label = actionLabel(application.status);
          return (
            <div className="evidence-row" key={application.id}>
              <div className="flex min-w-0 items-center gap-3">
                <div className="kpi-icon shrink-0" style={{ background: "var(--purple-tint)", color: "var(--purple)", width: "38px", height: "38px" }}>
                  {application.status === "reviewed" ? <AwardIcon size={18} /> : <VideoIcon size={18} />}
                </div>
                <div className="min-w-0">
                  <b className="block truncate text-sm font-semibold">{application.vacancy.title}</b>
                  <span className="text-xs text-[var(--ink-soft)]">{application.vacancy.organization.name} | {analysis?.status === "failed" ? "Analisis pendiente de reintento" : statusLabel(application.status)}</span>
                </div>
              </div>
              <Link href={href} className="btn btn-accent btn-sm shrink-0">{label}<ArrowRightIcon size={14} /></Link>
            </div>
          );
        })}
      </section>


    </div>
  );
}
