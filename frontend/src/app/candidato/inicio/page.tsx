"use client";

import React from "react";
import Link from "next/link";
import {
  BriefcaseIcon,
  VideoIcon,
  AwardIcon,
  ArrowRightIcon,
  CheckIcon,
} from "../../../shared/components/ui/Icons";
import { useAuth } from "../../../shared/context/AuthContext";

type ApplicationItem = {
  id: string;
  vacancyId: string;
  status: string;
  submittedAt: string;
  matchScore: number | null;
  vacancy: {
    title: string;
    organization?: { name: string };
  };
  interviews?: Array<{
    id: string;
    type: "technical" | "behavioral";
    status: string;
    videoUrl?: string | null;
  }>;
  interviewAnalysis?: {
    id: string;
    status: string;
    overallScore: number | null;
  } | null;
};

export default function CandidatoInicioPage() {
  const { user, listCandidateApplications } = useAuth();
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setError("");
        const data = await listCandidateApplications();
        if (active) {
          setApplications(Array.isArray(data) ? (data as unknown as ApplicationItem[]) : []);
        }
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible cargar tus postulaciones.",
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const activeApplications = applications.filter(
    (app) => app.status !== "rejected" && app.status !== "hired",
  );

  // Entrevistas técnicas pendientes
  const pendingTech = applications.filter(
    (app) =>
      !app.interviews?.some(
        (i) => i.type === "technical" && i.status === "completed",
      ),
  );

  // Entrevistas blandas/video pendientes (cuando ya completó técnica o está abierta)
  const pendingSoft = applications.filter((app) => {
    const techDone = app.interviews?.some(
      (i) => i.type === "technical" && i.status === "completed",
    );
    const softDone = app.interviews?.some(
      (i) => i.type === "behavioral" && i.status === "completed" && Boolean(i.videoUrl),
    );
    return techDone && !softDone;
  });

  const totalPendingInterviews = pendingTech.length + pendingSoft.length;

  // Resultados disponibles (con análisis IA finalizado o match persistido)
  const availableResults = applications.filter(
    (app) =>
      app.interviewAnalysis?.status === "completed" ||
      app.matchScore !== null,
  );

  const metricValue = (value: number) => (loading ? "..." : String(value));

  const candidateFirstName = user.name?.trim().split(/\s+/)[0] || "Candidato";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, {candidateFirstName}</h1>
          <p className="page-sub">
            Este es el estado real de tus procesos de selección en TalentIA.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* KPI Cards Reales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 mb-6">
        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: "var(--navy-tint)", color: "var(--navy)" }}
          >
            <BriefcaseIcon size={18} />
          </div>
          <div className="kpi-value">{metricValue(activeApplications.length)}</div>
          <div className="kpi-label">Postulaciones activas</div>
        </div>

        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: "var(--purple-tint)", color: "var(--purple)" }}
          >
            <VideoIcon size={18} />
          </div>
          <div className="kpi-value">{metricValue(totalPendingInterviews)}</div>
          <div className="kpi-label">Entrevistas pendientes</div>
        </div>

        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: "var(--green-tint)", color: "var(--green)" }}
          >
            <AwardIcon size={18} />
          </div>
          <div className="kpi-value">{metricValue(availableResults.length)}</div>
          <div className="kpi-label">Resultados listos</div>
        </div>
      </div>

      {/* Next Steps Basados en Datos Reales */}
      <div className="card card-pad">
        <h3 className="text-base font-bold mb-4">Próximos pasos</h3>

        {/* Entrevistas técnicas pendientes */}
        {pendingTech.map((application) => (
          <div className="evidence-row" key={`tech-${application.id}`}>
            <div className="flex gap-3 items-center">
              <div
                className="kpi-icon shrink-0"
                style={{
                  background: "var(--navy-tint)",
                  color: "var(--navy)",
                  width: "36px",
                  height: "36px",
                }}
              >
                <BriefcaseIcon size={18} />
              </div>
              <div>
                <b className="text-sm font-semibold">
                  Prueba técnica con IA — {application.vacancy.title}
                </b>
                <div className="text-[var(--ink-soft)] text-xs">
                  Responde las preguntas técnicas para habilitar la entrevista conductual.
                </div>
              </div>
            </div>
            <Link
              href={`/candidato/postulaciones/entrevista?vacancyId=${encodeURIComponent(
                application.vacancyId,
              )}&vacancy=${encodeURIComponent(application.vacancy.title)}`}
              className="btn btn-primary btn-sm"
            >
              Iniciar prueba técnica
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        ))}

        {/* Entrevistas conductuales/video pendientes */}
        {pendingSoft.map((application) => (
          <div className="evidence-row" key={`soft-${application.id}`}>
            <div className="flex gap-3 items-center">
              <div
                className="kpi-icon shrink-0"
                style={{
                  background: "var(--purple-tint)",
                  color: "var(--purple)",
                  width: "36px",
                  height: "36px",
                }}
              >
                <VideoIcon size={18} />
              </div>
              <div>
                <b className="text-sm font-semibold">
                  Entrevista en video — {application.vacancy.title}
                </b>
                <div className="text-[var(--ink-soft)] text-xs">
                  Prueba técnica aprobada. Graba tu respuesta en video para calcular tu Match IA.
                </div>
              </div>
            </div>
            <Link
              href={`/candidato/postulaciones/entrevista-blanda?vacancyId=${encodeURIComponent(
                application.vacancyId,
              )}&vacancy=${encodeURIComponent(application.vacancy.title)}`}
              className="btn btn-accent btn-sm"
            >
              Grabar entrevista
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        ))}

        {/* Resultados listos */}
        {availableResults.map((application) => {
          const score =
            application.interviewAnalysis?.overallScore ??
            application.matchScore;
          return (
            <div className="evidence-row" key={`result-${application.id}`}>
              <div className="flex gap-3 items-center">
                <div
                  className="kpi-icon shrink-0"
                  style={{
                    background: "var(--green-tint)",
                    color: "var(--green)",
                    width: "36px",
                    height: "36px",
                  }}
                >
                  <AwardIcon size={18} />
                </div>
                <div>
                  <b className="text-sm font-semibold">
                    Resultado listo — {application.vacancy.title}
                  </b>
                  <div className="text-[var(--ink-soft)] text-xs">
                    {score != null
                      ? `Match IA calculado: ${Math.round(score)}%`
                      : "Evaluación completada por Recursos Humanos"}
                  </div>
                </div>
              </div>
              <Link href="/candidato/resultados" className="btn btn-outline btn-sm">
                Ver resultado
              </Link>
            </div>
          );
        })}

        {!loading &&
          pendingTech.length === 0 &&
          pendingSoft.length === 0 &&
          availableResults.length === 0 && (
            <div className="py-8 text-center">
              <p className="text-sm text-[var(--ink-soft)] mb-3">
                {applications.length === 0
                  ? "Aún no te has postulado a ninguna vacante."
                  : "¡Estás al día! No tienes entrevistas pendientes en este momento."}
              </p>
              <Link href="/candidato/vacantes" className="btn btn-primary btn-sm">
                Explorar vacantes disponibles
                <ArrowRightIcon size={14} />
              </Link>
            </div>
          )}
      </div>
    </div>
  );
}
