'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeftIcon,
  VideoIcon,
  ArrowRightIcon,
  CheckIcon,
  AlertTriangleIcon
} from '../../../../shared/components/ui/Icons';

type InterviewState = 'active' | 'sending' | 'sent';

export default function EntrevistaActivaPage() {
  const router = useRouter();
  const [state, setState] = useState<InterviewState>('active');

  const handleFinish = () => {
    setState('sending');
    setTimeout(() => {
      setState('sent');
    }, 2200);
  };

  if (state === 'sending') {
    return (
      <div className="center-shell">
        <div className="center-card">
          <div className="spinner" />
          <h3 className="text-lg font-bold mb-2">Enviando tu entrevista…</h3>
          <p className="text-[var(--ink-soft)] text-sm mb-2">
            No cierres ni recargues esta ventana.
          </p>
          <div className="text-xs text-[var(--ink-faint)]">
            Analizando respuestas con IA…
          </div>
        </div>
      </div>
    );
  }

  if (state === 'sent') {
    return (
      <div className="center-shell">
        <div className="center-card">
          <div className="success-check">
            <CheckIcon size={30} />
          </div>
          <h3 className="text-xl font-bold mb-2.5">Tu entrevista fue enviada</h3>
          <p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-6">
            El equipo de Recursos Humanos de DS4B recibirá el análisis de la IA junto con tu grabación y tomará la decisión final. Te avisaremos por aquí cuando haya novedades.
          </p>
          <button
            type="button"
            className="btn btn-primary btn-block py-3"
            onClick={() => router.push('/candidato/entrevistas')}
          >
            Volver a mis entrevistas
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-shell">
      {/* Interview Topbar */}
      <div className="interview-topbar">
        <Link href="/candidato/entrevistas" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon size={16} />
          Salir
        </Link>

        <div className="live-badge">
          <span className="dot" />
          EN VIVO
        </div>

        <div className="q-progress-dots">
          <span className="q-dot done" />
          <span className="q-dot done" />
          <span className="q-dot done" />
          <span className="q-dot now" />
          <span className="q-dot" />
          <span className="q-dot" />
          <span className="q-dot" />
          <span className="q-dot" />
          <span className="q-dot" />
          <span className="q-dot" />
        </div>
      </div>

      {/* Live Warning Notice */}
      <div className="live-notice">
        <span className="shrink-0 mt-0.5">
          <AlertTriangleIcon size={18} />
        </span>
        <div>
          Esta entrevista es <b>en vivo</b>: las preguntas se generan de forma aleatoria según el perfil de la vacante. No es posible editar, pausar ni repetir tus respuestas — al finalizar, se envían directamente a análisis.
        </div>
      </div>

      {/* Main Question Card */}
      <div className="interview-card">
        <div className="interview-webcam">
          <VideoIcon size={22} />
        </div>

        {/* Circular Timer Ring */}
        <svg className="timer-ring mx-auto mb-5.5 block" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--line)"
            strokeWidth="7"
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="var(--purple)"
            strokeWidth="7"
            strokeLinecap="round"
            strokeDasharray="264"
            strokeDashoffset="90"
            transform="rotate(-90 50 50)"
          />
          <text
            x="50"
            y="55"
            textAnchor="middle"
            fontSize="20"
            fontWeight="700"
            fill="var(--ink)"
            fontFamily="Poppins, sans-serif"
          >
            00:42
          </text>
        </svg>

        <div className="q-eyebrow">
          Pregunta 4 de 10 · Caso práctico · Gestión de Proyectos
        </div>

        <div className="q-text">
          Un cliente te informa que el alcance cambió a mitad de sprint y exige que la fecha de entrega se mantenga igual. ¿Cómo manejas esa conversación con el cliente y con tu equipo?
        </div>

        <div className="interview-actions">
          <button
            type="button"
            className="btn btn-accent px-6 py-3"
            onClick={handleFinish}
          >
            Finalizar entrevista
            <ArrowRightIcon size={16} />
          </button>
        </div>

        <p className="text-[var(--ink-faint)] text-xs mt-3.5">
          En una entrevista real, este botón avanzaría a la siguiente pregunta aleatoria hasta completar el proceso.
        </p>
      </div>
    </div>
  );
}
