'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { REPORTE_RECS } from '../../../shared/data/mockData';
import { FileTextIcon, DownloadIcon, LogoSparkIcon } from '../../../shared/components/ui/Icons';

export default function AdminReportesPage() {
  const [filterProfile, setFilterProfile] = useState('Todos');

  const filteredRecs = REPORTE_RECS.filter((r) => {
    if (filterProfile === 'Todos') return true;
    if (filterProfile === 'Levantamiento de Requisitos') return r.perfil === 'Levantamiento de Requisitos';
    if (filterProfile === 'Gestión de Proyectos') return r.perfil === 'Gestión de Proyectos';
    return r.perfil === filterProfile;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">
            Recomendaciones de la IA para apoyar las decisiones de Recursos Humanos.
          </p>
        </div>
        <div className="flex gap-2.5">
          <button type="button" className="btn btn-outline">
            <FileTextIcon size={16} />
            Exportar PDF
          </button>
          <button type="button" className="btn btn-outline">
            <DownloadIcon size={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      {/* AI Context Card */}
      <div className="ai-box mb-6">
        <div className="ai-icon">
          <LogoSparkIcon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1.5">¿Qué encuentras aquí?</h4>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
            Esta vista no repite el reporte individual de cada candidato — ese lo encuentras completo en <b>Candidatos → Ver perfil</b>. Aquí la IA resume, en lenguaje simple, sus fortalezas y puntos de atención por candidato, para que Recursos Humanos priorice a quién avanzar primero.
          </p>
          <div className="disclaimer">
            Estas recomendaciones son un apoyo al proceso; la decisión final siempre es de Recursos Humanos.
          </div>
        </div>
      </div>

      {/* Profile Tabs */}
      <div className="tabs mb-4.5">
        <button
          type="button"
          className={`tab ${filterProfile === 'Todos' ? 'active' : ''}`}
          onClick={() => setFilterProfile('Todos')}
        >
          Todos los perfiles
        </button>
        <button
          type="button"
          className={`tab ${filterProfile === 'Desarrollo de Software' ? 'active' : ''}`}
          onClick={() => setFilterProfile('Desarrollo de Software')}
        >
          Desarrollo de Software
        </button>
        <button
          type="button"
          className={`tab ${filterProfile === 'Datos e IA' ? 'active' : ''}`}
          onClick={() => setFilterProfile('Datos e IA')}
        >
          Datos e IA
        </button>
        <button
          type="button"
          className={`tab ${filterProfile === 'Levantamiento de Requisitos' ? 'active' : ''}`}
          onClick={() => setFilterProfile('Levantamiento de Requisitos')}
        >
          Requisitos
        </button>
        <button
          type="button"
          className={`tab ${filterProfile === 'Gestión de Proyectos' ? 'active' : ''}`}
          onClick={() => setFilterProfile('Gestión de Proyectos')}
        >
          Proyectos
        </button>
      </div>

      {/* Recommendations List */}
      <div className="flex flex-col gap-3.5">
        {filteredRecs.length > 0 ? (
          filteredRecs.map((r, index) => (
            <div
              key={index}
              className="card card-pad flex flex-col sm:flex-row gap-4 items-start justify-between"
            >
              <div className="avatar shrink-0">{r.iniciales}</div>
              <div className="flex-1">
                <div className="flex justify-between items-start gap-2.5 flex-wrap mb-1.5">
                  <div>
                    <b className="text-sm font-bold text-[var(--ink)]">{r.nombre}</b>
                    <span className="badge badge-navy ml-2">{r.perfil}</span>
                  </div>
                  <span className="badge badge-green">{r.compat}% match</span>
                </div>
                <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
                  {r.texto}
                </p>
              </div>
              <Link
                href="/admin/candidatos/mariana-torres"
                className="btn btn-outline btn-sm shrink-0 self-start sm:self-center"
              >
                Ver perfil completo
              </Link>
            </div>
          ))
        ) : (
          <div className="card card-pad text-center text-[var(--ink-faint)] py-10">
            No hay recomendaciones para este perfil todavía.
          </div>
        )}
      </div>
    </div>
  );
}
