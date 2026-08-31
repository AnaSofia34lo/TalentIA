'use client';

import React, { useState } from 'react';
import { FileTextIcon, DownloadIcon, PlusIcon, CheckIcon } from '../../../shared/components/ui/Icons';

export default function CandidatoCvPage() {
  const [saved, setSaved] = useState(false);
  const [fileName, setFileName] = useState('CV_Camila_Restrepo.pdf');
  const [fileDate, setFileDate] = useState('12 jul 2026');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      setFileDate('Hoy');
    }
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mi hoja de vida</h1>
          <p className="page-sub">
            Mantén tu perfil actualizado para mejorar tu compatibilidad con las vacantes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4.5 items-start">
        {/* Left Form */}
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-4">Experiencia profesional</h3>
          <form onSubmit={handleSave} className="flex flex-col gap-3.5">
            <div className="field">
              <label>Cargo actual o principal</label>
              <input className="input" defaultValue="Diseñadora UX/UI" />
            </div>

            <div className="field">
              <label>Empresa</label>
              <input className="input" defaultValue="Estudio Croma" />
            </div>

            <div className="field">
              <label>Años de experiencia</label>
              <input className="input" defaultValue="4 años" />
            </div>

            <div className="field">
              <label>Resumen profesional</label>
              <textarea
                className="input"
                rows={4}
                defaultValue="Diseñadora UX/UI con experiencia liderando proyectos de investigación de usuarios y sistemas de diseño para productos digitales B2B."
              />
            </div>

            <div className="flex items-center gap-3 mt-2">
              <button type="submit" className="btn btn-primary">
                Guardar cambios
              </button>
              {saved && (
                <span className="text-xs font-semibold text-[var(--green)] flex items-center gap-1.5">
                  <CheckIcon size={16} /> Hoja de vida actualizada
                </span>
              )}
            </div>
          </form>
        </div>

        {/* Right CV File Upload Card */}
        <div className="card card-pad text-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3.5"
            style={{ background: 'var(--navy-tint)', color: 'var(--navy)' }}
          >
            <FileTextIcon size={24} />
          </div>

          <h3 className="text-sm font-bold mb-1">{fileName}</h3>
          <p className="text-[var(--ink-faint)] text-xs mb-4">
            Subido el {fileDate} · 480 KB
          </p>

          <button type="button" className="btn btn-outline btn-block mb-2">
            <DownloadIcon size={16} />
            Descargar
          </button>

          <label className="btn btn-primary btn-block cursor-pointer">
            <PlusIcon size={16} />
            Reemplazar archivo
            <input
              type="file"
              accept=".pdf,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        </div>
      </div>
    </div>
  );
}
