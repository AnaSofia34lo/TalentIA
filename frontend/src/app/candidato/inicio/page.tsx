'use client';

import React from 'react';
import Link from 'next/link';
import {
  BriefcaseIcon,
  VideoIcon,
  AwardIcon,
  ArrowRightIcon
} from '../../../shared/components/ui/Icons';

export default function CandidatoInicioPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Hola, Camila 👋</h1>
          <p className="page-sub">
            Este es el estado de tus procesos de selección.
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 mb-6">
        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: 'var(--navy-tint)', color: 'var(--navy)' }}
          >
            <BriefcaseIcon size={18} />
          </div>
          <div className="kpi-value">3</div>
          <div className="kpi-label">Postulaciones activas</div>
        </div>

        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}
          >
            <VideoIcon size={18} />
          </div>
          <div className="kpi-value">1</div>
          <div className="kpi-label">Entrevista pendiente</div>
        </div>

        <div className="card kpi-card">
          <div
            className="kpi-icon"
            style={{ background: 'var(--green-tint)', color: 'var(--green)' }}
          >
            <AwardIcon size={18} />
          </div>
          <div className="kpi-value">2</div>
          <div className="kpi-label">Resultados disponibles</div>
        </div>
      </div>

      {/* Next Steps */}
      <div className="card card-pad">
        <h3 className="text-base font-bold mb-4">Próximos pasos</h3>

        <div className="evidence-row">
          <div className="flex gap-3 items-center">
            <div
              className="kpi-icon shrink-0"
              style={{
                background: 'var(--purple-tint)',
                color: 'var(--purple)',
                width: '36px',
                height: '36px'
              }}
            >
              <VideoIcon size={18} />
            </div>
            <div>
              <b className="text-sm font-semibold">
                Entrevista en vivo con IA — Gestión de Proyectos
              </b>
              <div className="text-[var(--ink-soft)] text-xs">
                Pendiente · Duración estimada 15 min
              </div>
            </div>
          </div>
          <Link
            href="/candidato/entrevistas/activa"
            className="btn btn-accent btn-sm"
          >
            Iniciar
            <ArrowRightIcon size={14} />
          </Link>
        </div>

        <div className="evidence-row">
          <div className="flex gap-3 items-center">
            <div
              className="kpi-icon shrink-0"
              style={{
                background: 'var(--green-tint)',
                color: 'var(--green)',
                width: '36px',
                height: '36px'
              }}
            >
              <AwardIcon size={18} />
            </div>
            <div>
              <b className="text-sm font-semibold">
                Resultado disponible — Datos e IA
              </b>
              <div className="text-[var(--ink-soft)] text-xs">
                RRHH finalizó la revisión
              </div>
            </div>
          </div>
          <Link
            href="/candidato/resultados"
            className="btn btn-outline btn-sm"
          >
            Ver resultado
          </Link>
        </div>
      </div>
    </div>
  );
}
