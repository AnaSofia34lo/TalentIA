"use client";

import React, { useEffect, useState } from "react";
import {
  AwardIcon,
  CheckIcon,
  TrendUpIcon,
  LogoSparkIcon,
} from "../../../shared/components/ui/Icons";
import { EstadoBadge } from "../../../shared/components/ui/Badge";
import {
  InterviewAnalysisResponse,
  useAuth,
} from "../../../shared/context/AuthContext";
import { MatchRing } from "../../../shared/components/ui/MatchRing";

type CandidateApplication = {
  id: string;
  vacancy: { title: string; organization: { name: string } };
};

function statusLabel(status: InterviewAnalysisResponse["status"]) {
  if (status === "completed") return "Compatibilidad disponible";
  if (status === "failed") return "Análisis no completado";
  if (status === "not_available") return "No disponible";
  return "Análisis en proceso";
}

function statusMessage(status: InterviewAnalysisResponse["status"]) {
  if (status === "failed")
    return "No fue posible completar el análisis. Puedes consultar nuevamente más tarde.";
  if (status === "not_available")
    return "Completa las entrevistas técnica y de habilidades blandas para obtener tu porcentaje.";
  return "La IA está preparando el resultado de tus entrevistas. Vuelve a consultar esta pantalla en unos momentos.";
}

export default function CandidatoResultadosPage() {
  const { listCandidateApplications, getCandidateInterviewAnalysis } =
    useAuth();
  const [results, setResults] = useState<InterviewAnalysisResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void listCandidateApplications()
      .then(async (applications) => {
        const items = await Promise.all(
          (applications as CandidateApplication[]).map((application) =>
            getCandidateInterviewAnalysis(application.id),
          ),
        );
        if (active) setResults(items);
      })
      .catch((requestError) => {
        if (active)
          setError(
            requestError instanceof Error
              ? requestError.message
              : "No fue posible consultar el análisis.",
          );
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // Las funciones del contexto se crean junto con el proveedor; esta vista carga una vez al entrar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mis resultados</h1>
          <p className="page-sub">
            Consulta la correspondencia de tus entrevistas con cada vacante.
          </p>
        </div>
      </div>

      {error && (
        <div
          className="rounded-lg bg-(--red-tint) text-(--red) text-sm p-3 mb-4"
          role="alert"
        >
          {error}
        </div>
      )}
      {loading && (
        <div className="card card-pad text-sm text-(--ink-soft)">
          Cargando tus resultados de compatibilidad…
        </div>
      )}
      {!loading && results.length === 0 && (
        <div className="card card-pad text-sm text-(--ink-soft)">
          Aún no tienes postulaciones para mostrar.
        </div>
      )}

      {!loading &&
        results.map((analysis) => {
          const completed =
            analysis.status === "completed" && analysis.overallScore !== null;
          return (
            <section
              className="card card-pad mb-4.5"
              key={analysis.application.id}
            >
              <div className="flex items-center gap-4 flex-wrap">
                <div
                  className="kpi-icon"
                  style={{
                    background: completed
                      ? "var(--green-tint)"
                      : "var(--navy-tint)",
                    color: completed ? "var(--green)" : "var(--navy)",
                    width: "52px",
                    height: "52px",
                  }}
                >
                  {completed ? (
                    <AwardIcon size={24} />
                  ) : (
                    <LogoSparkIcon size={24} />
                  )}
                </div>
                <div className="flex-1 min-w-55">
                  <h2 className="text-base font-bold">
                    {analysis.application.vacancy.title}
                  </h2>
                  <p className="text-sm text-(--ink-soft)">
                    {analysis.application.vacancy.organization}
                  </p>
                  <div className="mt-2">
                    <EstadoBadge estado={statusLabel(analysis.status)} />
                  </div>
                </div>
                {completed && (
                  <MatchRing
                    percentage={Math.round(analysis.overallScore ?? 0)}
                    size={92}
                    label="Match IA"
                    showLabel
                  />
                )}
              </div>

              {!completed && (
                <p className="text-sm text-(--ink-soft) mt-4">
                  {statusMessage(analysis.status)}
                </p>
              )}
              {analysis.status === "failed" && analysis.failureReason && (
                <p className="text-xs text-(--red) mt-2">
                  {analysis.failureReason}
                </p>
              )}

              {completed && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mt-5">
                    <div>
                      <h3 className="text-base font-bold mb-1.5">
                        Lo que se destacó
                      </h3>
                      <div className="result-list">
                        {analysis.strengths.map((strength) => (
                          <div className="result-item" key={strength}>
                            <div
                              className="result-ico"
                              style={{
                                background: "var(--green-tint)",
                                color: "var(--green)",
                              }}
                            >
                              <CheckIcon size={14} />
                            </div>
                            <div className="result-text">{strength}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-base font-bold mb-1.5">
                        Qué puedes seguir mejorando
                      </h3>
                      <div className="result-list">
                        {analysis.improvements.map((improvement) => (
                          <div className="result-item" key={improvement}>
                            <div
                              className="result-ico"
                              style={{
                                background: "var(--info-tint)",
                                color: "var(--info)",
                              }}
                            >
                              <TrendUpIcon size={14} />
                            </div>
                            <div className="result-text">{improvement}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="ai-box items-start mt-5 mb-0">
                    <div className="ai-icon">
                      <LogoSparkIcon size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm mb-1.5">
                        Recomendación
                      </h4>
                      <p className="text-(--ink-soft) text-sm leading-relaxed">
                        {analysis.recommendation ??
                          "El equipo de Recursos Humanos revisará tu resultado junto con tu perfil."}
                      </p>
                      <div className="disclaimer">
                        Este porcentaje es una guía generada por IA; la decisión
                        final corresponde al equipo de Recursos Humanos.
                      </div>
                    </div>
                  </div>
                </>
              )}
            </section>
          );
        })}
    </div>
  );
}
