'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../shared/context/AuthContext';
import { BriefcaseIcon, PlusIcon } from '../../../shared/components/ui/Icons';
import { EstadoBadge } from '../../../shared/components/ui/Badge';

type VacancyItem = {
  id: string;
  name: string;
  description: string;
  salary: number;
  status: string;
};

const copCurrency = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

function statusLabel(status: string): string {
  if (status === 'published') return 'Activa';
  if (status === 'paused') return 'En pausa';
  if (status === 'closed') return 'Cerrada';
  if (status === 'draft') return 'Borrador';
  return status;
}

export default function AdminVacantesPage() {
  const { listVacancies, updateVacancy } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const data = (await listVacancies()) as VacancyItem[];
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
    // Carga al montar la página de listado.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStatusChange = async (vacancy: VacancyItem, status: string) => {
    try {
      setUpdatingId(vacancy.id);
      setError('');
      const updated = await updateVacancy(vacancy.id, {
        name: vacancy.name,
        description: vacancy.description,
        salary: vacancy.salary,
        status,
      });
      setVacancies((current) => current.map((item) => item.id === vacancy.id ? { ...item, status: updated.status } : item));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cambiar el estado.');
    } finally {
      setUpdatingId(null);
    }
  };

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

      {error && (
        <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Cargando vacantes…</p>
      ) : vacancies.length === 0 ? (
        <div className="card card-pad text-center">
          <p className="text-sm text-[var(--ink-soft)] mb-4">
            Aún no has registrado vacantes. Crea la primera con nombre y descripción del cargo.
          </p>
          <Link href="/admin/vacantes/crear" className="btn btn-primary">
            Crear vacante
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4.5">
          {vacancies.map((vacancy) => (
            <div
              key={vacancy.id}
              className="card card-pad card-hover flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <div
                    className="kpi-icon"
                    style={{
                      background: 'var(--navy-tint)',
                      color: 'var(--navy)',
                      width: '40px',
                      height: '40px',
                    }}
                  >
                    <BriefcaseIcon size={18} />
                  </div>
                  <EstadoBadge estado={statusLabel(vacancy.status)} />
                </div>

                <h3 className="text-base font-bold mb-1.5">{vacancy.name}</h3>
                <p className="text-sm font-semibold text-[var(--green)] mb-2.5">
                  {copCurrency.format(vacancy.salary)} mensuales
                </p>
                <p className="text-[var(--ink-soft)] text-xs mb-3.5 leading-relaxed line-clamp-4">
                  {vacancy.description}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <select
                    className="input text-xs py-2 flex-1"
                    value={vacancy.status}
                    disabled={updatingId === vacancy.id}
                    aria-label={`Estado de ${vacancy.name}`}
                    onChange={(event) => void handleStatusChange(vacancy, event.target.value)}
                  >
                    <option value="draft">Borrador</option>
                    <option value="published">Publicada</option>
                    <option value="paused">En pausa</option>
                    <option value="closed">Cerrada</option>
                  </select>
                  <Link href={`/admin/vacantes/crear?edit=${vacancy.id}`} className="btn btn-ghost text-xs py-2">
                    Editar
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
