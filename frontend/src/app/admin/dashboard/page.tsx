"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  BriefcaseIcon,
  VideoIcon,
  AwardIcon,
  PlusIcon,
  UserIcon,
  ArrowRightIcon,
  LogoSparkIcon,
} from "../../../shared/components/ui/Icons";
import {
  RecruiterDashboardStats,
  useAuth,
} from "../../../shared/context/AuthContext";

export default function AdminDashboardPage() {
  const { user, getRecruiterDashboardStats } = useAuth();
  const [stats, setStats] = useState<RecruiterDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError("");
        const data = await getRecruiterDashboardStats();
        if (active) setStats(data);
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "No fue posible cargar las estadísticas del dashboard.",
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

  const recruiterFirstName =
    user.name?.trim().split(/\s+/)[0] || "Reclutador";

  const totalApplicants = stats?.totalApplicants ?? 0;
  const activeVacancies = stats?.activeVacancies ?? 0;
  const totalVacancies = stats?.totalVacancies ?? 0;
  const completedInterviews = stats?.completedInterviews ?? 0;
  const avgMatch = stats?.averageMatchScore ?? 0;
  const orgName = stats?.organizationName || "Tu Organización";

  // Cálculos para gráfico de barras por vacante
  const vacancies = stats?.vacanciesBreakdown ?? [];
  const maxApplicantCount = Math.max(
    1,
    ...vacancies.map((v) => v.applicantCount),
  );

  // Cálculos para donut de estados de candidatos
  const status = stats?.statusBreakdown ?? {
    applied: 0,
    reviewed: 0,
    interview_scheduled: 0,
    completed: 0,
    rejected: 0,
    hired: 0,
  };

  const inEvaluation = status.applied + status.reviewed;
  const inInterview = status.interview_scheduled;
  const approved = status.completed + status.hired;
  const rejected = status.rejected;

  const pctEval = totalApplicants ? Math.round((inEvaluation / totalApplicants) * 100) : 0;
  const pctInterview = totalApplicants ? Math.round((inInterview / totalApplicants) * 100) : 0;
  const pctApproved = totalApplicants ? Math.round((approved / totalApplicants) * 100) : 0;
  const pctRejected = totalApplicants ? Math.max(0, 100 - pctEval - pctInterview - pctApproved) : 0;

  const donutGradient = totalApplicants > 0
    ? `conic-gradient(var(--navy) 0% ${pctEval}%, var(--purple) ${pctEval}% ${pctEval + pctInterview}%, var(--green) ${pctEval + pctInterview}% ${pctEval + pctInterview + pctApproved}%, var(--red) ${pctEval + pctInterview + pctApproved}% 100%)`
    : "conic-gradient(#e2e8f0 0% 100%)";

  return (
    <div>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Buenos días, {recruiterFirstName}</h1>
          <p className="page-sub">
            Métricas reales de selección y estado del talento en {orgName}.
          </p>
        </div>
        <Link href="/admin/vacantes/crear" className="btn btn-accent">
          <PlusIcon size={16} />
          Nueva Vacante
        </Link>
      </div>

      {error && (
        <div
          className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Hero Banner */}
      <div
        className="card relative overflow-hidden text-white p-8 md:p-9 mb-6 border-0"
        style={{ background: "var(--grad-brand)" }}
      >
        <div
          className="absolute w-[260px] h-[260px] rounded-full -top-[100px] -right-[60px] pointer-events-none"
          style={{ background: "rgba(255, 255, 255, 0.08)" }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="max-w-[640px]">
            <span
              className="badge mb-3.5 inline-flex items-center"
              style={{
                background: "rgba(255, 255, 255, 0.16)",
                color: "#fff",
              }}
            >
              <span className="badge-dot" />
              TalentIA para {orgName}
            </span>
            <h2 className="text-white text-xl md:text-2xl font-bold leading-snug mb-2.5">
              Selección de talento impulsada por IA con evidencia real
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              TalentIA analiza hojas de vida, conduce entrevistas técnicas y
              conductuales, y calcula el porcentaje de afinidad para cada vacante
              activa. Las métricas que ves aquí reflejan el estado real y vivo de
              tu base de datos.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 px-5 min-w-[120px]">
              <div className="text-white text-2xl font-extrabold font-['Poppins']">
                {loading ? "..." : activeVacancies}
              </div>
              <div className="text-white/75 text-xs">Vacantes activas</div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 px-5 min-w-[120px]">
              <div className="text-white text-2xl font-extrabold font-['Poppins']">
                {loading ? "..." : totalApplicants}
              </div>
              <div className="text-white/75 text-xs">Postulantes registrados</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid Real */}
      <div className="kpi-grid mb-6">
        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div
              className="kpi-icon"
              style={{ background: "var(--navy-tint)", color: "var(--navy)" }}
            >
              <BriefcaseIcon size={18} />
            </div>
            <span className="kpi-trend text-xs font-semibold text-[var(--ink-faint)]">
              {totalVacancies} en total
            </span>
          </div>
          <div className="kpi-value">{loading ? "..." : activeVacancies}</div>
          <div className="kpi-label">Vacantes activas</div>
        </div>

        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div
              className="kpi-icon"
              style={{
                background: "var(--purple-tint)",
                color: "var(--purple)",
              }}
            >
              <UserIcon size={18} />
            </div>
            <span className="kpi-trend text-xs font-semibold text-[var(--ink-faint)]">
              En tu organización
            </span>
          </div>
          <div className="kpi-value">{loading ? "..." : totalApplicants}</div>
          <div className="kpi-label">Postulantes totales</div>
        </div>

        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div
              className="kpi-icon"
              style={{ background: "var(--info-tint)", color: "var(--info)" }}
            >
              <VideoIcon size={18} />
            </div>
            <span className="kpi-trend text-xs font-semibold text-[var(--green)]">
              Concluidas
            </span>
          </div>
          <div className="kpi-value">{loading ? "..." : completedInterviews}</div>
          <div className="kpi-label">Entrevistas realizadas</div>
        </div>

        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div
              className="kpi-icon"
              style={{ background: "var(--green-tint)", color: "var(--green)" }}
            >
              <AwardIcon size={18} />
            </div>
            <span className="kpi-trend text-xs font-semibold text-[var(--navy)]">
              Match IA
            </span>
          </div>
          <div className="kpi-value">{loading ? "..." : `${avgMatch}%`}</div>
          <div className="kpi-label">Compatibilidad promedio</div>
        </div>
      </div>

      {/* Charts Row 1: Barras Reales por Vacante + Donut de Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4.5 mb-6">
        <div className="card chart-card flex flex-col justify-between">
          <div>
            <h3 className="chart-title">Postulaciones por vacante</h3>
            <div className="chart-sub">Registros reales vinculados</div>
          </div>

          {loading ? (
            <p className="text-sm text-[var(--ink-soft)] my-12 text-center">
              Cargando métricas de vacantes…
            </p>
          ) : vacancies.length === 0 ? (
            <div className="py-12 text-center text-sm text-[var(--ink-soft)]">
              Aún no tienes vacantes creadas.
              <div className="mt-3">
                <Link href="/admin/vacantes/crear" className="btn btn-outline btn-sm">
                  Crear mi primera vacante
                </Link>
              </div>
            </div>
          ) : (
            <div className="bars mt-6 min-h-[170px]">
              {vacancies.slice(0, 5).map((vac) => {
                const heightPct = Math.max(
                  12,
                  Math.round((vac.applicantCount / maxApplicantCount) * 100),
                );
                return (
                  <div className="bar-col" key={vac.id}>
                    <span className="bar-value">{vac.applicantCount}</span>
                    <div
                      className="bar"
                      style={{
                        height: `${vac.applicantCount > 0 ? heightPct : 6}%`,
                        background:
                          vac.applicantCount > 0
                            ? "var(--grad-brand)"
                            : "var(--navy-tint)",
                      }}
                    />
                    <span
                      className="bar-label line-clamp-2"
                      title={vac.title}
                    >
                      {vac.title}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card chart-card">
          <h3 className="chart-title">Estado de candidatos</h3>
          <div className="chart-sub">Pipeline real actual</div>
          <div className="donut-wrap flex-col sm:flex-row items-center justify-around mt-4">
            <div
              className="donut"
              style={{ background: donutGradient }}
            >
              <div className="donut-center">
                <b>{loading ? "..." : totalApplicants}</b>
                <span>Total</span>
              </div>
            </div>
            <div>
              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: "var(--navy)" }}
                />
                En evaluación ({pctEval}%) · {inEvaluation}
              </div>
              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: "var(--purple)" }}
                />
                Entrevista agendada ({pctInterview}%) · {inInterview}
              </div>
              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: "var(--green)" }}
                />
                Aprobados ({pctApproved}%) · {approved}
              </div>
              <div className="legend-item">
                <span
                  className="legend-dot"
                  style={{ background: "var(--red)" }}
                />
                Descartados ({pctRejected}%) · {rejected}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2: Skills Reales Requeridas + Postulaciones Recientes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
        <div className="card chart-card">
          <h3 className="chart-title">Competencias más requeridas</h3>
          <div className="chart-sub">
            Extraídas de las habilidades de tus vacantes
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {loading ? (
              <p className="text-sm text-[var(--ink-soft)] py-6 text-center">
                Calculando competencias…
              </p>
            ) : (stats?.topSkills ?? []).length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)] py-6 text-center">
                Configura habilidades técnicas en tus vacantes para visualizarlas aquí.
              </p>
            ) : (
              (stats?.topSkills ?? []).map((skill) => (
                <div className="hbar-row" key={skill.name}>
                  <span className="hbar-label font-medium">{skill.name}</span>
                  <div className="hbar-track">
                    <div
                      className="hbar-fill"
                      style={{ width: `${Math.max(10, skill.percentage)}%` }}
                    />
                  </div>
                  <span className="hbar-pct">{skill.count} vac.</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="card chart-card">
          <div className="flex justify-between items-center mb-1">
            <h3 className="chart-title">Postulantes recientes</h3>
            <Link
              href="/admin/reportes"
              className="text-xs text-[var(--navy)] font-bold hover:underline flex items-center gap-1"
            >
              Ver todos en Reportes
              <ArrowRightIcon size={12} />
            </Link>
          </div>
          <div className="chart-sub mb-3">Últimas postulaciones registradas</div>

          {loading ? (
            <p className="text-sm text-[var(--ink-soft)] py-6 text-center">
              Cargando postulantes…
            </p>
          ) : (stats?.recentApplications ?? []).length === 0 ? (
            <div className="py-8 text-center text-sm text-[var(--ink-soft)]">
              Aún no hay postulaciones de candidatos registradas.
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {(stats?.recentApplications ?? []).map((candidate) => (
                <div
                  key={candidate.applicationId}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--line)] bg-[var(--surface)] hover:bg-[var(--surface-hover,#f8fafc)] transition-colors"
                >
                  <div className="min-w-0 pr-3">
                    <b className="text-sm font-semibold text-[var(--ink)] block truncate">
                      {candidate.candidateName}
                    </b>
                    <span className="text-xs text-[var(--ink-soft)] block truncate">
                      {candidate.vacancyTitle} · {new Date(candidate.submittedAt).toLocaleDateString("es-CO")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {candidate.matchScore != null ? (
                      <span className="badge badge-green text-xs">
                        {Math.round(candidate.matchScore)}% match
                      </span>
                    ) : (
                      <span className="badge badge-navy text-xs">
                        {candidate.status === "completed" ? "Completado" : "Pendiente"}
                      </span>
                    )}
                    <Link
                      href={`/admin/candidatos/${candidate.candidateId}?applicationId=${encodeURIComponent(
                        candidate.applicationId,
                      )}`}
                      className="btn btn-outline btn-sm py-1 px-2.5 text-xs"
                    >
                      Ver perfil
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
