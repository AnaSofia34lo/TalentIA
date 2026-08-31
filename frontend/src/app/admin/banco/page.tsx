'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '../../../shared/context/AuthContext';
import { CANDIDATOS_BY_PERFIL } from '../../../shared/data/mockData';
import { FilterIcon, StarIcon } from '../../../shared/components/ui/Icons';
import { EstadoBadge } from '../../../shared/components/ui/Badge';
import { MatchRing } from '../../../shared/components/ui/MatchRing';

const PERFILES = [
  'Desarrollo de Software',
  'Datos e IA',
  'Levantamiento de Requisitos',
  'Gestión de Proyectos'
];

export default function AdminBancoPage() {
  const { bancoFilter, setBancoFilter } = useAuth();

  const candidatesList = (CANDIDATOS_BY_PERFIL[bancoFilter] || [])
    .slice()
    .sort((a, b) => b.compat - a.compat);

  const top5 = candidatesList.slice(0, 5);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Banco de Talentos</h1>
          <p className="page-sub">
            Ranking de candidatos por perfil, generado automáticamente por compatibilidad IA.
          </p>
        </div>
      </div>

      {/* Profile Filters */}
      <div className="card card-pad mb-6">
        <div className="flex gap-2.5 flex-wrap items-center">
          <span className="text-[var(--ink-faint)] text-xs font-semibold flex items-center gap-1.5 mr-1">
            <FilterIcon size={15} />
            Filtrar por perfil:
          </span>
          {PERFILES.map((perfil) => (
            <button
              key={perfil}
              type="button"
              className={`chip ${bancoFilter === perfil ? 'active' : ''}`}
              onClick={() => setBancoFilter(perfil)}
            >
              {perfil}
            </button>
          ))}
        </div>
      </div>

      {/* Top 5 Section */}
      <div className="mb-8">
        <h3 className="text-base font-bold mb-1 flex items-center gap-2">
          <span className="text-[var(--purple)]">
            <StarIcon size={18} />
          </span>
          Top 5 — <span>{bancoFilter}</span>
        </h3>
        <p className="text-[var(--ink-faint)] text-xs mb-4">
          Los candidatos mejor evaluados por la IA para este perfil, listos para avanzar.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
          {top5.map((c, i) => (
            <div
              key={c.nombre}
              className={`rank-card ${i === 0 ? 'top1' : i === 1 ? 'top2' : i === 2 ? 'top3' : ''}`}
            >
              <div className="rank-num">{i + 1}</div>
              <div className="avatar my-2 mx-auto">{c.iniciales}</div>
              <h4 className="text-sm font-bold mb-2 leading-tight min-h-[38px] flex items-center justify-center">
                {c.nombre}
              </h4>

              <div className="flex justify-center my-2">
                <MatchRing percentage={c.compat} size={56} />
              </div>

              <div className="mt-2.5">
                <EstadoBadge estado={c.estado} />
              </div>

              <Link
                href="/admin/candidatos/mariana-torres"
                className="btn btn-outline btn-sm btn-block mt-3"
              >
                Ver perfil
              </Link>
            </div>
          ))}
        </div>
      </div>

      {/* Complete Candidate History */}
      <div>
        <h3 className="text-base font-bold mb-1">Historial completo de postulantes</h3>
        <p className="text-[var(--ink-faint)] text-xs mb-3.5">
          Todos los candidatos que se han presentado a este perfil.
        </p>

        <div className="card">
          <div className="table-wrap">
            <table className="modern">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Candidato</th>
                  <th>Compatibilidad</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {candidatesList.map((c, i) => (
                  <tr key={c.nombre}>
                    <td className="text-[var(--ink-faint)] font-semibold">{i + 1}</td>
                    <td>
                      <div className="row-person">
                        <div className="avatar avatar-sm">{c.iniciales}</div>
                        <span>{c.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <MatchRing percentage={c.compat} size={34} />
                    </td>
                    <td>
                      <EstadoBadge estado={c.estado} />
                    </td>
                    <td className="text-[var(--ink-soft)]">{c.fecha}</td>
                    <td>
                      <Link
                        href="/admin/candidatos/mariana-torres"
                        className="btn btn-outline btn-sm"
                      >
                        Ver perfil
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
