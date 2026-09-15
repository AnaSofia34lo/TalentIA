'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { BriefcaseIcon } from '../../../shared/components/ui/Icons';

type VacancyItem = {
  id: string;
  name: string;
  description: string;
  status: string;
};

export default function CandidatoVacantesPage() {
  const { listAvailableVacancies } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const data = (await listAvailableVacancies()) as VacancyItem[];
        if (active) setVacancies(Array.isArray(data) ? data : []);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar las vacantes.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Vacantes disponibles</h1>
          <p className="page-sub">
            Encuentra tu próxima oportunidad. Nombre y descripción vienen de la base de datos.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Cargando vacantes…</p>
      ) : vacancies.length === 0 ? (
        <div className="card card-pad text-center">
          <p className="text-sm text-[var(--ink-soft)]">
            Todavía no hay vacantes publicadas. Cuando un reclutador publique una, aparecerá aquí.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="card card-pad card-hover flex flex-col justify-between"
            >
              <div>
                <div
                  className="kpi-icon mb-3.5"
                  style={{
                    background: 'var(--purple-tint)',
                    color: 'var(--purple)',
                    width: '40px',
                    height: '40px',
                  }}
                >
                  <BriefcaseIcon size={18} />
                </div>

                <h3 className="text-base font-bold mb-2.5">{vacancy.name}</h3>
                <p className="text-[var(--ink-soft)] text-xs mb-3.5 leading-relaxed">
                  {vacancy.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
