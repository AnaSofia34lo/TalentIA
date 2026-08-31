'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeftIcon,
  DownloadIcon,
  VideoIcon,
  LogoSparkIcon,
  StarIcon,
  TrendUpIcon,
  AlertTriangleIcon,
  ShieldAlertIcon
} from '../../../../shared/components/ui/Icons';
import { MatchRing } from '../../../../shared/components/ui/MatchRing';

export default function CandidatoPerfilPage() {
  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title flex items-center gap-2 flex-wrap">
            Perfil del candidato
            <span className="badge badge-purple text-xs font-semibold">
              Reporte individual
            </span>
          </h1>
          <p className="page-sub">
            Evaluación integral generada por IA con evidencia trazable.
          </p>
        </div>
        <Link href="/admin/banco" className="btn btn-outline">
          <ArrowLeftIcon size={16} />
          Volver al banco de talentos
        </Link>
      </div>

      {/* Candidate Overview Card */}
      <div className="card card-pad flex items-center gap-6 mb-4.5 flex-wrap">
        <div className="avatar avatar-lg">MT</div>
        <div className="flex-1 min-w-[220px]">
          <h2 className="text-xl font-bold">Mariana Torres</h2>
          <p className="text-[var(--ink-soft)] text-sm my-1 mb-2.5">
            Desarrolladora de Software · Java & Python · 6 años de experiencia
          </p>
          <div className="flex gap-2 flex-wrap">
            <span className="badge badge-navy">Java</span>
            <span className="badge badge-navy">Python</span>
            <span className="badge badge-navy">Levantamiento de requisitos</span>
            <span className="badge badge-navy">Delimitación de alcance</span>
          </div>
        </div>

        <MatchRing percentage={95} size={112} showLabel={true} />

        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <button type="button" className="btn btn-primary">
            <DownloadIcon size={16} />
            Descargar CV
          </button>
          <Link
            href="/admin/candidatos/mariana-torres/video"
            className="btn btn-outline"
          >
            <VideoIcon size={18} />
            Ver entrevista
          </Link>
        </div>
      </div>

      {/* Competencies Progress Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4.5 mb-4.5">
        <div className="card card-pad">
          <h3 className="text-base font-bold mb-4">Competencias técnicas</h3>
          <div className="skill-row">
            <div className="skill-top">
              <span>Java</span>
              <b>92%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '92%', background: 'var(--navy)' }} />
            </div>
          </div>
          <div className="skill-row">
            <div className="skill-top">
              <span>Python</span>
              <b>88%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '88%', background: 'var(--navy)' }} />
            </div>
          </div>
          <div className="skill-row">
            <div className="skill-top">
              <span>Levantamiento de requisitos</span>
              <b>95%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '95%', background: 'var(--navy)' }} />
            </div>
          </div>
          <div className="skill-row mb-0">
            <div className="skill-top">
              <span>Delimitación de alcance</span>
              <b>91%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '91%', background: 'var(--navy)' }} />
            </div>
          </div>
        </div>

        <div className="card card-pad">
          <h3 className="text-base font-bold mb-4">Competencias blandas</h3>
          <div className="skill-row">
            <div className="skill-top">
              <span>Comunicación técnica</span>
              <b>90%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '90%', background: 'var(--purple)' }} />
            </div>
          </div>
          <div className="skill-row">
            <div className="skill-top">
              <span>Autonomía</span>
              <b>86%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '86%', background: 'var(--purple)' }} />
            </div>
          </div>
          <div className="skill-row">
            <div className="skill-top">
              <span>Trabajo en equipo</span>
              <b>94%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '94%', background: 'var(--purple)' }} />
            </div>
          </div>
          <div className="skill-row mb-0">
            <div className="skill-top">
              <span>Pensamiento analítico</span>
              <b>89%</b>
            </div>
            <div className="skill-track">
              <div className="skill-fill" style={{ width: '89%', background: 'var(--purple)' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Matriz DOFA */}
      <div className="card card-pad mb-4.5">
        <h3 className="text-base font-bold mb-4">Matriz DOFA</h3>
        <div className="dofa-grid">
          <div className="dofa-card" style={{ background: 'var(--green-tint)', borderColor: '#d3f0e2' }}>
            <div className="dofa-head" style={{ color: 'var(--green)' }}>
              <div className="dofa-icon bg-white">
                <StarIcon size={17} />
              </div>
              Fortalezas
            </div>
            <ul>
              <li>Dominio sólido de arquitecturas backend escalables</li>
              <li>Excelente comunicación técnica con equipos no técnicos</li>
              <li>Historial consistente de liderazgo de proyectos</li>
            </ul>
          </div>

          <div className="dofa-card" style={{ background: 'var(--info-tint)', borderColor: '#d7e6fd' }}>
            <div className="dofa-head" style={{ color: 'var(--info)' }}>
              <div className="dofa-icon bg-white">
                <TrendUpIcon size={14} />
              </div>
              Oportunidades
            </div>
            <ul>
              <li>Podría profundizar en arquitecturas cloud-native (Kubernetes)</li>
              <li>Potencial para roles de mentoría técnica formal</li>
            </ul>
          </div>

          <div className="dofa-card" style={{ background: 'var(--amber-tint)', borderColor: '#f6e3bf' }}>
            <div className="dofa-head" style={{ color: 'var(--amber)' }}>
              <div className="dofa-icon bg-white">
                <AlertTriangleIcon size={17} />
              </div>
              Debilidades
            </div>
            <ul>
              <li>Experiencia limitada en entornos de alta regulación</li>
              <li>Poca exposición a equipos completamente distribuidos</li>
            </ul>
          </div>

          <div className="dofa-card" style={{ background: 'var(--red-tint)', borderColor: '#f7d3d3' }}>
            <div className="dofa-head" style={{ color: 'var(--red)' }}>
              <div className="dofa-icon bg-white">
                <ShieldAlertIcon size={17} />
              </div>
              Riesgos
            </div>
            <ul>
              <li>Alta demanda en el mercado: riesgo de contraoferta</li>
              <li>Expectativa salarial en el rango superior de la banda</li>
            </ul>
          </div>
        </div>
      </div>

      {/* AI Recommendation */}
      <div className="ai-box mb-4.5">
        <div className="ai-icon">
          <LogoSparkIcon size={18} />
        </div>
        <div>
          <h4 className="font-bold text-sm mb-1.5">Recomendación de la IA</h4>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed">
            Mariana demuestra, con evidencia concreta de su entrevista, que sabe delimitar un requerimiento antes de programarlo — no solo lo dice en su CV. Su dominio de Java y Python es sólido y consistente a lo largo de toda la evaluación. Se recomienda que el equipo técnico de DS4B avance con ella a la siguiente etapa.
          </p>
          <div className="disclaimer">
            Esta recomendación es un apoyo al proceso y no reemplaza la decisión humana.
          </div>
        </div>
      </div>

      {/* Evidence Breakdown */}
      <div className="card card-pad">
        <h3 className="text-base font-bold mb-1">Evidencia por competencia</h3>
        <p className="text-[var(--ink-faint)] text-xs mb-3">
          Cada calificación está respaldada por momentos específicos de la entrevista.
        </p>

        <div className="evidence-row">
          <div>
            <b className="text-sm">Pensamiento analítico</b>
            <div className="text-[var(--ink-soft)] text-xs mt-0.5">
              Estructuró el problema en pasos claros antes de proponer una solución.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-green">89%</span>
            <Link
              href="/admin/candidatos/mariana-torres/video"
              className="btn btn-ghost btn-sm"
            >
              Ver evidencia
            </Link>
          </div>
        </div>

        <div className="evidence-row">
          <div>
            <b className="text-sm">Comunicación</b>
            <div className="text-[var(--ink-soft)] text-xs mt-0.5">
              Explicó conceptos técnicos complejos en términos simples.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-green">90%</span>
            <Link
              href="/admin/candidatos/mariana-torres/video"
              className="btn btn-ghost btn-sm"
            >
              Ver evidencia
            </Link>
          </div>
        </div>

        <div className="evidence-row">
          <div>
            <b className="text-sm">Liderazgo</b>
            <div className="text-[var(--ink-soft)] text-xs mt-0.5">
              Describió cómo guió a un compañero júnior en un caso real.
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="badge badge-amber">86%</span>
            <Link
              href="/admin/candidatos/mariana-torres/video"
              className="btn btn-ghost btn-sm"
            >
              Ver evidencia
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
