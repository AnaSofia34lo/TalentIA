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
  const { listAvailableVacancies, getVacancyMatch, applyToVacancy } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [matches, setMatches] = useState<Record<string, MatchItem>>({});
  const [selectedVacancy, setSelectedVacancy] = useState<VacancyItem | null>(null);
  const [appliedVacancyIds, setAppliedVacancyIds] = useState<string[]>([]);
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!selectedVacancy) return;

    try {
      setApplying(true);
      setError('');
      await applyToVacancy(selectedVacancy.id);
      setAppliedVacancyIds((current) => [...current, selectedVacancy.id]);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'No fue posible enviar tu postulación.',
      );
    } finally {
      setApplying(false);
    }
  };

  useEffect(() => {
    if (!selectedVacancy) return undefined;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelectedVacancy(null);
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [selectedVacancy]);

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

  let vacanciesContent: React.ReactNode;
  if (loading) {
    vacanciesContent = <p className="text-sm text-[var(--ink-soft)]">Cargando vacantes…</p>;
  } else if (vacancies.length === 0) {
    vacanciesContent = (
      <div className="card card-pad text-center">
        <p className="text-sm text-[var(--ink-soft)]">
          Todavía no hay vacantes publicadas. Cuando un reclutador publique una, aparecerá aquí.
        </p>
      </div>
    );
  } else {
    vacanciesContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
        {vacancies.map((vacancy) => (
          <button
            type="button"
            key={vacancy.id}
            className="card card-pad card-hover flex flex-col justify-between text-left w-full"
            onClick={() => setSelectedVacancy(vacancy)}
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
          </button>
        ))}
      </div>
    );
  }

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

      {vacanciesContent}

      {selectedVacancy && (
        <dialog
          open
          className="fixed inset-0 z-50 m-0 flex h-screen w-screen max-h-none max-w-none items-center justify-center border-0 bg-black/60 p-4 backdrop-blur-sm"
          aria-labelledby="vacancy-detail-title"
        >
          <div
            className="card card-pad w-full min-h-[50vh] max-h-[90vh] overflow-y-auto md:w-1/2"
          >
            <div className="flex items-start justify-between gap-4 mb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--purple)] mb-2">
                  Información de la vacante
                </p>
                <h2 id="vacancy-detail-title" className="text-xl font-bold">
                  {selectedVacancy.name}
                </h2>
              </div>
              <button
                type="button"
                className="btn btn-ghost h-9 w-9 p-0 text-2xl leading-none"
                aria-label="Cerrar información de la vacante"
                title="Cerrar"
                onClick={() => setSelectedVacancy(null)}
              >
                <span aria-hidden="true">&times;</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-1">Salario</p>
                <p className="text-base font-semibold text-[var(--green)]">
                  {new Intl.NumberFormat('es-CO', {
                    style: 'currency',
                    currency: 'COP',
                    maximumFractionDigits: 0,
                  }).format(selectedVacancy.salary)} mensuales
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--ink-soft)] mb-1">Estado</p>
                <p className="text-base font-semibold">Vacante activa</p>
              </div>
            </div>

            <div className="border-t border-[var(--line)] pt-5">
              <h3 className="text-sm font-bold mb-2">Descripción del cargo</h3>
              <p className="text-sm text-[var(--ink-soft)] leading-relaxed whitespace-pre-line">
                {selectedVacancy.description}
              </p>
            </div>

            {matches[selectedVacancy.id] && (
              <div className="flex items-center gap-3 border-t border-[var(--line)] mt-5 pt-5">
                <MatchRing percentage={matches[selectedVacancy.id].matchPercentage} size={52} />
                <div>
                  <p className="text-sm font-bold">Tu compatibilidad con esta vacante</p>
                  <p className="text-xs text-[var(--ink-soft)]">
                    {matches[selectedVacancy.id].evaluatedSkills} skills verificadas desde tu CV
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mt-5" role="alert">
                {error}
              </div>
            )}

            <div className="flex justify-end mt-6">
              {appliedVacancyIds.includes(selectedVacancy.id) ? (
                <p className="text-sm font-semibold text-[var(--green)]">
                  Postulación enviada correctamente
                </p>
              ) : (
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={applying}
                  onClick={() => void handleApply()}
                >
                  {applying ? 'Enviando…' : 'Postularme'}
                </button>
              )}
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
