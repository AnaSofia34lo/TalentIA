'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  LogoSparkIcon,
} from '../../../shared/components/ui/Icons';
import {
  TechnicalTestAccessResponse,
  useAuth,
} from '../../../shared/context/AuthContext';

export default function PruebaTecnicaPage() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const { getTechnicalTestAccess } = useAuth();
  const [access, setAccess] = useState<TechnicalTestAccessResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    if (!applicationId) {
      setLoading(false);
      setError(
        'Debes abrir la prueba técnica desde una postulación habilitada. El acceso directo por URL no está permitido.',
      );
      return () => {
        active = false;
      };
    }

    void getTechnicalTestAccess(applicationId)
      .then((result) => {
        if (active) setAccess(result);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible validar el acceso a la prueba técnica.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  if (loading) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <p className="text-sm text-[var(--ink-soft)]">
            Validando tu acceso a la prueba técnica…
          </p>
        </div>
      </div>
    );
  }

  if (error || !applicationId || !access || !access.enabled) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <div
            className="kpi-icon mx-auto mb-4"
            style={{ background: 'var(--amber-tint)', color: 'var(--amber)' }}
          >
            <LogoSparkIcon size={22} />
          </div>
          <h1 className="text-xl font-bold mb-2">Prueba técnica no disponible</h1>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-3">
            {error ||
              access?.message ||
              'Aún no cumples el porcentaje mínimo de compatibilidad para continuar.'}
          </p>
          {access?.matchPercentage != null && (
            <p className="text-sm mb-6">
              Tu Match IA: <b>{Math.round(access.matchPercentage)}%</b>
              {' · '}
              Mínimo requerido: <b>{access.threshold}%</b>
            </p>
          )}
          {!access?.matchPercentage && <div className="mb-6" />}
          <Link href="/candidato/postulaciones" className="btn btn-primary btn-block">
            <ArrowLeftIcon size={16} />
            Volver a mis postulaciones
          </Link>
          <Link href="/candidato/resultados" className="btn btn-outline btn-block mt-2">
            Ver mis resultados
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="center-shell">
      <div className="center-card">
        <div
          className="kpi-icon mx-auto mb-4"
          style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}
        >
          <ArrowRightIcon size={22} />
        </div>
        <h1 className="text-xl font-bold mb-2">Prueba técnica habilitada</h1>
        <p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-2">
          Alcanzaste {Math.round(access.matchPercentage ?? 0)}% de compatibilidad
          (mínimo {access.threshold}%) en {access.vacancyTitle}.
        </p>
        <p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-6">
          Ya puedes continuar en el proceso de selección. Los ejercicios se
          mostrarán aquí cuando el equipo de reclutamiento los configure.
        </p>
        <Link href="/candidato/postulaciones" className="btn btn-primary btn-block">
          <ArrowLeftIcon size={16} />
          Volver a mis postulaciones
        </Link>
      </div>
    </div>
  );
}
