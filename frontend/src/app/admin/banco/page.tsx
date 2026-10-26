"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, VacancyApplicant } from "../../../shared/context/AuthContext";
import { FilterIcon, StarIcon } from "../../../shared/components/ui/Icons";
import { EstadoBadge } from "../../../shared/components/ui/Badge";
import { MatchRing } from "../../../shared/components/ui/MatchRing";

type VacancyOption = { id: string; name: string; status: string };
const medalLabel: Record<string, string> = {
  gold: "",
  silver: "",
  bronze: "",
};

function statusLabel(status: string) {
  if (status === "applied" || status === "pending") return "Postulado";
  if (status === "reviewed") return "En revisión";
  if (status === "shortlisted") return "Preseleccionado";
  if (status === "interview_scheduled") return "Entrevista programada";
  if (status === "completed") return "Proceso finalizado";
  if (status === "rejected") return "No seleccionado";
  if (status === "hired") return "Contratado";
  return status;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export default function AdminBancoPage() {
  const { listVacancies, listVacancyApplicants } = useAuth();
  const [vacancies, setVacancies] = useState<VacancyOption[]>([]);
  const [selectedVacancyId, setSelectedVacancyId] = useState("");
  const [candidates, setCandidates] = useState<VacancyApplicant[]>([]);
  const [vacancyName, setVacancyName] = useState("");
  const [loading, setLoading] = useState(true);
  const [loadingCandidates, setLoadingCandidates] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listVacancies()
      .then((items) => {
        const options = (Array.isArray(items) ? items : []) as VacancyOption[];
        if (active) {
          setVacancies(options);
          setSelectedVacancyId(options[0]?.id ?? "");
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible cargar las vacantes.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Las funciones del contexto se recrean por render; la carga inicial solo debe ejecutarse una vez.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedVacancyId) return;
    let active = true;
    setLoadingCandidates(true);
    setError("");
    void listVacancyApplicants(selectedVacancyId)
      .then((result) => {
        if (active) {
          setCandidates(result.candidates);
          setVacancyName(result.vacancy.name);
        }
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible cargar los candidatos.",
          );
      })
      .finally(() => {
        if (active) setLoadingCandidates(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVacancyId]);

  const topThree = candidates.slice(0, 3);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Candidatos por vacante</h1>
          <p className="page-sub">
            Consulta todos los postulantes y revisa el ranking generado por IA.
          </p>
        </div>
      </div>
      <div className="card card-pad mb-6">
        <label
          htmlFor="vacancy-filter"
          className="text-[var(--ink-faint)] text-xs font-semibold flex items-center gap-1.5 mb-2"
        >
          <FilterIcon size={15} /> Selecciona una vacante
        </label>
        {loading ? (
          <p className="text-sm text-[var(--ink-soft)]">Cargando vacantes…</p>
        ) : (
          <select
            id="vacancy-filter"
            className="input max-w-xl"
            value={selectedVacancyId}
            onChange={(event) => setSelectedVacancyId(event.target.value)}
          >
            <option value="">Selecciona una vacante</option>
            {vacancies.map((vacancy) => (
              <option key={vacancy.id} value={vacancy.id}>
                {vacancy.name}
              </option>
            ))}
          </select>
        )}
      </div>
      {error && (
        <div
          className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3 mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      {selectedVacancyId && (
        <>
          <div className="mb-8">
            <h3 className="text-base font-bold mb-1 flex items-center gap-2">
              <span className="text-[var(--purple)]">
                <StarIcon size={18} />
              </span>{" "}
              Ranking IA — <span>{vacancyName}</span>
            </h3>
            <p className="text-[var(--ink-faint)] text-xs mb-4">
              Los tres mejores puntajes aparecen destacados.
            </p>
            {loadingCandidates ? (
              <div className="card card-pad text-sm text-[var(--ink-soft)]">
                Cargando candidatos…
              </div>
            ) : topThree.length === 0 ? (
              <div className="card card-pad text-sm text-[var(--ink-soft)]">
                Aún no hay candidatos postulados a esta vacante.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5">
                {topThree.map((candidate) => (
                  <div
                    key={candidate.applicationId}
                    className={`rank-card ${candidate.medal === "gold" ? "top1" : candidate.medal === "silver" ? "top2" : "top3"}`}
                  >
                    <div className="rank-num">{candidate.rank}</div>
                    <div className="text-2xl my-1">
                      {candidate.medal
                        ? medalLabel[candidate.medal].split(" ")[0]
                        : "•"}
                    </div>
                    <div className="avatar my-2 mx-auto">
                      {initials(candidate.fullName)}
                    </div>
                    <h4 className="text-sm font-bold mb-2 leading-tight min-h-[38px] flex items-center justify-center">
                      {candidate.fullName}
                    </h4>
                    <div className="flex justify-center my-2">
                      <MatchRing percentage={candidate.score} size={56} />
                    </div>
                    <p className="text-xs font-semibold mb-2">
                      {medalLabel[candidate.medal ?? ""]}
                    </p>
                    <EstadoBadge estado={statusLabel(candidate.status)} />
                    <Link
                      href={`/admin/candidatos/${candidate.candidateId}`}
                      className="btn btn-outline btn-sm btn-block mt-3"
                    >
                      Ver perfil
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <h3 className="text-base font-bold mb-1">
              Todos los candidatos postulados
            </h3>
            <p className="text-[var(--ink-faint)] text-xs mb-3.5">
              La lista completa está ordenada por puntaje de compatibilidad
              descendente.
            </p>
            <div className="card">
              <div className="table-wrap">
                <table className="modern">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Candidato</th>
                      <th>Compatibilidad</th>
                      <th>Estado</th>
                      <th>Postulación</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((candidate) => (
                      <tr key={candidate.applicationId}>
                        <td className="text-[var(--ink-faint)] font-semibold">
                          {candidate.rank}
                        </td>
                        <td>
                          <div className="row-person">
                            <div className="avatar avatar-sm">
                              {initials(candidate.fullName)}
                            </div>
                            <div>
                              <span>{candidate.fullName}</span>
                              <small className="block text-[var(--ink-faint)]">
                                {candidate.email}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td>
                          <MatchRing percentage={candidate.score} size={34} />
                        </td>
                        <td>
                          <EstadoBadge estado={statusLabel(candidate.status)} />
                        </td>
                        <td className="text-[var(--ink-soft)]">
                          {new Intl.DateTimeFormat("es-CO", {
                            dateStyle: "medium",
                          }).format(new Date(candidate.submittedAt))}
                        </td>
                        <td>
                          <Link
                            href={`/admin/candidatos/${candidate.candidateId}`}
                            className="btn btn-outline btn-sm"
                          >
                            Ver perfil
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
