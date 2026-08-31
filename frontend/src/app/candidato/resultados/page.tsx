'use client';

import React from 'react';
import { AwardIcon, CheckIcon, TrendUpIcon, LogoSparkIcon } from '../../../shared/components/ui/Icons';
import { EstadoBadge } from '../../../shared/components/ui/Badge';

export default function CandidatoResultadosPage() {
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
          <h3 className="text-base font-bold">Datos e IA — DS4B</h3>
          <div className="mt-2">
            <EstadoBadge estado="Entrevista enviada · en análisis" />
          </div>
        </div>
      </div>

      {/* Feedback Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mb-4.5">
        {/* Strengths */}
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-1.5">Lo que se destacó</h3>
          <p className="text-[var(--ink-faint)] text-xs mb-3.5">
            Aspectos que la IA identificó como fortalezas en tu entrevista.
          </p>
          <div className="result-list">
            <div className="result-item">
              <div
                className="result-ico"
                style={{ background: 'var(--green-tint)', color: 'var(--green)' }}
              >
                <CheckIcon size={14} />
              </div>
              <div className="result-text">
                Buena claridad al explicar decisiones técnicas
              </div>
            </div>
            <div className="result-item">
              <div
                className="result-ico"
                style={{ background: 'var(--green-tint)', color: 'var(--green)' }}
              >
                <CheckIcon size={14} />
              </div>
              <div className="result-text">
                Manejo consistente de fuentes de datos
              </div>
            </div>
            <div className="result-item">
              <div
                className="result-ico"
                style={{ background: 'var(--green-tint)', color: 'var(--green)' }}
              >
                <CheckIcon size={14} />
              </div>
              <div className="result-text">
                Ejemplos concretos de uso de IA
              </div>
            </div>
          </div>
        </div>

        {/* Areas for Growth */}
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-1.5">Qué puedes seguir mejorando</h3>
          <p className="text-[var(--ink-faint)] text-xs mb-3.5">
            Puntos de crecimiento identificados, para que sigas fortaleciéndote de cara a futuros procesos.
          </p>
          <div className="result-list">
            <div className="result-item">
              <div
                className="result-ico"
                style={{ background: 'var(--info-tint)', color: 'var(--info)' }}
              >
                <TrendUpIcon size={14} />
              </div>
              <div className="result-text">
                Profundizar ejemplos de trabajo en equipos grandes
              </div>
            </div>
            <div className="result-item">
              <div
                className="result-ico"
                style={{ background: 'var(--info-tint)', color: 'var(--info)' }}
              >
                <TrendUpIcon size={14} />
              </div>
              <div className="result-text">
                Dar más contexto de negocio al explicar resultados técnicos
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* What's Next Box */}
      <div className="ai-box items-start mb-0">
        <div className="ai-icon">
          <LogoSparkIcon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1.5">¿Qué sigue?</h4>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
            Tu entrevista ya fue enviada y analizada por la IA. El equipo de Recursos Humanos de DS4B está revisando ese análisis junto con tu perfil para tomar la decisión final del proceso. Te notificaremos por aquí en cuanto haya una novedad.
          </p>
          <div className="disclaimer">
            Estos aspectos son una guía general de aprendizaje, no el detalle completo de tu evaluación; la decisión final siempre es de Recursos Humanos.
          </div>
        </div>
      </div>
    </div>
  );
}
