'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { BriefcaseIcon } from '../../../shared/components/ui/Icons';
import { MatchRing } from '../../../shared/components/ui/MatchRing';

type VacancyItem = {
  id: string;
  name: string;
  description: string;
  salary: number;
  status: string;
};

type MatchItem = {
  matchPercentage: number;
  evaluatedSkills: number;
};

export default function CandidatoVacantesPage() {
  const { listAvailableVacancies, getVacancyMatch } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchItem>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const data = (await listAvailableVacancies()) as VacancyItem[];
        if (active) {
          const available = Array.isArray(data) ? data : [];
          setVacancies(available);
          const matchEntries = await Promise.all(
            available.map(async (vacancy) => {
              try {
                return [vacancy.id, await getVacancyMatch(vacancy.id)] as const;
              } catch {
                return null;
              }
            }),
          );
          if (active) {
            setMatches(
              Object.fromEntries(matchEntries.filter((entry): entry is readonly [string, MatchItem] => entry !== null)),
            );
          }
        }
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
                <p className="text-sm font-semibold text-[var(--green)] mb-2.5">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(vacancy.salary)} mensuales
                </p>
                <p className="text-[var(--ink-soft)] text-xs mb-3.5 leading-relaxed">
                  {vacancy.description}
                </p>
                {matches[vacancy.id] && (
                  <div className="flex items-center gap-3 pt-2 border-t border-[var(--line)]">
                    <MatchRing percentage={matches[vacancy.id].matchPercentage} size={48} />
                    <div>
                      <p className="text-sm font-bold">Match IA</p>
                      <p className="text-xs text-[var(--ink-soft)]">
                        {matches[vacancy.id].evaluatedSkills} skills verificadas desde tu CV
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
