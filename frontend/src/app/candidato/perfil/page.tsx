"use client";
/* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

import React, { useEffect, useState } from "react";
import { useAuth } from "../../../shared/context/AuthContext";
import {
  CheckIcon,
  FileTextIcon,
  MailIcon,
  UserIcon,
} from "../../../shared/components/ui/Icons";

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
    <div className="max-w-[1080px]">
      <div className="page-head mb-7">
        <div>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-sub max-w-[520px]">
            Mantén tus datos actualizados para que las mejores oportunidades te encuentren.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] gap-5 items-start">
        <aside className="card overflow-hidden">
          <div className="h-20 bg-[var(--grad-brand)] relative">
            <div className="absolute -bottom-10 left-6 rounded-[24px] p-1.5 bg-white shadow-[0_6px_18px_rgba(14,27,44,0.12)]">
              <div className="avatar avatar-lg">{user.avatarInitials}</div>
            </div>
          </div>
          <div className="px-6 pt-14 pb-6">
            <h2 className="text-lg font-bold leading-tight">{user.name}</h2>
            <p className="text-sm text-[var(--ink-soft)] mt-1">{user.roleTitle}</p>
            <div className="h-px bg-[var(--line)] my-5" />
            <div className="flex items-start gap-3 text-sm text-[var(--ink-soft)]">
              <MailIcon size={17} className="text-[var(--purple)] mt-0.5 shrink-0" />
              <span className="break-all">{candidateProfile?.email ?? user.email}</span>
            </div>
            <div className="mt-5 rounded-xl bg-[var(--purple-tint)] px-3.5 py-3 text-xs leading-relaxed text-[var(--navy)]">
              <strong className="block text-sm mb-1">Haz que tu perfil destaque</strong>
              Completa tus datos de contacto y enlaces profesionales para mejorar tu visibilidad.
            </div>
          </div>
        </aside>

        <form onSubmit={handleSave} className="card card-pad flex flex-col gap-6" noValidate>
          <div>
            <div className="flex items-center gap-2 text-[var(--navy)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--navy-tint)]">
                <UserIcon size={17} />
              </div>
              <div>
                <h2 className="font-bold">Información básica</h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">Así te identificaremos en TalentIA.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
              <div className="field sm:col-span-2">
                <label htmlFor="fullName">Nombre completo</label>
                <input id="fullName" className="input" value={fullName} onChange={(event) => setFullName(event.target.value)} />
              </div>
              <div className="field">
                <label htmlFor="email">Correo electrónico</label>
                <input id="email" className="input bg-[var(--bg)] cursor-not-allowed" value={candidateProfile?.email ?? user.email} readOnly disabled aria-describedby="email-help" />
                <p id="email-help" className="text-xs text-[var(--ink-faint)] mt-1">No se puede modificar.</p>
              </div>
              <div className="field">
                <label htmlFor="phone">Teléfono</label>
                <input id="phone" className="input" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+57 300 123 4567" />
              </div>
              <div className="field sm:col-span-2">
                <label htmlFor="location">Ciudad</label>
                <input id="location" className="input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Medellín" />
              </div>
            </div>
          </div>

          <div className="h-px bg-[var(--line)]" />

          <div>
            <div className="flex items-center gap-2 text-[var(--navy)]">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--green-tint)] text-[var(--green)]">
                <FileTextIcon size={17} />
              </div>
              <div>
                <h2 className="font-bold">Presencia profesional</h2>
                <p className="text-xs text-[var(--ink-soft)] mt-0.5">Comparte tus proyectos y experiencia.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 mt-5">
              <div className="field">
                <label htmlFor="linkedin">LinkedIn</label>
                <input id="linkedin" className="input" type="url" value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} placeholder="https://www.linkedin.com/in/tu-perfil" />
              </div>
              <div className="field">
                <label htmlFor="portfolio">Portafolio</label>
                <input id="portfolio" className="input" type="url" value={portfolioUrl} onChange={(event) => setPortfolioUrl(event.target.value)} placeholder="https://tu-portafolio.com" />
              </div>
            </div>
          </div>

          {error && (
            <div
              className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3 pt-1">
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
