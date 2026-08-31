'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeftIcon, LogoSparkIcon, CheckIcon } from '../../../../shared/components/ui/Icons';

export default function CrearVacantePage() {
  const router = useRouter();
  const [techSkills, setTechSkills] = useState([
    'Java',
    'Python',
    'Levantamiento de requisitos',
    'Delimitación de alcance'
  ]);
  const [softSkills, setSoftSkills] = useState([
    'Autonomía',
    'Pensamiento analítico',
    'Comunicación técnica'
  ]);
  const [techInput, setTechInput] = useState('');
  const [softInput, setSoftInput] = useState('');
  const [aiGenerated, setAiGenerated] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleAddTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && techInput.trim()) {
      e.preventDefault();
      if (!techSkills.includes(techInput.trim())) {
        setTechSkills([...techSkills, techInput.trim()]);
      }
      setTechInput('');
    }
  };

  const handleRemoveTech = (skill: string) => {
    setTechSkills(techSkills.filter((s) => s !== skill));
  };

  const handleAddSoft = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && softInput.trim()) {
      e.preventDefault();
      if (!softSkills.includes(softInput.trim())) {
        setSoftSkills([...softSkills, softInput.trim()]);
      }
      setSoftInput('');
    }
  };

  const handleRemoveSoft = (skill: string) => {
    setSoftSkills(softSkills.filter((s) => s !== skill));
  };

  const handleGenerateAI = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      setAiGenerated(true);
    }, 600);
  };

  const handlePublish = () => {
    router.push('/admin/vacantes');
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Nueva vacante</h1>
          <p className="page-sub">
            Completa la información y deja que la IA construya la entrevista por ti.
          </p>
        </div>
        <Link href="/admin/vacantes" className="btn btn-ghost">
          <ArrowLeftIcon size={16} />
          Volver
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-5 items-start">
        {/* Left Form Content */}
        <div className="flex flex-col gap-4.5">
          <div className="card card-pad">
            <h3 className="text-base font-bold mb-4">Información general</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="field">
                <label>Cargo</label>
                <input
                  className="input"
                  placeholder="Ej. Desarrollador de Software"
                  defaultValue="Desarrollador de Software (Java & Python)"
                />
              </div>
              <div className="field">
                <label>Área</label>
                <input
                  className="input"
                  placeholder="Ej. Tecnología"
                  defaultValue="Tecnología · DS4B"
                />
              </div>
              <div className="field">
                <label>Nivel</label>
                <select className="input" defaultValue="Senior">
                  <option>Junior</option>
                  <option>Semi-senior</option>
                  <option>Senior</option>
                  <option>Líder / Gerencial</option>
                </select>
              </div>
              <div className="field">
                <label>Modalidad</label>
                <select className="input" defaultValue="Híbrido">
                  <option>Remoto</option>
                  <option>Híbrido</option>
                  <option>Presencial</option>
                </select>
              </div>
            </div>
          </div>

          <div className="card card-pad">
            <h3 className="text-base font-bold mb-4">Competencias técnicas</h3>
            <div className="flex flex-wrap gap-2 mb-3.5">
              {techSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleRemoveTech(skill)}
                  className="chip active cursor-pointer"
                >
                  {skill} ✕
                </button>
              ))}
            </div>
            <input
              className="input"
              value={techInput}
              onChange={(e) => setTechInput(e.target.value)}
              onKeyDown={handleAddTech}
              placeholder="Agregar competencia técnica y presionar Enter..."
            />
          </div>

          <div className="card card-pad">
            <h3 className="text-base font-bold mb-4">Competencias blandas</h3>
            <div className="flex flex-wrap gap-2 mb-3.5">
              {softSkills.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => handleRemoveSoft(skill)}
                  className="chip active cursor-pointer"
                >
                  {skill} ✕
                </button>
              ))}
            </div>
            <input
              className="input"
              value={softInput}
              onChange={(e) => setSoftInput(e.target.value)}
              onKeyDown={handleAddSoft}
              placeholder="Agregar competencia blanda y presionar Enter..."
            />
          </div>

          <div className="card card-pad">
            <h3 className="text-base font-bold mb-4">Descripción y casos de uso</h3>
            <div className="field mb-3.5">
              <label>Descripción del cargo</label>
              <textarea
                className="input"
                rows={4}
                defaultValue="Buscamos una persona con dominio de Java y Python que participe activamente en el levantamiento de requisitos: que sepa entender lo que se le pide, delimitar el alcance real y ejecutarlo. Evaluamos aptitud demostrada, no solo experiencia listada en el CV."
              />
            </div>
            <div className="field">
              <label>Casos de uso a evaluar</label>
              <textarea
                className="input"
                rows={3}
                defaultValue="Delimitar el alcance de un requerimiento ambiguo del cliente; identificar qué preguntas hacer antes de programar; resolver un cuello de botella técnico ya en ejecución."
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar Widget */}
        <div className="flex flex-col gap-4.5 sticky top-[86px]">
          <div className="card card-pad text-center">
            <div
              className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center text-white mx-auto mb-3.5"
              style={{
                background: 'var(--grad-brand)',
                boxShadow: '0 8px 18px rgba(108,99,255,.3)'
              }}
            >
              <LogoSparkIcon size={20} />
            </div>
            <h3 className="text-base font-bold mb-2">Entrevista con IA</h3>
            <p className="text-[var(--ink-soft)] text-xs mb-4.5 leading-relaxed">
              Genera automáticamente preguntas técnicas, comportamentales y casos prácticos según el perfil de la vacante.
            </p>

            <button
              type="button"
              className="btn btn-accent btn-block"
              onClick={handleGenerateAI}
              disabled={isGenerating}
            >
              <LogoSparkIcon size={16} />
              {isGenerating ? 'Generando preguntas…' : 'Generar entrevista con IA'}
            </button>

            {aiGenerated && (
              <div className="mt-3.5 text-left text-xs bg-[var(--green-tint)] text-[var(--green)] p-2.5 px-3 rounded-xl flex items-center gap-2 font-medium">
                <CheckIcon size={16} />
                12 preguntas generadas correctamente
              </div>
            )}
          </div>

          {aiGenerated && (
            <div className="card card-pad">
              <h3 className="text-sm font-bold mb-3">
                Preguntas generadas{' '}
                <span className="text-[var(--ink-faint)] font-normal text-xs">
                  (editables)
                </span>
              </h3>
              <div className="flex flex-col gap-2.5 text-xs">
                <div className="p-2.5 px-3 bg-[var(--bg)] rounded-xl">
                  <span className="badge badge-navy mb-1.5 inline-block">Técnica</span>
                  <p className="text-[var(--ink)]">
                    ¿Cómo diseñarías una API REST para soportar 10x el tráfico actual?
                  </p>
                </div>
                <div className="p-2.5 px-3 bg-[var(--bg)] rounded-xl">
                  <span className="badge badge-purple mb-1.5 inline-block">Comportamental</span>
                  <p className="text-[var(--ink)]">
                    Cuéntame de una vez que tuviste que dar una noticia difícil a tu equipo.
                  </p>
                </div>
                <div className="p-2.5 px-3 bg-[var(--bg)] rounded-xl">
                  <span className="badge badge-amber mb-1.5 inline-block">Caso práctico</span>
                  <p className="text-[var(--ink)]">
                    Un servicio crítico empieza a fallar en producción. ¿Cuáles son tus primeros 3 pasos?
                  </p>
                </div>
              </div>
            </div>
          )}

          <button
            type="button"
            className="btn btn-primary btn-block py-3"
            onClick={handlePublish}
          >
            <CheckIcon size={16} />
            Publicar vacante
          </button>
        </div>
      </div>
    </div>
  );
}
