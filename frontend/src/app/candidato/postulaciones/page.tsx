'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../../../shared/context/AuthContext';
import { EstadoBadge } from '../../../shared/components/ui/Badge';
import { ArrowRightIcon } from '../../../shared/components/ui/Icons';

type ApplicationItem = {
  id: string;
  vacancyId: string;
  status: string;
  submittedAt: string;
  vacancy: {
    title: string;
    description: string;
    salary: number;
    status: string;
    organization: { name: string };
  };
};

function statusLabel(status: string): string {
  if (status === 'pending') return 'Pendiente';
  if (status === 'reviewed') return 'En revisión';
  if (status === 'shortlisted') return 'Preseleccionado';
  if (status === 'interview_scheduled') return 'Entrevista programada';
  if (status === 'rejected') return 'No seleccionado';
  if (status === 'hired') return 'Contratado';
  return status;
}

export default function CandidatoPostulacionesPage() {
  const { listCandidateApplications } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const data = await listCandidateApplications();
        if (active) setApplications(Array.isArray(data) ? data as ApplicationItem[] : []);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar tus postulaciones.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
    // Carga las postulaciones al entrar a la vista.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const formatDate = (date: string) => {
    const parsedDate = new Date(date);
    if (Number.isNaN(parsedDate.getTime())) return 'Sin fecha';
    return new Intl.DateTimeFormat('es-CO', { dateStyle: 'medium' }).format(parsedDate);
  };
  const actionButtonClass = 'btn btn-sm w-32 justify-center';

  const applicationAction = (application: ApplicationItem) => {
    if (application.status === 'pending' || application.status === 'interview_scheduled') {
      return (
        <Link href={`/candidato/postulaciones/entrevista?vacancyId=${encodeURIComponent(application.vacancyId)}&vacancy=${encodeURIComponent(application.vacancy.title)}`} className={`${actionButtonClass} btn-accent`}>
          Iniciar
          <ArrowRightIcon size={14} />
        </Link>
      );
    }
    if (application.status === 'rejected' || application.status === 'hired') {
      return (
        <Link href="/candidato/resultados" className={`${actionButtonClass} btn-outline`}>
          Ver resultado
        </Link>
      );
    }
    return (
      <Link href="/candidato/resultados" className={`${actionButtonClass} btn-outline`}>
        Ver estado
      </Link>
    );
  };

  const applicationRows = !loading && applications.map((application) => (
    <tr key={application.id}>
      <td>
        <b>{application.vacancy.title}</b>
      </td>
      <td className="text-[var(--ink-soft)]">{application.vacancy.organization.name}</td>
      <td>
        <EstadoBadge estado={statusLabel(application.status)} />
      </td>
      <td className="text-[var(--ink-soft)]">{formatDate(application.submittedAt)}</td>
      <td>
        {applicationAction(application)}
      </td>
    </tr>
  ));
  let renderedApplicationRows: React.ReactNode;
  if (loading) {
    renderedApplicationRows = (
      <tr>
        <td colSpan={5} className="text-center text-[var(--ink-soft)]">
          Cargando postulaciones…
        </td>
      </tr>
    );
  } else if (applications.length === 0) {
    renderedApplicationRows = (
      <tr>
        <td colSpan={5} className="text-center text-[var(--ink-soft)]">
          Aún no tienes postulaciones.
        </td>
      </tr>
    );
  } else {
    renderedApplicationRows = applicationRows;
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mis postulaciones</h1>
          <p className="page-sub">
            Consulta el estado de las vacantes a las que te has postulado.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4" role="alert">
          {error}
        </div>
      )}

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
              {renderedApplicationRows}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
