"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import { CheckIcon } from "../../../shared/components/ui/Icons";

export default function CandidatoPerfilPage() {
  const {
    user,
    candidateProfile,
    refreshCandidateProfile,
    updateCandidateProfile,
  } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!candidateProfile) {
      void refreshCandidateProfile();
      return;
    }
    setFullName(candidateProfile.fullName);
    setPhone(candidateProfile.phone ?? "");
    setLocation(candidateProfile.candidateProfile?.location ?? "");
    setLinkedinUrl(candidateProfile.candidateProfile?.linkedinUrl ?? "");
    setPortfolioUrl(candidateProfile.candidateProfile?.portfolioUrl ?? "");
  }, [candidateProfile]);

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    if (!fullName.trim()) {
      setError("Campo obligatorio: Nombre completo.");
      return;
    }
    if (phone.trim() && phone.trim().length < 7) {
      setError("El teléfono debe tener al menos 7 caracteres.");
      return;
    }

    try {
      setLoading(true);
      await updateCandidateProfile({
        fullName: fullName.trim(),
        ...(phone.trim() ? { phone: phone.trim() } : {}),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(linkedinUrl.trim() ? { linkedinUrl: linkedinUrl.trim() } : {}),
        ...(portfolioUrl.trim() ? { portfolioUrl: portfolioUrl.trim() } : {}),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "No fue posible guardar la información.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-sub">Información de tu cuenta de candidato.</p>
        </div>
      </div>

      <div className="card card-pad max-w-[620px]">
        <div className="flex items-center gap-4.5 mb-5.5">
          <div className="avatar avatar-lg">{user.avatarInitials}</div>
          <div>
            <h3 className="text-lg font-bold">{user.name}</h3>
            <p className="text-[var(--ink-soft)] text-sm">{user.roleTitle}</p>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          className="flex flex-col gap-3.5"
          noValidate
        >
          <div className="field">
            <label htmlFor="fullName">Nombre completo</label>
            <input
              id="fullName"
              className="input"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              className="input bg-[var(--bg)] cursor-not-allowed"
              value={candidateProfile?.email ?? user.email}
              readOnly
              disabled
              aria-describedby="email-help"
            />
            <p id="email-help" className="text-xs text-[var(--ink-faint)] mt-1">
              El correo no se puede modificar.
            </p>
          </div>
          <div className="field">
            <label htmlFor="phone">Teléfono</label>
            <input
              id="phone"
              className="input"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="+57 300 123 4567"
            />
          </div>
          <div className="field">
            <label htmlFor="location">Ciudad</label>
            <input
              id="location"
              className="input"
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Medellín"
            />
          </div>
          <div className="field">
            <label htmlFor="linkedin">LinkedIn</label>
            <input
              id="linkedin"
              className="input"
              type="url"
              value={linkedinUrl}
              onChange={(event) => setLinkedinUrl(event.target.value)}
              placeholder="https://www.linkedin.com/in/tu-perfil"
            />
          </div>
          <div className="field">
            <label htmlFor="portfolio">Portafolio</label>
            <input
              id="portfolio"
              className="input"
              type="url"
              value={portfolioUrl}
              onChange={(event) => setPortfolioUrl(event.target.value)}
              placeholder="https://tu-portafolio.com"
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
    </div>
  );
}
