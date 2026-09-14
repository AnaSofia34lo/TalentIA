"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import {
  FileTextIcon,
  DownloadIcon,
  PlusIcon,
  CheckIcon,
} from "../../../shared/components/ui/Icons";

export default function CandidatoCvPage() {
  const {
    candidateProfile,
    refreshCandidateCv,
    updateCandidateCv,
    uploadCandidateCv,
  } = useAuth();
  const [professionalTitle, setProfessionalTitle] = useState("");
  const [currentCompany, setCurrentCompany] = useState("");
  const [yearsOfExperience, setYearsOfExperience] = useState("");
  const [summary, setSummary] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const source =
      candidateProfile?.cvProfile ?? candidateProfile?.candidateProfile;
    if (source) {
      setProfessionalTitle(source.professionalTitle ?? "");
      setCurrentCompany(source.currentCompany ?? "");
      setYearsOfExperience(
        source.yearsOfExperience == null
          ? ""
          : String(source.yearsOfExperience),
      );
      setSummary(source.summary ?? "");
    }
    if (!candidateProfile?.cvProfile) void refreshCandidateCv();
  }, [candidateProfile]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (
      !professionalTitle.trim() ||
      !currentCompany.trim() ||
      !yearsOfExperience ||
      !summary.trim()
    ) {
      setError(
        "Campo obligatorio: completa todos los campos de experiencia profesional.",
      );
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
          : "No fue posible guardar la hoja de vida.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setError("");
    if (file.type !== "application/pdf") {
      setError("El archivo debe estar en formato PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("El archivo no puede superar 5 MB.");
      return;
    }
    try {
      setUploading(true);
      await uploadCandidateCv(file);
      await refreshCandidateCv();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (uploadError) {
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "No fue posible cargar el CV.",
      );
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const cv = candidateProfile?.cv;
  const fileDate = cv?.createdAt
    ? new Date(cv.createdAt).toLocaleDateString("es-CO")
    : "";

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mi hoja de vida</h1>
          <p className="page-sub">
            Mantén tu perfil actualizado para mejorar tu compatibilidad con las
            vacantes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4.5 items-start">
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-4">Experiencia profesional</h3>
          <form
            onSubmit={handleSave}
            className="flex flex-col gap-3.5"
            noValidate
          >
            <div className="field">
              <label htmlFor="professionalTitle">
                Cargo actual o principal
              </label>
              <input
                id="professionalTitle"
                className="input"
                value={professionalTitle}
                onChange={(event) => setProfessionalTitle(event.target.value)}
                placeholder="Diseñadora UX/UI"
              />
            </div>
            <div className="field">
              <label htmlFor="currentCompany">Empresa</label>
              <input
                id="currentCompany"
                className="input"
                value={currentCompany}
                onChange={(event) => setCurrentCompany(event.target.value)}
                placeholder="Estudio Croma"
              />
            </div>
            <div className="field">
              <label htmlFor="yearsOfExperience">Años de experiencia</label>
              <input
                id="yearsOfExperience"
                className="input"
                type="number"
                min="0"
                max="60"
                value={yearsOfExperience}
                onChange={(event) => setYearsOfExperience(event.target.value)}
                placeholder="4"
              />
            </div>
            <div className="field">
              <label htmlFor="summary">Resumen profesional</label>
              <textarea
                id="summary"
                className="input"
                rows={5}
                value={summary}
                onChange={(event) => setSummary(event.target.value)}
                placeholder="Describe tu experiencia, fortalezas y perfil profesional."
              />
            </div>
            {error && (
              <div
                className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3"
                role="alert"
              >
                {error}
              </div>
            )}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? "Guardando..." : "Guardar cambios"}
              </button>
              {saved && (
                <span className="text-xs font-semibold text-[var(--green)] flex items-center gap-1.5">
                  <CheckIcon size={16} /> Información guardada correctamente
                </span>
              )}
            </div>
          </form>
        </div>

        <div className="card card-pad text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5"
            style={{ background: "var(--navy-tint)", color: "var(--navy)" }}
          >
            <FileTextIcon size={24} />
          </div>
          <h3 className="text-sm font-bold mb-1">
            {cv?.fileName ?? "Aún no has cargado tu CV (Hoja de Vida)"}
          </h3>
          <p className="text-[var(--ink-faint)] text-xs mb-4">
            {cv ? `Subido el ${fileDate}` : "Formato PDF · máximo 5 MB"}
          </p>
          <button
            type="button"
            className="btn btn-outline btn-block mb-2"
            disabled={!cv?.downloadUrl}
            onClick={() =>
              cv?.downloadUrl &&
              window.open(cv.downloadUrl, "_blank", "noopener,noreferrer")
            }
          >
            <DownloadIcon size={16} />
            Descargar
          </button>
          <label
            className={`btn btn-primary btn-block cursor-pointer ${uploading ? "opacity-50" : ""}`}
          >
            <PlusIcon size={16} />
            {uploading
              ? "Cargando..."
              : cv
                ? "Reemplazar archivo"
                : "Cargar archivo"}
            <input
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={handleFileChange}
              disabled={uploading}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
