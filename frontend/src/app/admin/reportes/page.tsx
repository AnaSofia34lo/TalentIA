'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { RecruiterReportItem, useAuth } from '../../../shared/context/AuthContext';
import { LogoSparkIcon, FileTextIcon } from '../../../shared/components/ui/Icons';
import { exportCandidateSummaryPdf } from '../../../shared/lib/exportCandidateSummaryPdf';

export default function AdminReportesPage() {
  const { listRecruiterReports, getRecruiterApplicationAnalysis } = useAuth();
  const [reports, setReports] = useState<RecruiterReportItem[]>([]);
  const [filterProfile, setFilterProfile] = useState('Todos');
  const [loading, setLoading] = useState(true);
  const [exportingId, setExportingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleExportRowPdf = async (row: RecruiterReportItem) => {
    try {
      setExportingId(row.applicationId);
      const fullReport = await getRecruiterApplicationAnalysis(row.applicationId);
      exportCandidateSummaryPdf(fullReport);
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'No fue posible generar el PDF de este perfil.',
      );
    } finally {
      setExportingId(null);
    }
  };

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        setLoading(true);
        setError('');
        const reportRows = await listRecruiterReports();
        if (!active) return;
        setReports(Array.isArray(reportRows) ? reportRows : []);
      } catch (requestError) {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar los reportes.',
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

  const vacancyTitles = useMemo(() => {
    const titles = Array.from(
      new Set(reports.map((row) => row.vacancyTitle).filter(Boolean)),
    );
    return ['Todos', ...titles];
  }, [reports]);

  const filteredRecs = useMemo(() => {
    if (filterProfile === 'Todos') return reports;
    return reports.filter((row) => row.vacancyTitle === filterProfile);
  }, [filterProfile, reports]);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Reportes</h1>
          <p className="page-sub">
            Recomendaciones de la IA para apoyar las decisiones de Recursos Humanos.
          </p>
        </div>
      </div>

      <div className="ai-box mb-6">
        <div className="ai-icon">
          <LogoSparkIcon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1.5">¿Qué encuentras aquí?</h4>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
            Esta vista lista los análisis de entrevista ya persistidos. El reporte
            individual completo (DOFA, competencias y evidencias) se abre con{' '}
            <b>Ver perfil completo</b>.
          </p>
          <div className="disclaimer">
            Estas recomendaciones son un apoyo al proceso; la decisión final siempre es de Recursos Humanos.
          </div>
        </div>
      </div>

      <div className="tabs mb-4.5 flex flex-wrap gap-2">
        {vacancyTitles.map((title) => (
          <button
            key={title}
            type="button"
            className={`tab ${filterProfile === title ? 'active' : ''}`}
            onClick={() => setFilterProfile(title)}
          >
            {title === 'Todos' ? 'Todos los perfiles' : title}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <p className="text-sm text-[var(--ink-soft)]">Cargando reportes…</p>
      ) : (
        <div className="flex flex-col gap-3.5">
          {filteredRecs.length > 0 ? (
            filteredRecs.map((row) => (
              <div
                key={row.applicationId}
                className="card card-pad flex flex-col sm:flex-row gap-4 items-start justify-between"
              >
                <div className="avatar shrink-0">{row.initials}</div>
                <div className="flex-1">
                  <div className="flex justify-between items-start gap-2.5 flex-wrap mb-1.5">
                    <div>
                      <b className="text-sm font-bold text-[var(--ink)]">
                        {row.candidateName}
                      </b>
                      <span className="badge badge-navy ml-2">{row.vacancyTitle}</span>
                    </div>
                    <span className="badge badge-green">
                      {Math.round(row.overallScore ?? 0)}% match
                    </span>
                  </div>
                  <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
                    {row.recommendation ??
                      'Sin recomendación textual; abre el perfil completo para ver el detalle del análisis.'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 shrink-0 self-start sm:self-center">
                  <button
                    type="button"
                    onClick={() => handleExportRowPdf(row)}
                    disabled={exportingId === row.applicationId}
                    className="btn btn-outline btn-sm flex items-center gap-1.5"
                    title="Descargar reporte completo de este candidato en PDF"
                  >
                    <FileTextIcon size={14} />
                    {exportingId === row.applicationId ? 'Generando PDF…' : 'Descargar PDF'}
                  </button>
                  <Link
                    href={`/admin/candidatos/${row.candidateId}?applicationId=${encodeURIComponent(row.applicationId)}&vacancyId=${encodeURIComponent(row.vacancyId)}`}
                    className="btn btn-primary btn-sm shrink-0"
                  >
                    Ver perfil completo
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="card card-pad text-center text-[var(--ink-faint)] py-10">
              No hay reportes de análisis completados todavía. Cuando un candidato
              termine sus entrevistas y la IA genere el Match, aparecerá aquí.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
