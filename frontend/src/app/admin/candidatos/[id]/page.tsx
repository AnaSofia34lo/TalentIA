'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  DownloadIcon,
  VideoIcon,
  LogoSparkIcon,
  FileTextIcon,
} from '../../../../shared/components/ui/Icons';
import { MatchRing } from '../../../../shared/components/ui/MatchRing';
import {
  RecruiterCandidateAnalysisResponse,
  useAuth,
} from '../../../../shared/context/AuthContext';
import { exportCandidateSummaryPdf } from '../../../../shared/lib/exportCandidateSummaryPdf';

function ProgressBar({ label, percentage }: { label: string; percentage: number }) {
  const value = Math.max(0, Math.min(100, Math.round(percentage)));
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1.5">
        <span className="font-semibold text-[var(--ink)]">{label}</span>
        <span className="font-bold text-[var(--navy)]">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-[var(--navy-tint)] overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{
            width: `${value}%`,
            background: 'var(--grad-brand)',
          }}
        />
      </div>
    </div>
  );
}

function DofaCard({
  title,
  items,
  note,
  tone,
}: {
  title: string;
  items: string[];
  note?: string;
  tone: 'green' | 'blue' | 'amber' | 'red';
}) {
  const tones = {
    green: { bg: 'var(--green-tint)', color: 'var(--green)' },
    blue: { bg: 'var(--purple-tint)', color: 'var(--purple)' },
    amber: { bg: 'var(--amber-tint, #fff4e5)', color: 'var(--amber, #c47b00)' },
    red: { bg: 'var(--red-tint)', color: 'var(--red)' },
  } as const;
  const style = tones[tone];
  return (
    <div className="rounded-2xl p-4" style={{ background: style.bg }}>
      <h4 className="text-sm font-bold mb-2" style={{ color: style.color }}>
        {title}
      </h4>
      {items.length > 0 ? (
        <ul className="text-sm text-[var(--ink)] list-disc pl-5 space-y-1">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[var(--ink-soft)] italic">
          {note ?? 'Sin evidencia suficiente.'}
        </p>
      )}
      {items.length > 0 && note ? (
        <p className="text-[11px] text-[var(--ink-faint)] mt-2 italic">{note}</p>
      ) : null}
    </div>
  );
}

export default function CandidatoPerfilPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const { getRecruiterApplicationAnalysis } = useAuth();
  const [report, setReport] = useState<RecruiterCandidateAnalysisResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applicationId) {
      setError(
        'No se recibió la postulación seleccionada. Regresa al banco de candidatos o a Reportes y abre el perfil desde allí.',
      );
      setLoading(false);
      return;
    }
    let active = true;
    void getRecruiterApplicationAnalysis(applicationId)
      .then((data) => {
        if (active) setReport(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar esta postulación.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  if (loading) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <div className="spinner" />
          <h3 className="text-lg font-bold">Cargando resumen del candidato…</h3>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Se recupera el análisis ya persistido (sin volver a llamar a Gemini).
          </p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <h3 className="text-lg font-bold mb-2">No se pudo cargar la postulación</h3>
          <p className="text-[var(--red)] text-sm">
            {error || 'La postulación no está disponible.'}
          </p>
          <div className="flex gap-2 mt-5 justify-center">
            <Link href="/admin/banco" className="btn btn-outline">
              Volver al banco
            </Link>
            <Link href="/admin/reportes" className="btn btn-outline">
              Ir a Reportes
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { candidate, application, analysis } = report;
  const isAnalyzed = analysis.status === 'completed';
  const score =
    analysis.overallScore ?? application.matchScore ?? 0;
  const initials =
    candidate.fullName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'CA';

  const dofa = report.dofa ?? {
    strengths: analysis.strengths ?? [],
    opportunities: analysis.improvements ?? [],
    weaknesses: analysis.improvements ?? [],
    threats: [],
    notes: {
      weaknesses: 'Sin evidencia suficiente.',
      threats: 'Sin evidencia suficiente.',
      opportunities: 'Sin evidencia suficiente.',
    },
  };

  const technicalBars =
    report.competencies?.technicalBars?.length
      ? report.competencies.technicalBars
      : candidate.technicalSkills.map((skill) => ({
          name: skill.name,
          percentage: skill.estimatedProficiency,
          source: 'cv',
        }));

  const softPercentage =
    report.competencies?.softPercentage ?? analysis.behavioralScore;
  const technicalPercentage =
    report.competencies?.technicalPercentage ?? analysis.technicalScore;

  const evidences = report.evidences ?? [];
  const videoHref = `/admin/candidatos/${candidate.id}/video?applicationId=${encodeURIComponent(application.id)}`;

  const handleDownloadCv = () => {
    if (!candidate.cvDownloadUrl) {
      setError('Este candidato aún no tiene una hoja de vida disponible para descargar.');
      return;
    }
    window.open(candidate.cvDownloadUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Perfil del candidato</h1>
          <p className="page-sub">
            Evaluación integral generada por IA con evidencia trazable ·{' '}
            {application.vacancy.title}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => exportCandidateSummaryPdf(report)}
            title="Descargar perfil completo en PDF"
          >
            <FileTextIcon size={16} />
            Descargar perfil completo (PDF)
          </button>
          <Link href="/admin/reportes" className="btn btn-ghost">
            <ArrowLeftIcon size={16} />
            Volver a reportes
          </Link>
        </div>
      </div>

      <div className="card card-pad flex items-center gap-6 mb-4.5 flex-wrap">
        <div className="avatar avatar-lg">{initials}</div>
        <div className="flex-1 min-w-[220px]">
          <h2 className="text-xl font-bold">{candidate.fullName}</h2>
          <p className="text-[var(--ink-soft)] text-sm my-1 mb-2.5">
            {candidate.profile?.professionalTitle ?? 'Perfil profesional'}
            {candidate.profile?.yearsOfExperience != null
              ? ` · ${candidate.profile.yearsOfExperience} años de experiencia`
              : ''}
          </p>
          <p className="text-[var(--ink-faint)] text-xs mb-2.5">
            Vacante: {application.vacancy.title} · {application.vacancy.organization}
          </p>
          <div className="flex gap-2 flex-wrap">
            {candidate.technicalSkills.slice(0, 6).map((skill) => (
              <span className="badge badge-navy" key={skill.name}>
                {skill.name}
              </span>
            ))}
          </div>
        </div>
        {isAnalyzed ? (
          <MatchRing percentage={score} size={112} showLabel={true} />
        ) : (
          <div className="text-center min-w-[112px]">
            <div className="text-sm font-bold text-[var(--ink-soft)]">Match IA</div>
            <div className="text-xs text-[var(--ink-faint)] mt-1">Pendiente</div>
          </div>
        )}
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <button
            type="button"
            className="btn btn-primary"
            onClick={handleDownloadCv}
            disabled={!candidate.cvDownloadUrl}
          >
            <DownloadIcon size={16} />
            Descargar CV
          </button>
          <Link href={videoHref} className="btn btn-outline">
            <VideoIcon size={18} />
            Ver entrevista
          </Link>
        </div>
      </div>

      {!isAnalyzed ? (
        <div className="card card-pad mb-4.5 text-sm text-[var(--ink-soft)]">
          El Match, la matriz DOFA, los porcentajes y las evidencias estarán disponibles
          cuando el análisis de entrevistas de esta postulación esté completo. Estado:{' '}
          {analysis.status === 'ready_to_analyze'
            ? 'entrevistas listas, análisis pendiente'
            : analysis.status === 'processing'
              ? 'análisis en proceso'
              : analysis.status === 'failed'
                ? `falló: ${analysis.failureReason ?? 'error desconocido'}`
                : 'entrevista pendiente'}
          .
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5 mb-4.5">
            <div className="card card-pad">
              <h3 className="text-base font-bold mb-1">Competencias técnicas</h3>
              <p className="text-xs text-[var(--ink-faint)] mb-3">
                Cumplimiento técnico: {Math.round(technicalPercentage ?? 0)}% (análisis de
                entrevista). Barras: skills de vacante vs CV cuando existen.
              </p>
              {technicalBars.length ? (
                technicalBars.map((bar) => (
                  <ProgressBar
                    key={bar.name}
                    label={bar.name}
                    percentage={bar.percentage}
                  />
                ))
              ) : (
                <p className="text-sm text-[var(--ink-soft)]">
                  Sin skills técnicas registradas para esta postulación.
                </p>
              )}
            </div>
            <div className="card card-pad">
              <h3 className="text-base font-bold mb-1">Competencias blandas</h3>
              <p className="text-xs text-[var(--ink-faint)] mb-3">
                Cumplimiento blando: {Math.round(softPercentage ?? 0)}% (entrevista por
                video / conductual).
              </p>
              <ProgressBar
                label="Evaluación conductual IA"
                percentage={softPercentage ?? 0}
              />
              {analysis.behavioralSummary ? (
                <p className="text-sm text-[var(--ink-soft)] mt-3 leading-relaxed">
                  {analysis.behavioralSummary}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mb-4.5">
            <h3 className="text-base font-bold mb-1">Matriz DOFA</h3>
            <p className="text-xs text-[var(--ink-faint)] mb-3">
              Construida a partir del análisis persistido de esta postulación (sin regenerar
              con Gemini al abrir).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <DofaCard title="Fortalezas" items={dofa.strengths} tone="green" />
              <DofaCard
                title="Oportunidades"
                items={dofa.opportunities}
                note={dofa.notes.opportunities}
                tone="blue"
              />
              <DofaCard
                title="Debilidades"
                items={dofa.weaknesses}
                note={dofa.notes.weaknesses}
                tone="amber"
              />
              <DofaCard
                title="Riesgos"
                items={dofa.threats}
                note={dofa.notes.threats}
                tone="red"
              />
            </div>
          </div>

          <div className="ai-box mb-4.5">
            <div className="ai-icon">
              <LogoSparkIcon size={18} />
            </div>
            <div>
              <h4 className="font-bold text-sm mb-1.5">Recomendación de la IA</h4>
              <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
                {analysis.recommendation ??
                  'La IA todavía no tiene una recomendación disponible para esta postulación.'}
              </p>
              <div className="disclaimer">
                Esta recomendación es un apoyo al proceso y no reemplaza la decisión humana.
              </div>
            </div>
          </div>

          <div className="card card-pad mb-4.5">
            <h3 className="text-base font-bold mb-1">Evidencia por competencia</h3>
            <p className="text-xs text-[var(--ink-faint)] mb-4">
              Cada hallazgo se vincula a la entrevista técnica o al video conductual de esta
              postulación.
            </p>
            {evidences.length === 0 ? (
              <p className="text-sm text-[var(--ink-soft)]">
                No hay evidencias detalladas (respuestas o marcadores) asociadas todavía.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {evidences.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[var(--line)] pb-3 last:border-0 last:pb-0"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <b className="text-sm">{item.competency}</b>
                        <span className="badge badge-navy text-[10px]">{item.kind}</span>
                      </div>
                      <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                        {item.summary}
                      </p>
                    </div>
                    <Link href={item.href} className="btn btn-outline btn-sm shrink-0">
                      Ver evidencia
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
