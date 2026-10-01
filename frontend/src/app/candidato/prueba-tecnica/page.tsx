'use client';

import Link from 'next/link';
import { ArrowLeftIcon, ArrowRightIcon } from '../../../shared/components/ui/Icons';

export default function PruebaTecnicaPage() {
  return (
    <div className="center-shell">
      <div className="center-card">
        <div className="kpi-icon mx-auto mb-4" style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>
          <ArrowRightIcon size={22} />
        </div>
        <h1 className="text-xl font-bold mb-2">Prueba técnica</h1>
        <p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-6">
          La prueba técnica estará disponible aquí cuando el equipo de selección habilite sus ejercicios.
        </p>
        <Link href="/candidato/postulaciones" className="btn btn-primary btn-block">
          <ArrowLeftIcon size={16} />
          Volver a mis postulaciones
        </Link>
      </div>
    </div>
  );
}
