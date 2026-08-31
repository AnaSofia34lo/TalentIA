import React from 'react';
import Link from 'next/link';
import {
  BriefcaseIcon,
  VideoIcon,
  AwardIcon,
  PlusIcon,
  TrendUpIcon,
  TrendDownIcon,
  UserIcon
} from '../../../shared/components/ui/Icons';

export default function AdminDashboardPage() {
  return (
    <div>
      {/* Page Header */}
      <div className="page-head">
        <div>
          <h1 className="page-title">Buenos días, Ana 👋</h1>
          <p className="page-sub">
            Esto es lo que está pasando en tus procesos de selección hoy.
          </p>
        </div>
        <Link href="/admin/vacantes/crear" className="btn btn-accent">
          <PlusIcon size={16} />
          Nueva Vacante
        </Link>
      </div>

      {/* Hero DS4B Banner */}
      <div
        className="card relative overflow-hidden text-white p-8 md:p-9 mb-6 border-0"
        style={{ background: 'var(--grad-brand)' }}
      >
        <div
          className="absolute w-[260px] h-[260px] rounded-full -top-[100px] -right-[60px] pointer-events-none"
          style={{ background: 'rgba(255, 255, 255, 0.08)' }}
        />

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
          <div className="max-w-[640px]">
            <span
              className="badge mb-3.5 inline-flex items-center"
              style={{ background: 'rgba(255, 255, 255, 0.16)', color: '#fff' }}
            >
              <span className="badge-dot" />
              TalentIA para DS4B — Digital Solution for Business
            </span>
            <h2 className="text-white text-xl md:text-2xl font-bold leading-snug mb-2.5">
              Selección de talento impulsada por IA, hecha a la medida de DS4B
            </h2>
            <p className="text-white/80 text-sm leading-relaxed">
              TalentIA analiza hojas de vida, conduce entrevistas en vivo y evalúa aptitudes reales — no solo experiencia — para los 4 perfiles clave que DS4B contrata de forma continua: Desarrollo de Software, Datos e IA, Levantamiento de Requisitos y Gestión de Proyectos. La IA acelera el análisis; la decisión final siempre es de tu equipo de Recursos Humanos.
            </p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 px-5 min-w-[120px]">
              <div className="text-white text-2xl font-extrabold font-['Poppins']">4</div>
              <div className="text-white/75 text-xs">Perfiles activos</div>
            </div>
            <div className="bg-white/10 border border-white/20 rounded-2xl p-3.5 px-5 min-w-[120px]">
              <div className="text-white text-2xl font-extrabold font-['Poppins']">97</div>
              <div className="text-white/75 text-xs">Postulantes activos</div>
            </div>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="kpi-grid">
        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'var(--navy-tint)', color: 'var(--navy)' }}>
              <BriefcaseIcon size={18} />
            </div>
            <span className="kpi-trend" style={{ color: 'var(--green)' }}>
              <TrendUpIcon size={14} /> 12%
            </span>
          </div>
          <div className="kpi-value">4</div>
          <div className="kpi-label">Perfiles activos</div>
        </div>

        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'var(--purple-tint)', color: 'var(--purple)' }}>
              <UserIcon size={18} />
            </div>
            <span className="kpi-trend" style={{ color: 'var(--green)' }}>
              <TrendUpIcon size={14} /> 8%
            </span>
          </div>
          <div className="kpi-value">97</div>
          <div className="kpi-label">Postulantes totales</div>
        </div>

        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'var(--info-tint)', color: 'var(--info)' }}>
              <VideoIcon size={18} />
            </div>
            <span className="kpi-trend" style={{ color: 'var(--green)' }}>
              <TrendUpIcon size={14} /> 24%
            </span>
          </div>
          <div className="kpi-value">61</div>
          <div className="kpi-label">Entrevistas en vivo realizadas</div>
        </div>

        <div className="card kpi-card card-hover">
          <div className="kpi-top">
            <div className="kpi-icon" style={{ background: 'var(--green-tint)', color: 'var(--green)' }}>
              <AwardIcon size={18} />
            </div>
            <span className="kpi-trend" style={{ color: 'var(--red)' }}>
              <TrendDownIcon size={14} /> 3%
            </span>
          </div>
          <div className="kpi-value">79%</div>
          <div className="kpi-label">Compatibilidad promedio</div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] gap-4.5 mb-4.5">
        <div className="card chart-card">
          <h3 className="chart-title">Postulaciones por vacante</h3>
          <div className="chart-sub">Últimos 30 días</div>
          <div className="bars">
            <div className="bar-col">
              <span className="bar-value">34</span>
              <div className="bar" style={{ height: '100%' }} />
              <span className="bar-label">Desarrollo<br />de Software</span>
            </div>
            <div className="bar-col">
              <span className="bar-value">27</span>
              <div className="bar" style={{ height: '79%' }} />
              <span className="bar-label">Levant. de<br />Requisitos</span>
            </div>
            <div className="bar-col">
              <span className="bar-value">21</span>
              <div className="bar" style={{ height: '62%' }} />
              <span className="bar-label">Datos<br />e IA</span>
            </div>
            <div className="bar-col">
              <span className="bar-value">15</span>
              <div className="bar" style={{ height: '44%' }} />
              <span className="bar-label">Gestión de<br />Proyectos</span>
            </div>
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="chart-title">Estado de candidatos</h3>
          <div className="chart-sub">Pipeline actual</div>
          <div className="donut-wrap flex-col sm:flex-row items-center justify-around">
            <div
              className="donut"
              style={{
                background: 'conic-gradient(var(--navy) 0 45%, var(--purple) 45% 70%, var(--green) 70% 88%, var(--red) 88% 100%)'
              }}
            >
              <div className="donut-center">
                <b>97</b>
                <span>Total</span>
              </div>
            </div>
            <div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--navy)' }} />
                En evaluación (45%)
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--purple)' }} />
                Entrevista agendada (25%)
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--green)' }} />
                Aprobados (18%)
              </div>
              <div className="legend-item">
                <span className="legend-dot" style={{ background: 'var(--red)' }} />
                Descartados (12%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4.5">
        <div className="card chart-card">
          <h3 className="chart-title">Competencias más frecuentes</h3>
          <div className="chart-sub">Detectadas en hojas de vida analizadas</div>
          <div className="hbar-row">
            <span className="hbar-label">Levantamiento de requisitos</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: '92%' }} />
            </div>
            <span className="hbar-pct">92%</span>
          </div>
          <div className="hbar-row">
            <span className="hbar-label">Java / Python</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: '85%' }} />
            </div>
            <span className="hbar-pct">85%</span>
          </div>
          <div className="hbar-row">
            <span className="hbar-label">Pensamiento analítico</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: '78%' }} />
            </div>
            <span className="hbar-pct">78%</span>
          </div>
          <div className="hbar-row">
            <span className="hbar-label">Metodologías ágiles</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: '66%' }} />
            </div>
            <span className="hbar-pct">66%</span>
          </div>
          <div className="hbar-row mb-0">
            <span className="hbar-label">Analítica con IA</span>
            <div className="hbar-track">
              <div className="hbar-fill" style={{ width: '58%' }} />
            </div>
            <span className="hbar-pct">58%</span>
          </div>
        </div>

        <div className="card chart-card">
          <h3 className="chart-title">Tiempo promedio de evaluación</h3>
          <div className="chart-sub">Días desde postulación hasta decisión</div>
          <div className="flex items-center justify-between gap-6 mt-2">
            <div>
              <div className="text-4xl font-extrabold font-['Poppins'] text-[var(--navy)]">
                3.2
                <span className="text-base text-[var(--ink-faint)] font-semibold ml-1">
                  días
                </span>
              </div>
              <div className="badge badge-green mt-2">
                <TrendUpIcon size={14} /> 18% más rápido
              </div>
            </div>

            <svg viewBox="0 0 220 80" className="w-[200px] h-[75px]">
              <polyline
                points="0,60 30,55 60,50 90,42 120,38 150,25 180,20 220,15"
                fill="none"
                stroke="var(--purple)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <polyline
                points="0,60 30,55 60,50 90,42 120,38 150,25 180,20 220,15 220,80 0,80"
                fill="url(#sparkFill)"
                opacity="0.25"
                stroke="none"
              />
              <defs>
                <linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1">
                  <stop stopColor="#6C63FF" />
                  <stop offset="1" stopColor="#6C63FF" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
