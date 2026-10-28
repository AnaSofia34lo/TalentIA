'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  if (status === 'applied' || status === 'pending' || status === 'interview_scheduled') return 'Postulado';
  if (status === 'reviewed') return 'Pendiente';
  if (status === 'completed') return 'Finalizado';
  if (status === 'technical_test' || status === 'shortlisted') return 'Prueba Técnica';
  if (status === 'interview_scheduled') return 'Entrevista programada';
  if (status === 'rejected') return 'No seleccionado';
  if (status === 'hired') return 'Contratado';
  return status;
}

export default function CandidatoPostulacionesPage() {
  const router = useRouter();
  const { listCandidateApplications, candidateProfile } = useAuth();
  const [applications, setApplications] = useState<ApplicationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<ApplicationItem | null>(null);
  const [consentStep, setConsentStep] = useState<'duration' | 'privacy'>('duration');
  const [consentChecked, setConsentChecked] = useState(false);

  const closeStartDialog = () => {
    setSelectedApplication(null);
    setConsentStep('duration');
    setConsentChecked(false);
  };

  useEffect(() => {
    if (!selectedApplication) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedApplication(null);
        setConsentStep('duration');
        setConsentChecked(false);
      }
    };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [selectedApplication]);

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
    if (application.status === 'applied' || application.status === 'pending' || application.status === 'interview_scheduled') {
      return (
        <button type="button" onClick={() => setSelectedApplication(application)} className={`${actionButtonClass} btn-accent`}>
          Iniciar
          <ArrowRightIcon size={14} />
        </button>
      );
    }
    if (application.status === 'reviewed') {
      return (
        <Link href="/candidato/resultados" className={`${actionButtonClass} btn-outline`}>
          Ver resumen
        </Link>
      );
    }
    if (application.status === 'completed') {
      return (
        <Link href="/candidato/resultados" className={`${actionButtonClass} btn-outline`}>
          Ver resultado
        </Link>
      );
    }
    if (application.status === 'technical_test' || application.status === 'shortlisted') {
      return (
        <Link
          href={`/candidato/prueba-tecnica?applicationId=${encodeURIComponent(application.id)}`}
          className={`${actionButtonClass} btn-accent`}
        >
          Hacer prueba
          <ArrowRightIcon size={14} />
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

      {selectedApplication && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/55 px-4 py-6 backdrop-blur-sm"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeStartDialog();
          }}
        >
          <section
            className="relative my-auto w-full max-w-xl rounded-3xl border border-white/70 bg-white p-6 shadow-2xl sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-interview-title"
            aria-describedby="start-interview-description"
          >
            <button
              type="button"
              className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full text-2xl text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              onClick={closeStartDialog}
              aria-label="Cerrar y volver a Mis postulaciones"
            >
              ×
            </button>
            {consentStep === 'duration' ? (
              <>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--purple)]">Antes de comenzar · Parte 1 de 2</p>
                <h2 id="start-interview-title" className="mb-3 text-2xl font-bold text-[var(--ink)]">Tiempo necesario para completar el proceso</h2>
                <p id="start-interview-description" className="mb-4 text-sm leading-6 text-[var(--ink-soft)]">
                  Para realizar todo el proceso, reserva aproximadamente 1 hora y 30 minutos: 30 minutos para la entrevista técnica y 25 minutos para la entrevista en video.
                </p>
                <p className="mb-6 text-sm leading-6 text-[var(--ink-soft)]">
                  Al iniciar la entrevista técnica comenzará a correr el tiempo. Asegúrate de tener una conexión estable y disponibilidad para completar el proceso.
                </p>
                {!candidateProfile?.identityDocument && (
                  <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900" role="alert">
                    Para continuar, primero debes subir una foto o PDF de tu documento de identidad.{' '}
                    <Link className="font-semibold underline" href="/candidato/perfil" onClick={closeStartDialog}>Ir a mi perfil</Link>
                  </div>
                )}
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" className="btn btn-ghost" onClick={closeStartDialog}>Cancelar</button>
                  <button type="button" className="btn btn-accent" disabled={!candidateProfile?.identityDocument} onClick={() => setConsentStep('privacy')}>
                    Continuar <ArrowRightIcon size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--purple)]">Autorización · Parte 2 de 2</p>
                <h2 id="start-interview-title" className="mb-3 text-2xl font-bold text-[var(--ink)]">Tratamiento de tus datos personales</h2>
                <p id="start-interview-description" className="mb-4 text-sm leading-6 text-[var(--ink-soft)]">
                  Para realizar la entrevista técnica guardaremos tus respuestas y las analizaremos en relación con los requisitos de la vacante. La información quedará asociada a tu proceso de selección y podrá ser consultada por la organización contratante.
                </p>
                <p className="mb-5 text-sm leading-6 text-[var(--ink-soft)]">Puedes consultar nuestra Política de Tratamiento de Datos Personales para conocer tus derechos y cómo ejercerlos.</p>
                <label className="mb-6 flex items-start gap-3 text-sm text-[var(--ink)]">
                  <input type="checkbox" checked={consentChecked} onChange={(event) => setConsentChecked(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--purple)]" />
                  <span>Autorizo el tratamiento de mis datos personales para realizar y evaluar esta entrevista técnica.</span>
                </label>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" className="btn btn-ghost" onClick={() => setConsentStep('duration')}>Volver</button>
                  <button
                    type="button"
                    className="btn btn-accent"
                    disabled={!consentChecked || !candidateProfile?.identityDocument}
                    onClick={() => {
                      sessionStorage.setItem(`technical-interview-consent:${candidateProfile?.id}:${selectedApplication.vacancyId}`, 'accepted');
                      const url = `/candidato/postulaciones/entrevista?vacancyId=${encodeURIComponent(selectedApplication.vacancyId)}&vacancy=${encodeURIComponent(selectedApplication.vacancy.title)}`;
                      router.push(url);
                    }}
                  >
                    Aceptar y comenzar <ArrowRightIcon size={16} />
                  </button>
                </div>
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
