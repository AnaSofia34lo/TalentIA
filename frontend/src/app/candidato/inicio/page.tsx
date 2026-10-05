"use client";

import React from "react";
import Link from "next/link";
import {
  BriefcaseIcon,
  VideoIcon,
  AwardIcon,
  ArrowRightIcon,
} from "../../../shared/components/ui/Icons";
import { useAuth } from "../../../shared/context/AuthContext";

type ApplicationItem = {
  id: string;
  vacancyId: string;
  status: string;
  submittedAt: string;
  vacancy: {
    title: string;
  };
};

export default function CandidatoInicioPage() {
  const { user, listCandidateApplications } = useAuth();
  const [applications, setApplications] = React.useState<ApplicationItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setError('');
        const data = await listCandidateApplications();
        if (active) setApplications(Array.isArray(data) ? data as ApplicationItem[] : []);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar tus postulaciones.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // Carga las métricas reales del candidato al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeApplications = applications.filter(
    (application) => application.status !== 'rejected' && application.status !== 'hired',
  );
  const pendingInterviews = applications.filter(
    (application) => application.status === 'pending' || application.status === 'interview_scheduled',
  );
  const availableResults = applications.filter(
    (application) => application.status === 'rejected' || application.status === 'hired',
  );
  const metricValue = (value: number) => loading ? '...' : String(value);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, {user.name.split(' ')[0]}</h1>
          <p className="page-sub">
            Este es el estado de tus procesos de selección.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4" role="alert">
          {error}
        </div>
      )}

      {/* KPI Cards */}
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
          <div className="kpi-value">{metricValue(pendingInterviews.length)}</div>
          <div className="kpi-label">Entrevista pendiente</div>
        </div>

        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: "var(--green-tint)", color: "var(--green)" }}
          >
            <AwardIcon size={18} />
          </div>
          <div className="kpi-value">{metricValue(availableResults.length)}</div>
          <div className="kpi-label">Resultados disponibles</div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="card card-pad">
        <h3 className="text-base font-bold mb-4">Próximos pasos</h3>

        {pendingInterviews.map((application) => (
          <div className="evidence-row" key={application.id}>
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
                  Entrevista en vivo con IA — {application.vacancy.title}
                </b>
                <div className="text-[var(--ink-soft)] text-xs">
                  Pendiente · Duración estimada 15 min
                </div>
              </div>
            </div>
            <Link href={`/candidato/postulaciones/entrevista?vacancyId=${encodeURIComponent(application.vacancyId)}&vacancy=${encodeURIComponent(application.vacancy.title)}`} className="btn btn-accent btn-sm">
              Iniciar
              <ArrowRightIcon size={14} />
            </Link>
          </div>
        ))}

        {availableResults.map((application) => (
          <div className="evidence-row" key={application.id}>
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
                  Resultado disponible — {application.vacancy.title}
                </b>
                <div className="text-[var(--ink-soft)] text-xs">
                  RRHH finalizó la revisión
                </div>
              </div>
            </div>
            <Link href="/candidato/resultados" className="btn btn-outline btn-sm">
              Ver resultado
            </Link>
          </div>
        ))}

        {!loading && pendingInterviews.length === 0 && availableResults.length === 0 && (
          <p className="text-sm text-[var(--ink-soft)]">
            No tienes acciones pendientes en tus postulaciones.
          </p>
        )}
      </div>
    </div>
  );
}
