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

export default function CandidatoVideoPage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const candidateId = params.id;
  const applicationId = searchParams.get('applicationId');
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

  const markers = review?.interview?.markers ?? [];
  const answers = review?.interview?.answers ?? [];

  const selectedAnswer = useMemo(
    () => answers.find((item) => item.id === activeAnswerId) ?? answers[0] ?? null,
    [answers, activeAnswerId],
  );

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !review?.interview?.videoDownloadUrl) return;

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
  }, [review, markerId, markers, tParam]);

  const profileHref = applicationId
    ? `/admin/candidatos/${candidateId}?applicationId=${encodeURIComponent(applicationId)}`
    : '/admin/reportes';

  if (loading) {
    return (
      <div className="center-shell">
        <div className="center-card">
          <div className="spinner" />
          <h3 className="text-lg font-bold">Cargando entrevista…</h3>
          <p className="text-sm text-[var(--ink-soft)] mt-2">
            Se recupera video/respuestas ya guardados (sin Gemini).
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

  const interview = review.interview;

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

      {!interview ? (
        <div className="card card-pad text-sm text-[var(--ink-soft)]">
          Esta postulación aún no tiene una entrevista {interviewType} registrada.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-4.5 items-start">
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
                  {interviewType === 'behavioral'
                    ? 'No hay video firmado disponible para esta entrevista.'
                    : 'La entrevista técnica no incluye video; revisa las respuestas a la derecha.'}
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
