'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, VideoIcon } from '../../../../shared/components/ui/Icons';
import { useAuth } from '../../../../shared/context/AuthContext';

type Question = { id: string; prompt: string; answer: string | null };

function LoadingInterview() {
  return (
    <div className="center-shell">
      <div className="center-card interview-loading-card">
        <div className="spinner" />
        <h3 className="text-lg font-bold mb-2">Preparando entrevista de habilidades blandas…</h3>
        <p className="text-[var(--ink-soft)] text-sm">Estamos cargando las preguntas de la vacante.</p>
      </div>
    </div>
  );
}

function EntrevistaBlandaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { startBehavioralInterview, markVideoQuestion, completeTechnicalInterview, uploadInterviewVideo } = useAuth();
  const vacancyId = searchParams.get('vacancyId');
  const fallbackTitle = searchParams.get('vacancy') || 'Entrevista de habilidades blandas';
  const [vacancyTitle, setVacancyTitle] = useState(fallbackTitle);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [isLoading, setIsLoading] = useState(Boolean(vacancyId));
  const [cameraSupported] = useState(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia));
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const currentQuestionRef = useRef(0);
  const questionsRef = useRef<Question[]>([]);

  useEffect(() => {
    if (!vacancyId) return;

    let active = true;
    void startBehavioralInterview(vacancyId)
      .then((interview) => {
        if (!active) return;
        setInterviewId(interview.interviewId);
        setVacancyTitle(interview.vacancy.title);
        setQuestions(interview.questions);
        questionsRef.current = interview.questions;
        const firstUnanswered = interview.questions.findIndex((question) => !question.answer);
        const questionIndex = firstUnanswered === -1 ? interview.questions.length : firstUnanswered;
        currentQuestionRef.current = questionIndex;
        setCurrentQuestion(questionIndex);
        setIsLoading(false);
      })
      .catch((requestError) => {
        if (!active) return;
        setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar la entrevista.');
        setIsLoading(false);
      });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [startBehavioralInterview, vacancyId]);

  useEffect(() => {
    if (isLoading || !videoRef.current || !canvasRef.current) return;
    if (!cameraSupported) return;
    void navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        if ('MediaRecorder' in window) {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas?.getContext('2d');
          if (!canvas || !context || !canvas.captureStream || !video) {
            setError('Tu navegador no permite incluir las preguntas en la grabación.');
            return;
          }

          const drawFrame = () => {
            const width = video.videoWidth || 1280;
            const height = video.videoHeight || 720;
            canvas.width = width;
            canvas.height = height;
            context.save();
            context.translate(width, 0);
            context.scale(-1, 1);
            context.drawImage(video, 0, 0, width, height);
            context.restore();
            context.fillStyle = 'rgba(7, 26, 50, 0.82)';
            context.fillRect(0, 0, width, Math.min(150, height * 0.24));
            context.fillStyle = '#ffffff';
            context.font = `700 ${Math.max(20, Math.round(width / 45))}px Arial`;
            const question = questionsRef.current[currentQuestionRef.current]?.prompt || 'Entrevista de habilidades blandas';
            const words = question.split(' ');
            const lines: string[] = [];
            let line = '';
            const maxWidth = width - 80;
            words.forEach((word) => {
              const candidate = line ? `${line} ${word}` : word;
              if (context.measureText(candidate).width > maxWidth && line) {
                lines.push(line);
                line = word;
              } else {
                line = candidate;
              }
            });
            if (line) lines.push(line);
            lines.slice(0, 3).forEach((text, index) => context.fillText(text, 40, 48 + index * 34));
          };
          const animationFrame = () => {
            drawFrame();
            requestAnimationFrame(animationFrame);
          };
          animationFrame();
          const recordingStream = canvas.captureStream(30);
          stream.getAudioTracks().forEach((track) => recordingStream.addTrack(track));
          recordingStreamRef.current = recordingStream;
          const recorder = new MediaRecorder(recordingStream);
          recorderRef.current = recorder;
          recordingChunksRef.current = [];
          recorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordingChunksRef.current.push(event.data);
          };
          recorder.start();
          recordingStartedAtRef.current = Date.now();
          setIsRecording(true);
        }
      })
      .catch(() => setError('Necesitamos acceso a tu cámara y micrófono para esta entrevista.'));

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [cameraSupported, isLoading]);

  const stopRecording = () => new Promise<Blob | null>((resolve) => {
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') {
      resolve(recordingChunksRef.current.length ? new Blob(recordingChunksRef.current, { type: 'video/webm' }) : null);
      return;
    }
    recorder.onstop = () => {
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      resolve(new Blob(recordingChunksRef.current, { type: recorder.mimeType || 'video/webm' }));
    };
    recorder.stop();
  });

  const handleNextQuestion = async () => {
    const question = questions[currentQuestion];
    if (!question || !interviewId || isSubmitting) return;

    try {
      setIsSubmitting(true);
      const timestampMs = recordingStartedAtRef.current ? Date.now() - recordingStartedAtRef.current : 0;
      await markVideoQuestion(interviewId, question.id, timestampMs);
      currentQuestionRef.current += 1;
      setCurrentQuestion(currentQuestionRef.current);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible guardar tu respuesta.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinish = async () => {
    if (!interviewId) return;
    try {
      setIsSubmitting(true);
      const video = await stopRecording();
      streamRef.current?.getTracks().forEach((track) => track.stop());
      setIsRecording(false);
      if (!video || video.size === 0) throw new Error('No se pudo obtener la grabación de la entrevista.');
      await uploadInterviewVideo(interviewId, video);
      await completeTechnicalInterview(interviewId);
      setIsCompleted(true);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible finalizar la entrevista.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!vacancyId) return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">No se encontró la vacante seleccionada</h3><p className="text-[var(--red)] text-sm">Regresa a tus postulaciones e inicia la entrevista desde una vacante.</p></div></div>;
  if (isLoading) return <LoadingInterview />;
  if (!cameraSupported) return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">Cámara no disponible</h3><p className="text-[var(--red)] text-sm">Tu navegador no permite acceder a la cámara y el micrófono.</p></div></div>;
  if (error && !interviewId) return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">No se pudo cargar la entrevista</h3><p className="text-[var(--red)] text-sm">{error}</p></div></div>;
  if (isCompleted) return <div className="center-shell"><div className="center-card"><div className="success-check"><CheckIcon size={30} /></div><h3 className="text-xl font-bold mb-2.5">Entrevista completada</h3><p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-6">Tus respuestas y video fueron guardados. La IA iniciará el análisis de correspondencia con la vacante.</p><button type="button" className="btn btn-primary btn-block py-3" onClick={() => router.push('/candidato/resultados')}>Ver estado del análisis</button></div></div>;

  const finished = currentQuestion >= questions.length;
  return (
    <div className="interview-shell soft-interview-shell">
      <div className="interview-heading">
        <div className="interview-heading-top">
          <span className="eyebrow">Entrevista de habilidades blandas</span>
          <Link href="/candidato/postulaciones" className="btn btn-ghost btn-sm"><ArrowLeftIcon size={16} /> Salir</Link>
        </div>
        <h1>{vacancyTitle}</h1>
        <p>Responde de forma natural. La cámara permanecerá activa durante toda la entrevista.</p>
      </div>

      <main className="soft-interview-layout">
        <section className="soft-camera-card">
          <div className="soft-camera-header"><span><VideoIcon size={16} /> Cámara activa</span><span className={isRecording ? 'recording-status' : ''}><i /> {isRecording ? 'Grabando' : 'Preparando'}</span></div>
          <video ref={videoRef} autoPlay muted playsInline className="soft-camera-video" />
          <canvas ref={canvasRef} className="soft-recording-canvas" aria-hidden="true" />
          <div className="soft-camera-note">Busca un lugar tranquilo y mantén tu rostro visible.</div>
        </section>

        <section className="soft-question-card">
          <div className="soft-question-kicker">Pregunta {Math.min(currentQuestion + 1, questions.length)} de {questions.length}</div>
          {!finished ? (
            <>
              <h2>{questions[currentQuestion]?.prompt}</h2>
              <p className="soft-recording-hint">Tu respuesta se grabará en el video. Cuando termines de responder, continúa con la siguiente pregunta.</p>
              <div className="soft-answer-form">
                <button type="button" className="btn btn-accent" onClick={() => void handleNextQuestion()} disabled={isSubmitting}>{isSubmitting ? 'Guardando…' : 'Siguiente pregunta'} <ArrowRightIcon size={16} /></button>
              </div>
            </>
          ) : (
            <>
              <h2>Has respondido todas las preguntas</h2>
              <p className="text-[var(--ink-soft)]">Cuando estés listo, finaliza para guardar la entrevista completa.</p>
              <button type="button" className="btn btn-accent" onClick={() => void handleFinish()} disabled={isSubmitting}>Finalizar entrevista <ArrowRightIcon size={16} /></button>
            </>
          )}
          {error && <p className="soft-error">{error}</p>}
        </section>
      </main>
    </div>
  );
}

export default function EntrevistaBlandaPage() {
  return <React.Suspense fallback={<LoadingInterview />}><EntrevistaBlandaContent /></React.Suspense>;
}
