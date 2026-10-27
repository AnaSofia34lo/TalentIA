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
    uploadIdentityDocument,
  } = useAuth();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [portfolioUrl, setPortfolioUrl] = useState("");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [identityFile, setIdentityFile] = useState<File | null>(null);
  const [identityUploading, setIdentityUploading] = useState(false);
  const [identityMessage, setIdentityMessage] = useState("");
  const [identityError, setIdentityError] = useState("");
  const profileCompletion = Math.round(([
    Boolean(fullName.trim()),
    Boolean(phone.trim()),
    Boolean(location.trim()),
    Boolean(linkedinUrl.trim() || portfolioUrl.trim()),
    Boolean(candidateProfile?.identityDocument),
  ].filter(Boolean).length / 5) * 100);

  const handleIdentityUpload = async (event: React.FormEvent) => {
    event.preventDefault();
    setIdentityMessage("");
    setIdentityError("");
    if (!identityFile) {
      setIdentityError("Selecciona una foto o un PDF de tu documento.");
      return;
    }
    try {
      setIdentityUploading(true);
      await uploadIdentityDocument(identityFile);
      setIdentityFile(null);
      setIdentityMessage("Documento cargado. Ya puedes presentar tus entrevistas.");
    } catch (uploadError) {
      setIdentityError(uploadError instanceof Error ? uploadError.message : "No se pudo cargar el documento.");
    } finally {
      setIdentityUploading(false);
    }
  };

  useEffect(() => {
    if (!candidateProfile) {
      void refreshCandidateProfile().catch(() => undefined);
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
    <div className="max-w-[1180px] pb-8">
      <div className="page-head mb-8">
        <div>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-sub max-w-[520px]">
            Mantén tus datos actualizados para que las mejores oportunidades te encuentren.
          </p>
        </div>
        <span className="rounded-full bg-[var(--purple-tint)] px-3.5 py-2 text-xs font-semibold text-[var(--navy)]">
          {profileCompletion === 100 ? "Perfil completo" : `${profileCompletion}% completado`}
        </span>
      </div>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[290px_minmax(0,1fr)]">
        <aside className="card overflow-hidden lg:sticky lg:top-6">
          <div className="relative h-24 bg-[var(--grad-brand)]">
            <div className="absolute -bottom-8 left-5 rounded-2xl bg-white p-1.5 shadow-[0_6px_18px_rgba(14,27,44,0.12)]">
              <div className="avatar avatar-lg">{user.avatarInitials}</div>
            </div>
          </div>
          <div className="px-5 pb-5 pt-12">
            <h2 className="text-lg font-bold leading-tight">{user.name}</h2>
            <p className="text-sm text-[var(--ink-soft)] mt-1">{user.roleTitle}</p>
            {location && <p className="mt-2 text-xs font-medium text-[var(--purple)]">{location}</p>}
            <div className="mt-5 rounded-xl border border-[var(--line)] bg-[var(--bg)] p-4">
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="font-semibold text-[var(--navy)]">Tu perfil</span>
                <span className="font-bold text-[var(--purple)]">{profileCompletion}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-label="Perfil completado" aria-valuemin={0} aria-valuemax={100} aria-valuenow={profileCompletion}>
                <div className="h-full rounded-full bg-[var(--purple)] transition-[width]" style={{ width: `${profileCompletion}%` }} />
              </div>
              <p className="mt-2 text-xs leading-relaxed text-[var(--ink-soft)]">Completa tus datos para que los reclutadores conozcan mejor tu experiencia.</p>
            </div>
            <nav aria-label="Secciones del perfil" className="mt-4 grid gap-1 border-t border-[var(--line)] pt-3">
              <a href="#personal-section" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--navy)]">Información básica</a>
              <a href="#professional-section" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--navy)]">Presencia profesional</a>
              <a href="#identity-section" className="rounded-lg px-3 py-2 text-sm font-medium text-[var(--ink-soft)] hover:bg-[var(--bg)] hover:text-[var(--navy)]">Documento de identidad</a>
            </nav>
            <div className="h-px bg-[var(--line)] my-5" />
            <div className="flex items-start gap-3 text-sm text-[var(--ink-soft)]">
              <MailIcon size={17} className="text-[var(--purple)] mt-0.5 shrink-0" />
              <span className="break-all">{candidateProfile?.email ?? user.email}</span>
            </div>
          </div>
        </aside>

        <form onSubmit={handleSave} className="card card-pad flex flex-col gap-5" noValidate>
          <div id="personal-section" className="scroll-mt-6 rounded-2xl border border-[var(--line)] p-5">
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
              <div className="field">
                <label htmlFor="location">Ciudad</label>
                <input id="location" className="input" value={location} onChange={(event) => setLocation(event.target.value)} placeholder="Medellín" />
              </div>
            </div>
          </div>

          <div id="professional-section" className="scroll-mt-6 rounded-2xl border border-[var(--line)] p-5">

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
            <div className="grid grid-cols-1 gap-4 mt-5 sm:grid-cols-2">
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
          </div>

          {error && (
            <div
              className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-5">
            {saved ? (
              <span className="flex items-center gap-1.5 text-xs font-semibold text-[var(--green)]" role="status">
                <CheckIcon size={16} /> Información guardada correctamente
              </span>
            ) : <span className="text-xs text-[var(--ink-faint)]">Tus cambios se aplicarán a tu perfil.</span>}
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? "Guardando..." : "Guardar cambios"}
            </button>

          </div>
        </form>

        <section id="identity-section" className="card card-pad scroll-mt-6 lg:col-start-2" aria-labelledby="identity-document-title">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--green-tint)] text-[var(--green)]"><FileTextIcon size={19} /></div>
              <div>
                <h2 id="identity-document-title" className="font-bold text-[var(--navy)]">Documento de identidad</h2>
                <p className="mt-1 max-w-xl text-sm leading-relaxed text-[var(--ink-soft)]">Es obligatorio para presentar entrevistas. El reclutador podrá consultarlo para verificar tu identidad junto con el video.</p>
              </div>
            </div>
            <span className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold ${candidateProfile?.identityDocument ? "bg-[var(--green-tint)] text-[var(--green)]" : "bg-[var(--red-tint)] text-[var(--red)]"}`}>
              {candidateProfile?.identityDocument ? "Cargado" : "Pendiente"}
            </span>
          </div>
          {candidateProfile?.identityDocument && !identityFile && (
            <p className="mt-4 flex items-center gap-2 text-sm text-[var(--green)]" role="status">
              <CheckIcon size={16} /> Archivo actual: <strong className="break-all">{candidateProfile.identityDocument.fileName}</strong>
            </p>
          )}
          <form onSubmit={handleIdentityUpload} className="mt-5 rounded-xl border border-dashed border-[var(--line)] bg-[var(--bg)] p-4 sm:p-5">
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <label htmlFor="identity-file" className="btn btn-outline cursor-pointer">{identityFile ? "Cambiar archivo" : candidateProfile?.identityDocument ? "Reemplazar documento" : "Seleccionar documento"}</label>
                <input id="identity-file" className="sr-only" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(event) => setIdentityFile(event.target.files?.[0] ?? null)} disabled={identityUploading} />
                <p className="mt-2 text-xs text-[var(--ink-faint)]">PDF, JPG, PNG o WEBP - Maximo 10 MB</p>
              </div>
              {identityFile && <button type="submit" className="btn btn-primary" disabled={identityUploading}>{identityUploading ? "Subiendo documento..." : "Guardar documento"}</button>}
            </div>
            {identityFile && <p className="mt-3 break-all text-sm font-medium text-[var(--navy)]">{identityFile.name}</p>}
            {identityError && <p className="mt-3 text-sm text-[var(--red)]" role="alert">{identityError}</p>}
            {identityMessage && <p className="mt-3 text-sm text-[var(--green)]" role="status">{identityMessage}</p>}
          </form>
        </section>
      </div>
    </div>
  );
}
