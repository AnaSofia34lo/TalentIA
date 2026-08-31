'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../shared/context/AuthContext';
import { VACANTES } from '../../../shared/data/mockData';
import { BriefcaseIcon, PlusIcon } from '../../../shared/components/ui/Icons';
import { EstadoBadge } from '../../../shared/components/ui/Badge';

export default function AdminVacantesPage() {
  const router = useRouter();
  const { setBancoFilter } = useAuth();
  const [filterTab, setFilterTab] = useState('Todas');

  const handleGoToBanco = (perfil: string) => {
    setBancoFilter(perfil);
    router.push('/admin/banco');
  };

  const filteredVacantes = VACANTES.filter((v) => {
    if (filterTab === 'Todas') return true;
    if (filterTab === 'Activas') return v.estado === 'Activa';
    if (filterTab === 'En pausa') return v.estado === 'En pausa';
    if (filterTab === 'Cerradas') return v.estado === 'Cerrada';
    return true;
  });

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Vacantes</h1>
          <p className="page-sub">
            Gestiona los procesos de selección abiertos en tu empresa.
          </p>
        </div>
        <Link href="/admin/vacantes/crear" className="btn btn-accent">
          <PlusIcon size={16} />
          Nueva Vacante
        </Link>
      </div>

      {/* Tabs */}
      <div className="tabs mb-5">
        <button
          type="button"
          className={`tab ${filterTab === 'Todas' ? 'active' : ''}`}
          onClick={() => setFilterTab('Todas')}
        >
          Todas (18)
        </button>
        <button
          type="button"
          className={`tab ${filterTab === 'Activas' ? 'active' : ''}`}
          onClick={() => setFilterTab('Activas')}
        >
          Activas (12)
        </button>
        <button
          type="button"
          className={`tab ${filterTab === 'En pausa' ? 'active' : ''}`}
          onClick={() => setFilterTab('En pausa')}
        >
          En pausa (3)
        </button>
        <button
          type="button"
          className={`tab ${filterTab === 'Cerradas' ? 'active' : ''}`}
          onClick={() => setFilterTab('Cerradas')}
        >
          Cerradas (3)
        </button>
      </div>

      {/* Vacantes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {filteredVacantes.map((v) => (
          <div key={v.id} className="card card-pad card-hover flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <div
                  className="kpi-icon"
                  style={{ background: 'var(--navy-tint)', color: 'var(--navy)', width: '40px', height: '40px' }}
                >
                  <BriefcaseIcon size={18} />
                </div>
                <EstadoBadge estado={v.estado} />
              </div>

              <h3 className="text-base font-bold mb-1.5">{v.nombre}</h3>
              <p className="text-[var(--ink-soft)] text-xs mb-3.5">
                Nivel {v.nivel} · Publicada {v.fecha}
              </p>

              <div className="flex flex-wrap gap-1.5 mb-4">
                {v.competenciasTecnicas.slice(0, 3).map((comp) => (
                  <span key={comp} className="badge badge-navy text-[11px]">
                    {comp}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center pt-3.5 border-t border-[var(--line)] mt-2">
              <span className="text-[var(--ink-soft)] text-xs font-semibold">
                {v.postulaciones} postulaciones
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => handleGoToBanco(v.short)}
              >
                Ver candidatos
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
