'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, PlayIcon } from '../../../../../shared/components/ui/Icons';
import {
  RecruiterInterviewReviewResponse,
  useAuth,
} from '../../../../../shared/context/AuthContext';

function formatMs(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60)
    .toString()
    .padStart(2, '0');
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function formatInterviewDate(date: string | null) {
  if (!date) return 'Fecha no disponible';
  const parsed = new Date(date);
  return Number.isNaN(parsed.getTime())
    ? 'Fecha no disponible'
    : new Intl.DateTimeFormat('es-CO', {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(parsed);
}

export default function CandidatoVideoPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const candidateId = params.id;
  const applicationId = searchParams.get('applicationId');
  const origin = searchParams.get('from') === 'reportes' ? 'reportes' : 'talentos';
  const interviewIdParam = searchParams.get('interviewId');
  const interviewTypeParam = searchParams.get('interviewType');
  const interviewType: 'technical' | 'behavioral' =
    interviewTypeParam === 'technical' ? 'technical' : 'behavioral';
  const markerId = searchParams.get('markerId');
  const answerId = searchParams.get('answerId');
  const tParam = searchParams.get('t');

  const { getRecruiterInterviewReview } = useAuth();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [review, setReview] = useState<RecruiterInterviewReviewResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeMarkerId, setActiveMarkerId] = useState<string | null>(markerId);
  const [activeAnswerId, setActiveAnswerId] = useState<string | null>(answerId);

  useEffect(() => {
    if (!applicationId) {
      setError(
        'Falta applicationId. Abre la entrevista desde el perfil del candidato o desde una evidencia.',
      );
      setLoading(false);
      return;
    }
    let active = true;
    void getRecruiterInterviewReview(applicationId, interviewType)
      .then((data) => {
        if (!active) return;
        setReview(data);
      })
      .catch((requestError) => {
        if (active) {
          setError(
            requestError instanceof Error
              ? requestError.message
              : 'No fue posible cargar la entrevista.',
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId, interviewType]);

  const interviews = review?.interviews?.length
    ? review.interviews
    : review?.interview
      ? [review.interview]
      : [];
  const interview = interviewIdParam
    ? interviews.find((item) => item.id === interviewIdParam) ?? review?.interview ?? null
    : review?.interview ?? interviews[0] ?? null;
  const markers = interview?.markers ?? [];
  const answers = interview?.answers ?? [];

  const selectedAnswer = useMemo(
    () => answers.find((item) => item.id === activeAnswerId) ?? answers[0] ?? null,
    [answers, activeAnswerId],
  );

  useEffect(() => {
    if (interviewType !== 'behavioral') return;
    const video = videoRef.current;
    if (!video || !interview?.videoDownloadUrl) return;

    const seekSeconds = tParam
      ? Number(tParam)
      : markerId
        ? Math.floor(
            (markers.find((item) => item.id === markerId)?.timestampMs ?? 0) /
              1000,
          )
        : null;

    if (seekSeconds == null || Number.isNaN(seekSeconds)) return;

    const onLoaded = () => {
      video.currentTime = Math.max(0, seekSeconds);
    };
    video.addEventListener('loadedmetadata', onLoaded);
    if (video.readyState >= 1) onLoaded();
    return () => video.removeEventListener('loadedmetadata', onLoaded);
  }, [interviewType, interview, markerId, markers, tParam]);

  const profileHref = applicationId
    ? `/admin/candidatos/${candidateId}?applicationId=${encodeURIComponent(applicationId)}&from=${origin}`
    : '/admin/reportes';
  const interviewAttemptHref = (id: string) =>
    `/admin/candidatos/${candidateId}/video?applicationId=${encodeURIComponent(applicationId ?? '')}&from=${origin}&interviewType=${interviewType}&interviewId=${encodeURIComponent(id)}`;

  if (loading) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <div className="spinner" />
          <h3 className="text-lg font-bold">Cargando entrevista…</h3>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            {interviewType === 'technical'
              ? 'Se recuperan las respuestas técnicas ya guardadas.'
              : 'Se recupera el video y las respuestas ya guardadas (sin Gemini).'}
          </p>
        </div>
      </div>
    );
  }

  if (error || !review) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <h3 className="text-lg font-bold mb-2">No se pudo cargar la entrevista</h3>
          <p className="text-[var(--red)] text-sm">{error}</p>
          <Link href={profileHref} className="btn btn-outline mt-5">
            Volver al perfil
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">
            Entrevista — {review.candidate.fullName}
          </h1>
          <p className="page-sub">
            {review.vacancy.title} ·{' '}
            {interviewType === 'technical'
              ? 'Entrevista técnica'
              : 'Entrevista por video (habilidades blandas)'}
          </p>
        </div>
        <Link href={profileHref} className="btn btn-outline">
          <ArrowLeftIcon size={16} />
          Volver al perfil
        </Link>
      </div>

      {interviews.length > 1 && (
        <section className="card card-pad mb-4.5" aria-label="Historial de intentos de entrevista">
          <h2 className="mb-3 text-sm font-bold">Historial de intentos de esta postulación</h2>
          <div className="flex flex-wrap gap-2">
            {interviews.map((attempt, index) => (
              <Link
                key={attempt.id}
                href={interviewAttemptHref(attempt.id)}
                className={`rounded-xl border px-3 py-2 text-sm ${
                  interview?.id === attempt.id
                    ? 'border-[var(--navy)] bg-[var(--navy-tint)] text-[var(--navy)]'
                    : 'border-[var(--line)] text-[var(--ink-soft)]'
                }`}
              >
                <span className="font-semibold">Intento {interviews.length - index}</span>
                {index === 0 && <span className="ml-2 text-xs font-semibold">Más reciente</span>}
                <span className="mt-1 block text-xs">
                  {formatInterviewDate(attempt.startedAt ?? attempt.createdAt)}
                  {' · '}{attempt.status === 'completed' ? 'Completada' : attempt.status === 'in_progress' ? 'En curso' : attempt.status === 'canceled' ? 'Cancelada' : 'Programada'}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {!interview ? (
        <div className="card card-pad text-sm text-[var(--ink-soft)]">
          Esta postulación aún no tiene una entrevista {interviewType} registrada.
        </div>
      ) : (
        <div
          className={
            interviewType === 'technical'
              ? 'grid grid-cols-1 gap-4.5'
              : 'grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4.5 items-start'
          }
        >
          {interviewType === 'behavioral' && (
            <div>
            {interview.videoDownloadUrl ? (
              <div className="card card-pad overflow-hidden p-0">
                <video
                  ref={videoRef}
                  className="w-full bg-black aspect-video"
                  controls
                  src={interview.videoDownloadUrl}
                  preload="metadata"
                />
              </div>
            ) : (
              <div className="video-player">
                <div className="play-btn" aria-hidden>
                  <PlayIcon size={26} />
                </div>
                <p className="absolute bottom-4 left-4 right-4 text-white text-sm">
                  No hay video firmado disponible para esta entrevista.
                </p>
              </div>
            )}

            {markers.length > 0 ? (
              <div className="card card-pad mt-4.5">
                <h3 className="text-sm font-bold mb-3.5">Timeline (marcadores reales)</h3>
                <div className="flex flex-col gap-1">
                  {markers.map((marker) => (
                    <button
                      key={marker.id}
                      type="button"
                      className={`tl-item text-left ${activeMarkerId === marker.id ? 'current' : ''}`}
                      onClick={() => {
                        setActiveMarkerId(marker.id);
                        const video = videoRef.current;
                        if (video) {
                          video.currentTime = Math.max(
                            0,
                            marker.timestampMs / 1000,
                          );
                          void video.play().catch(() => undefined);
                        }
                      }}
                    >
                      <span className="tl-time">{formatMs(marker.timestampMs)}</span>
                      <span className="tl-dot" />
                      <span className="tl-label">
                        {marker.question.category || 'Pregunta'} ·{' '}
                        {marker.question.prompt.slice(0, 80)}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            </div>
          )}

          <div className="card card-pad">
            <h3 className="text-sm font-bold mb-2.5">
              {interviewType === 'technical'
                ? 'Respuestas técnicas'
                : 'Preguntas / evidencias blandas'}
            </h3>

            {interviewType === 'technical' ? (
              answers.length === 0 ? (
                <p className="text-sm text-[var(--ink-soft)]">
                  No hay respuestas técnicas guardadas.
                </p>
              ) : (
                <div className="flex flex-col gap-3">
                  {answers.map((answer) => (
                    <button
                      key={answer.id}
                      type="button"
                      className={`text-left rounded-xl border p-3 ${
                        selectedAnswer?.id === answer.id
                          ? 'border-[var(--purple)] bg-[var(--purple-tint)]'
                          : 'border-[var(--line)]'
                      }`}
                      onClick={() => setActiveAnswerId(answer.id)}
                    >
                      <p className="text-xs font-bold text-[var(--navy)] mb-1">
                        {answer.question.category || 'Técnica'}
                      </p>
                      <p className="text-sm font-semibold mb-1">
                        {answer.question.prompt}
                      </p>
                      <p className="text-sm text-[var(--ink-soft)] leading-relaxed">
                        {answer.responseText || 'Sin respuesta registrada.'}
                      </p>
                    </button>
                  ))}
                </div>
              )
            ) : markers.length === 0 && !interview.videoDownloadUrl ? (
              <p className="text-sm text-[var(--ink-soft)]">
                No hay marcadores ni video para esta entrevista conductual.
              </p>
            ) : (
              <div className="flex flex-col gap-3">
                {(markers.length ? markers : interview.questions).map((item) => {
                  const isMarker = 'timestampMs' in item;
                  const question = isMarker ? item.question : item;
                  const key = isMarker ? item.id : item.id;
                  return (
                    <div
                      key={key}
                      className="rounded-xl border border-[var(--line)] p-3"
                    >
                      <p className="text-xs font-bold text-[var(--navy)] mb-1">
                        {question.category || 'Blanda'}
                        {isMarker ? ` · ${formatMs(item.timestampMs)}` : ''}
                      </p>
                      <p className="text-sm text-[var(--ink)] leading-relaxed">
                        {question.prompt}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
