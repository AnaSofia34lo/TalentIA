'use client';

import React from 'react';
import Link from 'next/link';
import { ENTREVISTAS } from '../../../shared/data/mockData';
import { VideoIcon } from '../../../shared/components/ui/Icons';
import { EstadoBadge } from '../../../shared/components/ui/Badge';

export default function AdminEntrevistasPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Entrevistas</h1>
          <p className="page-sub">
            Historial de entrevistas realizadas y programadas por IA.
          </p>
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table className="modern">
            <thead>
              <tr>
                <th>Candidato</th>
                <th>Vacante</th>
                <th>Duración</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th>Acción</th>
              </tr>
            </thead>
            <tbody>
              {ENTREVISTAS.map((e, index) => (
                <tr key={index}>
                  <td>
                    <div className="row-person">
                      <div className="avatar avatar-sm">{e.iniciales}</div>
                      <span>{e.nombre}</span>
                    </div>
                  </td>
                  <td className="text-[var(--ink-soft)]">{e.vacante}</td>
                  <td className="text-[var(--ink-soft)]">{e.duracion}</td>
                  <td>
                    <EstadoBadge estado={e.estado} />
                  </td>
                  <td className="text-[var(--ink-soft)]">{e.fecha}</td>
                  <td>
                    {e.estado === 'Completada' ? (
                      <Link
                        href="/admin/candidatos/mariana-torres/video"
                        className="btn btn-outline btn-sm"
                      >
                        <VideoIcon size={14} />
                        Ver video
                      </Link>
                    ) : (
                      <span className="text-[var(--ink-faint)] text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
