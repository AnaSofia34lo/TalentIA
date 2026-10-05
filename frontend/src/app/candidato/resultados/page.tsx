'use client';

import React, { useEffect, useState } from 'react';
import { AwardIcon, CheckIcon, TrendUpIcon, LogoSparkIcon } from '../../../shared/components/ui/Icons';
import { EstadoBadge } from '../../../shared/components/ui/Badge';
import { InterviewAnalysisResponse, useAuth } from '../../../shared/context/AuthContext';

export default function CandidatoResultadosPage() {
  const { listInterviewAnalyses } = useAuth();
  const [analysis, setAnalysis] = useState<InterviewAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void listInterviewAnalyses()
      .then((items) => { if (active) setAnalysis(items[0] ?? null); })
      .catch((requestError) => { if (active) setError(requestError instanceof Error ? requestError.message : 'No fue posible consultar el análisis.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [listInterviewAnalyses]);

  const pending = !analysis || analysis.status === 'pending' || analysis.status === 'processing';
  const title = analysis?.application.vacancy.title ?? 'Entrevistas';
  const organization = analysis?.application.vacancy.organization ?? 'la empresa contratante';

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mis resultados</h1>
          <p className="page-sub">
            Estado y retroalimentación general de tus procesos con DS4B.
          </p>
        </div>
      </div>

      {/* Overview Card */}
      <div className="card card-pad flex items-center gap-5 flex-wrap mb-4.5">
        <div
          className="kpi-icon"
          style={{
            background: 'var(--green-tint)',
            color: 'var(--green)',
            width: '52px',
            height: '52px'
          }}
        >
          <AwardIcon size={24} />
        </div>
        <div className="flex-1 min-w-[220px]">
          <h3 className="text-base font-bold">{title} — {organization}</h3>
          <div className="mt-2">
            <EstadoBadge estado={analysis?.status === 'completed' ? 'Análisis disponible' : 'Entrevista enviada · en análisis'} />
          </div>
          {analysis?.overallScore !== null && analysis?.overallScore !== undefined && <p className="text-sm text-[var(--ink-soft)] mt-2">Correspondencia general identificada: <b>{Math.round(analysis.overallScore)}%</b></p>}
        </div>
      </div>

      {error && <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4" role="alert">{error}</div>}
      {(loading || pending) && <div className="card card-pad mb-4.5 text-sm text-[var(--ink-soft)]">La IA está preparando el análisis de tus entrevistas. Vuelve a consultar esta pantalla en unos momentos.</div>}

      {/* Feedback Highlights Grid */}
      {!pending && <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mb-4.5">
        {/* Strengths */}
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-1.5">Lo que se destacó</h3>
          <p className="text-[var(--ink-faint)] text-xs mb-3.5">
            Aspectos que la IA identificó como fortalezas en tu entrevista.
          </p>
          <div className="result-list">
            {(analysis?.strengths ?? []).map((strength) => <div className="result-item" key={strength}>
              <div
                className="result-ico"
                style={{ background: 'var(--green-tint)', color: 'var(--green)' }}
              >
                <CheckIcon size={14} />
              </div>
              <div className="result-text">
                {strength}
              </div>
            </div>)}
          </div>
        </div>

        {/* Areas for Growth */}
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-1.5">Qué puedes seguir mejorando</h3>
          <p className="text-[var(--ink-faint)] text-xs mb-3.5">
            Puntos de crecimiento identificados, para que sigas fortaleciéndote de cara a futuros procesos.
          </p>
          <div className="result-list">
            {(analysis?.improvements ?? []).map((improvement) => <div className="result-item" key={improvement}>
              <div
                className="result-ico"
                style={{ background: 'var(--info-tint)', color: 'var(--info)' }}
              >
                <TrendUpIcon size={14} />
              </div>
              <div className="result-text">
                {improvement}
              </div>
            </div>)}
          </div>
        </div>
      </div>}

      {/* What's Next Box */}
      <div className="ai-box items-start mb-0">
        <div className="ai-icon">
          <LogoSparkIcon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1.5">¿Qué sigue?</h4>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
            {analysis?.recommendation ?? 'Tu entrevista fue enviada para análisis. El equipo de Recursos Humanos revisará el resultado junto con tu perfil antes de tomar una decisión.'}
          </p>
          <div className="disclaimer">
            Estos aspectos son una guía general de aprendizaje, no el detalle completo de tu evaluación; la decisión final siempre es de Recursos Humanos.
          </div>
        </div>
      </div>
    </div>
  );
}
