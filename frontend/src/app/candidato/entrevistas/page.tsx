'use client';

import React from 'react';
import Link from 'next/link';
import { EstadoBadge } from '../../../shared/components/ui/Badge';
import { ArrowRightIcon } from '../../../shared/components/ui/Icons';

export default function CandidatoEntrevistasPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mis entrevistas</h1>
          <p className="page-sub">
            Historial y próximas entrevistas con IA para tus postulaciones.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="modern">
            <thead>
              <tr>
                <th>Vacante</th>
                <th>Empresa</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>
                  <b>Gestión de Proyectos</b>
                </td>
                <td className="text-[var(--ink-soft)]">DS4B</td>
                <td>
                  <EstadoBadge estado="Pendiente" />
                </td>
                <td className="text-[var(--ink-soft)]">Hoy</td>
                <td>
                  <Link
                    href="/candidato/entrevistas/activa"
                    className="btn btn-accent btn-sm"
                  >
                    Iniciar
                    <ArrowRightIcon size={14} />
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Datos e IA</b>
                </td>
                <td className="text-[var(--ink-soft)]">DS4B</td>
                <td>
                  <EstadoBadge estado="Entrevista enviada · en análisis" />
                </td>
                <td className="text-[var(--ink-soft)]">29 jul 2026</td>
                <td>
                  <Link
                    href="/candidato/resultados"
                    className="btn btn-outline btn-sm"
                  >
                    Ver estado
                  </Link>
                </td>
              </tr>
              <tr>
                <td>
                  <b>Desarrollo de Software</b>
                </td>
                <td className="text-[var(--ink-soft)]">DS4B</td>
                <td>
                  <EstadoBadge estado="Finalizada por RRHH" />
                </td>
                <td className="text-[var(--ink-soft)]">14 jul 2026</td>
                <td>
                  <Link
                    href="/candidato/resultados"
                    className="btn btn-outline btn-sm"
                  >
                    Ver resultado
                  </Link>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
