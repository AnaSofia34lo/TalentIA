'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, DownloadIcon, VideoIcon, LogoSparkIcon } from '../../../../shared/components/ui/Icons';
import { MatchRing } from '../../../../shared/components/ui/MatchRing';
import { RecruiterCandidateAnalysisResponse, useAuth } from '../../../../shared/context/AuthContext';

export default function CandidatoPerfilPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const { getRecruiterApplicationAnalysis } = useAuth();
  const [report, setReport] = useState<RecruiterCandidateAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!applicationId) {
      setError('No se recibió la postulación seleccionada. Regresa al banco de candidatos y abre el perfil desde una vacante.');
      setLoading(false);
      return;
    }
    let active = true;
    void getRecruiterApplicationAnalysis(applicationId)
      .then((data) => { if (active) setReport(data); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar esta postulación.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // La postulación es la identidad de esta vista; no se consulta por candidato.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  if (loading) return <div className="center-shell"><div className="center-card"><div className="spinner" /><h3 className="text-lg font-bold">Cargando postulación…</h3></div></div>;
  if (error || !report) return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">No se pudo cargar la postulación</h3><p className="text-[var(--red)] text-sm">{error || 'La postulación no está disponible.'}</p><Link href="/admin/banco" className="btn btn-outline mt-5">Volver al banco</Link></div></div>;

  const { candidate, application, analysis } = report;
  const isAnalyzed = analysis.status === 'completed';
  const score = analysis.overallScore ?? 0;
  const initials = candidate.fullName.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'CA';
  const positiveFactors = analysis.scoreExplanation?.positiveFactors ?? analysis.strengths ?? [];
  const improvementFactors = analysis.scoreExplanation?.improvementFactors ?? analysis.improvements ?? [];

  return (
    <div>
      <div className="page-head"><div><h1 className="page-title flex items-center gap-2 flex-wrap">Perfil del candidato <span className="badge badge-purple text-xs font-semibold">Postulación específica</span></h1><p className="page-sub">{application.vacancy.title} · {application.vacancy.organization}</p></div><Link href="/admin/banco" className="btn btn-outline"><ArrowLeftIcon size={16} />Volver al banco de talentos</Link></div>

      <div className="card card-pad flex items-center gap-6 mb-4.5 flex-wrap"><div className="avatar avatar-lg">{initials}</div><div className="flex-1 min-w-[220px]"><h2 className="text-xl font-bold">{candidate.fullName}</h2><p className="text-[var(--ink-soft)] text-sm my-1 mb-2.5">{candidate.email}{candidate.phone ? ` · ${candidate.phone}` : ''}</p><p className="text-[var(--ink-soft)] text-sm mb-2.5">{candidate.profile?.professionalTitle ?? 'Perfil profesional'}{candidate.profile?.currentCompany ? ` · ${candidate.profile.currentCompany}` : ''}{candidate.profile?.yearsOfExperience !== null && candidate.profile?.yearsOfExperience !== undefined ? ` · ${candidate.profile.yearsOfExperience} años de experiencia` : ''}</p><div className="flex gap-2 flex-wrap">{candidate.technicalSkills.map((skill) => <span className="badge badge-navy" key={skill.name}>{skill.name}</span>)}</div></div>{isAnalyzed ? <MatchRing percentage={score} size={112} showLabel={true} /> : <div className="text-center min-w-[112px]"><div className="text-sm font-bold text-[var(--ink-soft)]">Match IA</div><div className="text-xs text-[var(--ink-faint)] mt-1">Pendiente de entrevista</div></div>}<div className="flex flex-col gap-2 w-full sm:w-auto"><button type="button" className="btn btn-primary"><DownloadIcon size={16} />Descargar CV</button><Link href={`/admin/candidatos/${candidate.id}/video?applicationId=${encodeURIComponent(application.id)}`} className="btn btn-outline"><VideoIcon size={18} />Ver entrevista</Link></div></div>

      {!isAnalyzed ? <div className="card card-pad mb-4.5 text-sm text-[var(--ink-soft)]">El porcentaje de Match IA, el resumen y las competencias evaluadas estarán disponibles cuando las entrevistas técnica y de habilidades blandas de esta postulación estén completas. Estado actual: {analysis.status === 'ready_to_analyze' ? 'entrevistas completas, análisis pendiente' : 'entrevista pendiente'}.</div> : <div className="card card-pad mb-4.5"><div className="flex items-center justify-between gap-4 flex-wrap mb-4"><div><h3 className="text-base font-bold">Resumen de la entrevista</h3><p className="text-[var(--ink-faint)] text-xs mt-1">Generado automáticamente por IA para esta postulación.</p></div><span className="badge badge-purple">Puntaje: {Math.round(score)}%</span></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4"><div><p className="text-xs font-bold mb-1">Resumen técnico · {analysis.technicalScore ?? 0}%</p><p className="text-sm text-[var(--ink-soft)]">{analysis.technicalSummary ?? 'Sin resumen técnico disponible.'}</p></div><div><p className="text-xs font-bold mb-1">Resumen de habilidades blandas · {analysis.behavioralScore ?? 0}%</p><p className="text-sm text-[var(--ink-soft)]">{analysis.behavioralSummary ?? 'Sin resumen conductual disponible.'}</p></div></div><div className="border-t border-[var(--line)] pt-4"><p className="text-xs font-bold mb-2">¿Por qué obtuvo este puntaje?</p><div className="grid grid-cols-1 md:grid-cols-2 gap-3"><div><p className="text-xs text-[var(--green)] font-semibold mb-1">Factores positivos</p>{positiveFactors.length ? <ul className="text-sm text-[var(--ink-soft)] list-disc pl-5">{positiveFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul> : <p className="text-sm text-[var(--ink-soft)]">No se registraron factores positivos.</p>}</div><div><p className="text-xs text-[var(--info)] font-semibold mb-1">Factores de mejora</p>{improvementFactors.length ? <ul className="text-sm text-[var(--ink-soft)] list-disc pl-5">{improvementFactors.map((factor) => <li key={factor}>{factor}</li>)}</ul> : <p className="text-sm text-[var(--ink-soft)]">No se registraron factores de mejora.</p>}</div></div></div></div>}

      <div className="ai-box mb-4.5"><div className="ai-icon"><LogoSparkIcon size={18} /></div><div><h4 className="font-bold text-sm mb-1.5">Recomendación de la IA</h4><p className="text-[var(--ink-soft)] text-sm leading-relaxed">{analysis.recommendation ?? 'La IA todavía no tiene una recomendación disponible para esta postulación.'}</p><div className="disclaimer">Esta recomendación es un apoyo al proceso y no reemplaza la decisión humana.</div></div></div>
    </div>
  );
}
