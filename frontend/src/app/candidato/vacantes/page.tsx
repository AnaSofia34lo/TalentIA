'use client';

import React, { useState } from 'react';
import { VACANTES } from '../../../shared/data/mockData';
import { BriefcaseIcon, CheckIcon } from '../../../shared/components/ui/Icons';

export default function CandidatoVacantesPage() {
  const [appliedIds, setAppliedIds] = useState<number[]>([]);

  const handleApply = (id: number) => {
    if (!appliedIds.includes(id)) {
      setAppliedIds([...appliedIds, id]);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Vacantes disponibles</h1>
          <p className="page-sub">
            Encuentra tu próxima oportunidad y aplica en segundos.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {VACANTES.map((v) => {
          const isApplied = appliedIds.includes(v.id);
          return (
            <div
              key={v.id}
              className="card card-pad card-hover flex flex-col justify-between"
            >
              <div>
                <div
                  className="kpi-icon mb-3.5"
                  style={{
                    background: 'var(--purple-tint)',
                    color: 'var(--purple)',
                    width: '40px',
                    height: '40px'
                  }}
                >
                  <BriefcaseIcon size={18} />
                </div>

                <p className="text-[var(--ink-soft)] text-xs mb-0.5 font-medium">
                  DS4B · Digital Solution for Business
                </p>
                <h3 className="text-base font-bold mb-2.5">{v.nombre}</h3>
                <p className="text-[var(--ink-soft)] text-xs mb-3.5 leading-relaxed">
                  {v.descripcion}
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
                <span className="text-xs font-bold text-[var(--navy)]">
                  {v.salario}
                </span>
                <button
                  type="button"
                  onClick={() => handleApply(v.id)}
                  disabled={isApplied}
                  className={`btn btn-sm ${
                    isApplied ? 'btn-outline text-[var(--green)]' : 'btn-accent'
                  }`}
                >
                  {isApplied ? (
                    <>
                      <CheckIcon size={14} /> Aplicado ✓
                    </>
                  ) : (
                    'Aplicar'
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
