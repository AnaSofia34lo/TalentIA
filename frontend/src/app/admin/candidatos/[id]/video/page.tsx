'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeftIcon, PlayIcon, QuestionIcon } from '../../../../../shared/components/ui/Icons';

interface TimelineChapter {
  time: string;
  label: string;
}

const CHAPTERS: TimelineChapter[] = [
  { time: '00:00', label: 'Presentación' },
  { time: '02:40', label: 'Caso práctico' },
  { time: '07:15', label: 'Comunicación' },
  { time: '11:50', label: 'Liderazgo' },
  { time: '15:20', label: 'Cierre e IA' }
];

export default function CandidatoVideoPage() {
  const [currentChapter, setCurrentChapter] = useState('07:15');
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Entrevista — Mariana Torres</h1>
          <p className="page-sub">Desarrolladora Full Stack Senior · 18 min 42 s</p>
        </div>
        <Link href="/admin/candidatos/mariana-torres" className="btn btn-outline">
          <ArrowLeftIcon size={16} />
          Volver al perfil
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4.5 items-start">
        {/* Left Video Player & Smart Timeline */}
        <div>
          <div className="video-player">
            <button
              type="button"
              className="play-btn"
              onClick={() => setIsPlaying(!isPlaying)}
              aria-label={isPlaying ? 'Pausar video' : 'Reproducir video'}
            >
              <PlayIcon size={26} />
            </button>
            <div className="video-controls">
              <span className="video-time">{currentChapter}</span>
              <div className="video-progress">
                <div className="fill" />
              </div>
              <span className="video-time">18:42</span>
            </div>
          </div>

          <div className="card card-pad mt-4.5">
            <h3 className="text-sm font-bold mb-3.5">Timeline inteligente</h3>
            <div className="flex flex-col gap-1">
              {CHAPTERS.map((ch) => (
                <div
                  key={ch.time}
                  className={`tl-item ${currentChapter === ch.time ? 'current' : ''}`}
                  onClick={() => setCurrentChapter(ch.time)}
                >
                  <span className="tl-time">{ch.time}</span>
                  <span className="tl-dot" />
                  <span className="tl-label">{ch.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right AI Transcription */}
        <div className="card card-pad">
          <h3 className="text-sm font-bold mb-2.5">Transcripción con IA</h3>
          <div className="transcript-item">
            <div className="transcript-q">
              <QuestionIcon size={15} />
              <span>¿Cómo explicarías una arquitectura de microservicios a alguien de negocio?</span>
            </div>
            <div className="transcript-a">
              &ldquo;Lo comparo con un restaurante: cada estación de cocina hace una sola cosa muy bien, y se coordinan entre sí. Si una estación falla, las demás siguen funcionando.&rdquo;
            </div>
          </div>

          <div className="transcript-item">
            <div className="transcript-q">
              <QuestionIcon size={15} />
              <span>Cuéntame de un momento en que tuviste que ayudar a un compañero junior.</span>
            </div>
            <div className="transcript-a">
              Describió un proceso de mentoría estructurado de 3 semanas con revisiones de código diarias y objetivos claros de aprendizaje.
            </div>
          </div>

          <div className="transcript-item">
            <div className="transcript-q">
              <QuestionIcon size={15} />
              <span>¿Qué harías si un servicio crítico falla en producción?</span>
            </div>
            <div className="transcript-a">
              Priorizó comunicación inmediata al equipo, rollback seguro y análisis de causa raíz antes de una solución definitiva.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
