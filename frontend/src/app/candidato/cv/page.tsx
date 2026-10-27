"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import type { CandidateResumeAnalysisResponse } from "../../../shared/context/AuthContext";
import {
  CheckIcon,
  DownloadIcon,
  FileTextIcon,
  PlusIcon,
} from "../../../shared/components/ui/Icons";

type AnalysisStatus = "idle" | "processing" | "ready" | "pending" | "error";

const EMPTY_ANALYSIS: CandidateResumeAnalysisResponse = {
  workExperiences: [],
  certifications: [],
  technicalSkills: [],
};

function formatFileSize(size?: number | null) {
  if (!size) return "Tamaño no disponible";
  return size < 1024 * 1024
    ? `${Math.max(1, Math.round(size / 1024))} KB`
    : `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function hasExtractedData(analysis: CandidateResumeAnalysisResponse) {
  return Boolean(
    analysis.workExperiences.length ||
      analysis.certifications.length ||
      analysis.technicalSkills.length,
  );
}

export default function CandidatoCvPage() {
  const {
    candidateProfile,
    refreshCandidateCv,
    updateCandidateCv,
    uploadCandidateCv,
    getCandidateCvAnalysisStatus,
    getCandidateResumeAnalysis,
  } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const profileHydratedRef = useRef(false);
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [summary, setSummary] = useState("");
  const [analysis, setAnalysis] = useState(EMPTY_ANALYSIS);
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>("idle");
  const [analysisRefreshKey, setAnalysisRefreshKey] = useState(0);
  const [analysisError, setAnalysisError] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    if (!candidateProfile || profileHydratedRef.current) return;
    profileHydratedRef.current = true;
    const source = candidateProfile.cvProfile ?? candidateProfile.candidateProfile;
    if (source) {
      setProfessionalTitle(source.professionalTitle ?? "");
      setCurrentCompany(source.currentCompany ?? "");
      setYearsOfExperience(
        source.yearsOfExperience == null ? "" : String(source.yearsOfExperience),
      );
      setSummary(source.summary ?? "");
    }
    if (!candidateProfile.cvProfile) {
      void refreshCandidateCv().catch(() => undefined);
    }
  }, [candidateProfile]);

  useEffect(() => {
    if (!candidateProfile?.cv) return;
    let active = true;
    const loadLatestAnalysis = async () => {
      try {
        let status = candidateProfile.cv?.resumeAnalysisStatus ?? null;
        if (status === "processing") {
          setAnalysisStatus("processing");
          for (let attempt = 0; attempt < 40 && status === "processing"; attempt += 1) {
            await new Promise((resolve) => window.setTimeout(resolve, 1500));
            if (!active) return;
            const latestStatus = await getCandidateCvAnalysisStatus();
            if (latestStatus.cvId && latestStatus.cvId !== candidateProfile.cv?.id) {
              void refreshCandidateCv();
              return;
            }
            status = latestStatus.status;
          }
        }

        if (!active) return;
        const result = await getCandidateResumeAnalysis();
        if (!active) return;
        setAnalysis(result);
        setAnalysisError("");
        if (status === "failed") {
          setAnalysisStatus("error");
          setAnalysisError("No se pudo completar el análisis de este CV. Puedes volver a cargar el documento para intentarlo otra vez.");
        } else if (status === "processing") {
          setAnalysisStatus("pending");
          setAnalysisError("El análisis sigue en proceso. Puedes consultar su estado más tarde sin recargar la página.");
        } else {
          setAnalysisStatus(hasExtractedData(result) ? "ready" : "pending");
        }
      } catch (analysisRequestError) {
        if (!active) return;
        setAnalysisStatus("error");
        setAnalysisError(
          analysisRequestError instanceof Error
            ? analysisRequestError.message
            : "No se pudieron cargar los datos detectados.",
        );
      }
    };

    void loadLatestAnalysis();
    return () => {
      active = false;
    };
  }, [candidateProfile?.cv?.id, candidateProfile?.cv?.resumeAnalysisStatus, analysisRefreshKey]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (
      !professionalTitle.trim() ||
      !currentCompany.trim() ||
      !yearsOfExperience ||
      !summary.trim()
    ) {
      setError("Completa todos los campos de experiencia profesional.");
      return;
    }
    if (summary.trim().length < 20) {
      setError("El resumen profesional debe tener mínimo 20 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await updateCandidateCv({
        professionalTitle: professionalTitle.trim(),
        currentCompany: currentCompany.trim(),
        yearsOfExperience: Number(yearsOfExperience),
        summary: summary.trim(),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No fue posible guardar la información profesional.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFile = async (file?: File) => {
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setError("El archivo debe estar en formato PDF.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo no puede superar 5 MB.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    let fileWasUploaded = false;
    const previousAnalysis = analysis;
    try {
      setUploading(true);
      setAnalysisStatus("processing");
      setAnalysisError("");
      setAnalysis({
        workExperiences: [],
        certifications: [],
        technicalSkills: previousAnalysis.technicalSkills,
      });
      await uploadCandidateCv(file);
      fileWasUploaded = true;
      await refreshCandidateCv();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (uploadError) {
      if (!fileWasUploaded) setAnalysis(previousAnalysis);
      setAnalysisStatus("error");
      setError(
        uploadError instanceof Error
          ? fileWasUploaded
            ? `El archivo se guardó, pero no pudimos actualizar sus datos: ${uploadError.message}`
            : uploadError.message
          : fileWasUploaded
            ? "El archivo se guardó, pero no pudimos actualizar sus datos detectados."
            : "No fue posible cargar tu hoja de vida.",
      );
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const cv = candidateProfile?.cv;
  const fileDate = cv?.createdAt
    ? new Date(cv.createdAt).toLocaleDateString("es-CO", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const profileFields = [professionalTitle, currentCompany, yearsOfExperience, summary];
  const completedProfileFields = profileFields.filter((value) => value.trim()).length;
  const profileProgress = Math.round((completedProfileFields / profileFields.length) * 100);

  const uploadInput = (
    <input
      ref={fileInputRef}
      type="file"
      accept="application/pdf,.pdf"
      className="sr-only"
      onChange={(event) => void handleFile(event.target.files?.[0])}
      disabled={uploading}
      aria-label="Seleccionar hoja de vida en PDF"
    />
  );

  return (
    <div className="mx-auto max-w-6xl pb-10">
      <div className="page-head mb-6">
        <div>
          <span className="eyebrow">Tu perfil profesional</span>
          <h1 className="page-title">Mi hoja de vida</h1>
          <p className="page-sub">
            Mantén tu CV al día y revisa la información que TalentIA detecta para conectarte con oportunidades.
          </p>
        </div>
      </div>

      {error && (
        <div className="mb-5 rounded-xl bg-[var(--red-tint)] p-4 text-sm text-[var(--red)]" role="alert">
          {error}
        </div>
      )}
      {saved && (
        <div className="mb-5 flex items-center gap-2 rounded-xl bg-[var(--green-tint)] p-4 text-sm font-medium text-[var(--green)]" role="status">
          <CheckIcon size={17} /> Cambios guardados correctamente.
        </div>
      )}

      <section className="mb-6 grid gap-5 lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.8fr)]">
        <div
          className={`card card-pad border-2 border-dashed transition-colors ${isDragging ? "border-[var(--purple)] bg-[var(--purple-tint)]" : "border-[var(--line)]"}`}
          onDragOver={(event) => { event.preventDefault(); setIsDragging(true); }}
          onDragLeave={(event) => { event.preventDefault(); setIsDragging(false); }}
          onDrop={(event) => {
            event.preventDefault();
            setIsDragging(false);
            void handleFile(event.dataTransfer.files?.[0]);
          }}
        >
          <div className="mb-5 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--navy-tint)] text-[var(--navy)]">
              <FileTextIcon size={23} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-[var(--ink)]">Documento de hoja de vida</h2>
                {cv && <span className="rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-xs font-semibold text-[var(--green)]">Cargado</span>}
              </div>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {cv ? "Tu documento está disponible para los procesos en los que participas." : "Sube un PDF para que podamos revisar tu experiencia y habilidades."}
              </p>
            </div>
          </div>

          {cv ? (
            <div className="mb-5 flex flex-col gap-4 rounded-xl bg-[var(--bg)] p-4 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white text-[var(--red)] shadow-sm">
                <FileTextIcon size={22} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-[var(--ink)]" title={cv.fileName}>{cv.fileName}</p>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {formatFileSize(cv.sizeBytes)}{fileDate ? ` · Subido el ${fileDate}` : ""}
                </p>
              </div>
              {cv.downloadUrl && (
                <a className="btn btn-outline btn-sm shrink-0" href={cv.downloadUrl} target="_blank" rel="noreferrer">
                  <DownloadIcon size={15} /> Ver PDF
                </a>
              )}
            </div>
          ) : (
            <div className="mb-5 rounded-xl bg-[var(--bg)] px-5 py-8 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--purple)] shadow-sm">
                <PlusIcon size={22} />
              </div>
              <p className="font-semibold text-[var(--ink)]">Arrastra tu CV aquí</p>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">o selecciónalo desde tu dispositivo</p>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <PlusIcon size={16} />
              {uploading ? "Subiendo CV…" : cv ? "Reemplazar CV" : "Seleccionar archivo"}
            </button>
            <span className="text-xs text-[var(--ink-faint)]">PDF · máximo 5 MB</span>
            {uploadInput}
          </div>

          {analysisStatus !== "idle" && (
            <div className={`mt-5 flex items-start gap-3 rounded-xl p-4 text-sm ${analysisStatus === "error" ? "bg-[var(--red-tint)] text-[var(--red)]" : "bg-[var(--purple-tint)] text-[var(--ink)]"}`} role="status">
              {analysisStatus === "processing" ? <span className="spinner mt-0.5" /> : <FileTextIcon size={18} />}
              <div>
                <p className="font-semibold">
                  {analysisStatus === "processing" ? "Analizando tu CV" : analysisStatus === "ready" ? "Información detectada" : analysisStatus === "pending" ? "El análisis puede tardar un momento" : "No se pudo cargar el análisis"}
                </p>
                <p className="mt-1 text-xs opacity-80">
                  {analysisStatus === "processing" ? "Estamos organizando la experiencia y las habilidades encontradas." : analysisStatus === "ready" ? "Revisa los datos extraídos abajo y completa cualquier detalle que falte." : analysisStatus === "pending" ? "Tu archivo ya está guardado. Actualiza esta vista en unos segundos para consultar los resultados." : analysisError || "Vuelve a intentarlo más tarde."}
                </p>
                {(analysisStatus === "pending" || analysisStatus === "error") && cv && (
                  <button
                    type="button"
                    className="mt-3 text-xs font-semibold text-[var(--purple)] underline underline-offset-2"
                    onClick={() => {
                      setAnalysisStatus("processing");
                      setAnalysisError("");
                      setAnalysisRefreshKey((key) => key + 1);
                    }}
                  >
                    Actualizar datos detectados
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <aside className="card card-pad">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-bold text-[var(--ink)]">Perfil profesional</h2>
              <p className="mt-1 text-xs text-[var(--ink-soft)]">Completa estos datos para destacar.</p>
            </div>
            <span className="text-lg font-bold text-[var(--purple)]">{profileProgress}%</span>
          </div>
          <div className="mb-5 h-2 overflow-hidden rounded-full bg-[var(--bg)]">
            <div className="h-full rounded-full bg-[var(--purple)] transition-all" style={{ width: `${profileProgress}%` }} />
          </div>
          <ul className="space-y-3 text-sm">
            {[
              ["Cargo profesional", professionalTitle],
              ["Empresa", currentCompany],
              ["Experiencia", yearsOfExperience],
              ["Resumen", summary],
            ].map(([label, value]) => (
              <li key={label} className="flex items-center gap-2.5 text-[var(--ink-soft)]">
                <span className={`flex h-5 w-5 items-center justify-center rounded-full ${value ? "bg-[var(--green-tint)] text-[var(--green)]" : "bg-[var(--bg)] text-[var(--ink-faint)]"}`}>
                  {value ? <CheckIcon size={13} /> : <span className="h-1.5 w-1.5 rounded-full bg-current" />}
                </span>
                {label}
              </li>
            ))}
          </ul>
          {!cv && <p className="mt-5 rounded-lg bg-[var(--navy-tint)] p-3 text-xs leading-5 text-[var(--navy)]">También puedes completar tu información manualmente mientras cargas el documento.</p>}
        </aside>
      </section>

      <section className="card card-pad mb-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow">Lectura inteligente</span>
            <h2 className="mt-1 text-lg font-bold text-[var(--ink)]">Lo que encontramos en tu CV</h2>
          </div>
          <span className="text-xs text-[var(--ink-soft)]">Verifica que la información sea correcta</span>
        </div>

        {analysisStatus === "error" ? (
          <div className="rounded-xl bg-[var(--bg)] p-5 text-sm text-[var(--ink-soft)]">
            No pudimos consultar los datos detectados. Puedes seguir editando tu perfil y volver a cargar la página más tarde.
          </div>
        ) : !hasExtractedData(analysis) ? (
          <div className="rounded-xl bg-[var(--bg)] p-6 text-center">
            <FileTextIcon size={24} className="mx-auto mb-2 text-[var(--ink-faint)]" />
            <p className="text-sm font-medium text-[var(--ink)]">Aún no hay datos extraídos para mostrar</p>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">Cuando el análisis termine, aquí aparecerán tus habilidades, experiencia y certificaciones.</p>
          </div>
        ) : (
          <div className="grid gap-5 lg:grid-cols-3">
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Habilidades técnicas</h3>
              {analysis.technicalSkills.length ? (
                <ul className="space-y-3">
                  {analysis.technicalSkills.map((skill) => (
                    <li key={skill.id}>
                      <div className="mb-1 flex justify-between gap-2 text-xs">
                        <span className="font-medium text-[var(--ink)]">{skill.name}</span>
                        {skill.estimatedProficiency != null && <span className="text-[var(--ink-soft)]">{Math.round(skill.estimatedProficiency)}%</span>}
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--bg)]"><div className="h-full rounded-full bg-[var(--purple)]" style={{ width: `${Math.max(0, Math.min(100, skill.estimatedProficiency ?? 0))}%` }} /></div>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-[var(--ink-soft)]">No se detectaron habilidades.</p>}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Experiencia</h3>
              {analysis.workExperiences.length ? (
                <ul className="space-y-3">
                  {analysis.workExperiences.map((experience) => (
                    <li key={experience.id} className="rounded-lg bg-[var(--bg)] p-3">
                      <p className="text-sm font-semibold text-[var(--ink)]">{experience.role || "Cargo"}</p>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{experience.company || "Empresa"}{experience.startDate ? ` · ${experience.startDate}` : ""}{experience.endDate ? ` – ${experience.endDate}` : ""}</p>
                      {experience.description && <p className="mt-2 text-xs leading-5 text-[var(--ink-soft)]">{experience.description}</p>}
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-[var(--ink-soft)]">No se detectó experiencia laboral.</p>}
            </div>
            <div>
              <h3 className="mb-3 text-sm font-semibold text-[var(--ink)]">Certificaciones</h3>
              {analysis.certifications.length ? (
                <ul className="space-y-3">
                  {analysis.certifications.map((certification) => (
                    <li key={certification.id} className="rounded-lg bg-[var(--bg)] p-3">
                      <p className="text-sm font-semibold text-[var(--ink)]">{certification.name || "Certificación"}</p>
                      <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{certification.issuer || "Emisor no especificado"}{certification.date ? ` · ${certification.date}` : ""}</p>
                    </li>
                  ))}
                </ul>
              ) : <p className="text-xs text-[var(--ink-soft)]">No se detectaron certificaciones.</p>}
            </div>
          </div>
        )}
      </section>

      <section className="card card-pad">
        <div className="mb-5">
          <span className="eyebrow">Información editable</span>
          <h2 className="mt-1 text-lg font-bold text-[var(--ink)]">Experiencia profesional</h2>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">Los datos que editas aquí se conservan; la experiencia y certificaciones detectadas se actualizan con el nuevo PDF.</p>
        </div>
        <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2" noValidate>
          <div className="field">
            <label htmlFor="professionalTitle">Cargo actual o principal</label>
            <input id="professionalTitle" className="input" value={professionalTitle} onChange={(event) => setProfessionalTitle(event.target.value)} placeholder="Diseñadora UX/UI" />
          </div>
          <div className="field">
            <label htmlFor="currentCompany">Empresa</label>
            <input id="currentCompany" className="input" value={currentCompany} onChange={(event) => setCurrentCompany(event.target.value)} placeholder="Estudio Croma" />
          </div>
          <div className="field">
            <label htmlFor="yearsOfExperience">Años de experiencia</label>
            <input id="yearsOfExperience" className="input" type="number" min="0" max="60" value={yearsOfExperience} onChange={(event) => setYearsOfExperience(event.target.value)} placeholder="4" />
          </div>
          <div className="field md:col-span-2">
            <label htmlFor="summary">Resumen profesional</label>
            <textarea id="summary" className="input" rows={4} value={summary} onChange={(event) => setSummary(event.target.value)} placeholder="Describe tu experiencia, fortalezas y perfil profesional." />
            <span className="text-xs text-[var(--ink-faint)]">Mínimo 20 caracteres.</span>
          </div>
          <div className="md:col-span-2">
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Guardando…" : "Guardar información"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
