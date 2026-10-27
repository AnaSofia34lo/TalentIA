'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightIcon, CheckIcon, VideoIcon } from '../../../../shared/components/ui/Icons';
import { useAuth } from '../../../../shared/context/AuthContext';

type Question = { id: string; prompt: string; answer: string | null };
const DEFAULT_BEHAVIORAL_INTERVIEW_DURATION_SECONDS = 25 * 60;

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
  const [isLoading, setIsLoading] = useState(false);
  const [hasTestedDevices, setHasTestedDevices] = useState(false);
  const [recordingConsent, setRecordingConsent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [deviceError, setDeviceError] = useState('');
  const [microphoneLevel, setMicrophoneLevel] = useState(0);
  const [cameraSupported] = useState(() => typeof navigator !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia));
  const [isRecording, setIsRecording] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isCompleted, setIsCompleted] = useState(false);
  const [interviewDeadline, setInterviewDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_BEHAVIORAL_INTERVIEW_DURATION_SECONDS);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const timeoutCompletionStartedRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const microphoneAnimationRef = useRef<number | null>(null);
  const recordingAnimationRef = useRef<number | null>(null);
  const recordingStreamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const recordingChunksRef = useRef<Blob[]>([]);
  const recordingStartedAtRef = useRef<number | null>(null);
  const currentQuestionRef = useRef(0);
  const questionsRef = useRef<Question[]>([]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      recordingStreamRef.current?.getTracks().forEach((track) => track.stop());
      if (microphoneAnimationRef.current !== null) window.cancelAnimationFrame(microphoneAnimationRef.current);
      if (recordingAnimationRef.current !== null) window.cancelAnimationFrame(recordingAnimationRef.current);
      void audioContextRef.current?.close();
    };
  }, []);

  const testDevices = async () => {
    setDeviceError('');
    setHasTestedDevices(false);
    try {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      if (microphoneAnimationRef.current !== null) window.cancelAnimationFrame(microphoneAnimationRef.current);
      await audioContextRef.current?.close();
      audioContextRef.current = null;
      setMicrophoneLevel(0);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;
      if (audioContextRef.current) await audioContextRef.current.close();
      const audioContext = new window.AudioContext();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      audioContext.createMediaStreamSource(stream).connect(analyser);
      const samples = new Uint8Array(analyser.frequencyBinCount);
      const updateLevel = () => {
        analyser.getByteTimeDomainData(samples);
        let sum = 0;
        samples.forEach((sample) => { const value = (sample - 128) / 128; sum += value * value; });
        setMicrophoneLevel(Math.min(100, Math.round(Math.sqrt(sum / samples.length) * 300)));
        microphoneAnimationRef.current = window.requestAnimationFrame(updateLevel);
      };
      updateLevel();
      setHasTestedDevices(true);
    } catch {
      setDeviceError('No pudimos acceder a tu cámara y micrófono. Revisa los permisos del navegador e inténtalo de nuevo.');
    }
  };

  const beginInterview = async () => {
    if (!vacancyId || !hasTestedDevices || !recordingConsent || isStarting) return;
    if (microphoneAnimationRef.current !== null) window.cancelAnimationFrame(microphoneAnimationRef.current);
    microphoneAnimationRef.current = null;
    await audioContextRef.current?.close();
    audioContextRef.current = null;
    setIsStarting(true);
    setIsLoading(true);
    setError('');
    try {
      const interview = await startBehavioralInterview(vacancyId);
      setInterviewId(interview.interviewId);
      const remaining = interview.remainingSeconds ?? interview.durationSeconds;
      const startedAt = interview.startedAt ? Date.parse(interview.startedAt) : Date.now();
      setInterviewDeadline(startedAt + remaining * 1000);
      setRemainingSeconds(remaining);
      setVacancyTitle(interview.vacancy.title);
      setQuestions(interview.questions);
      questionsRef.current = interview.questions;
      const firstUnanswered = interview.questions.findIndex((question) => !question.answer);
      const questionIndex = firstUnanswered === -1 ? interview.questions.length : firstUnanswered;
      currentQuestionRef.current = questionIndex;
      setCurrentQuestion(questionIndex);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible cargar la entrevista.');
    } finally {
      setIsLoading(false);
      setIsStarting(false);
    }
  };

  useEffect(() => {
    if (!interviewId) return;
    const preventRestrictedActions = (event: Event) => event.preventDefault();
    const preventShortcuts = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && ['c', 'v', 'x', 'a'].includes(event.key.toLowerCase())) {
        event.preventDefault();
      }
    };
    const preventNavigation = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    const keepInterviewActive = () => window.history.pushState(null, '', window.location.href);
    document.addEventListener('copy', preventRestrictedActions);
    document.addEventListener('cut', preventRestrictedActions);
    document.addEventListener('paste', preventRestrictedActions);
    document.addEventListener('contextmenu', preventRestrictedActions);
    document.addEventListener('keydown', preventShortcuts);
    window.addEventListener('beforeunload', preventNavigation);
    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', keepInterviewActive);
    return () => {
      document.removeEventListener('copy', preventRestrictedActions);
      document.removeEventListener('cut', preventRestrictedActions);
      document.removeEventListener('paste', preventRestrictedActions);
      document.removeEventListener('contextmenu', preventRestrictedActions);
      document.removeEventListener('keydown', preventShortcuts);
      window.removeEventListener('beforeunload', preventNavigation);
      window.removeEventListener('popstate', keepInterviewActive);
    };
  }, [interviewId]);

  useEffect(() => {
    if (!interviewDeadline || isTimedOut || !interviewId) return;
    const updateRemainingTime = () => {
      const seconds = Math.max(0, Math.ceil((interviewDeadline - Date.now()) / 1000));
      setRemainingSeconds(seconds);
      if (seconds === 0) setIsTimedOut(true);
    };
    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timer);
  }, [interviewDeadline, interviewId, isTimedOut]);

  useEffect(() => {
    const previewStream = streamRef.current;
    if (isLoading || !interviewId || !previewStream || !videoRef.current || !canvasRef.current) return;
    if (!cameraSupported) return;
    void Promise.resolve(previewStream)
      .then((stream) => {
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
            recordingAnimationRef.current = requestAnimationFrame(animationFrame);
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
  }, [cameraSupported, interviewId, isLoading]);

  const stopRecording = useCallback(() => new Promise<Blob | null>((resolve) => {
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
  }), []);

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

  const handleFinish = useCallback(async () => {
    if (!interviewId || isSubmitting) return;
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
  }, [completeTechnicalInterview, interviewId, isSubmitting, stopRecording, uploadInterviewVideo]);

  useEffect(() => {
    if (!isTimedOut || !interviewId || isSubmitting || timeoutCompletionStartedRef.current) return;
    timeoutCompletionStartedRef.current = true;
    void handleFinish().catch(() => {
      timeoutCompletionStartedRef.current = false;
    });
  }, [handleFinish, isTimedOut, interviewId, isSubmitting]);

  if (!vacancyId) return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">No se encontró la vacante seleccionada</h3><p className="text-[var(--red)] text-sm">Regresa a tus postulaciones e inicia la entrevista desde una vacante.</p></div></div>;
  if (isLoading) return <LoadingInterview />;
  if (!cameraSupported) return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">Cámara no disponible</h3><p className="text-[var(--red)] text-sm">Tu navegador no permite acceder a la cámara y el micrófono.</p></div></div>;
  if (!interviewId) return (
    <div className="interview-shell soft-interview-shell">
      <div className="interview-heading"><span className="eyebrow">Antes de comenzar</span><h1>{vacancyTitle}</h1><p>Prepara tu espacio y verifica tus dispositivos antes de iniciar.</p></div>
      <main className="soft-interview-layout">
        <section className="soft-camera-card">
          <div className="soft-camera-header"><span><VideoIcon size={16} /> Prueba de camara y microfono</span><span><i /> {hasTestedDevices ? 'Dispositivos listos' : 'Sin iniciar'}</span></div>
          <video ref={videoRef} autoPlay muted playsInline className="soft-camera-video" />
          <div className="soft-camera-note">{hasTestedDevices ? 'Comprueba que te ves y habla para verificar el nivel del microfono.' : 'Al probarlos, el navegador solicitara permiso para usar la camara y el microfono.'}</div>
          <div className="px-5 pb-5 text-white text-sm">Nivel del microfono<div className="mt-2 h-2 overflow-hidden rounded bg-white/20"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${microphoneLevel}%` }} /></div></div>
        </section>
        <section className="soft-question-card">
          <div className="soft-question-kicker">Aviso de grabacion</div>
          <h2>Esta entrevista sera grabada</h2>
          <p className="mb-5 text-[var(--ink-soft)]">Al comenzar, se grabaran tu imagen, voz y las preguntas durante la entrevista. El video se guardara para el analisis del proceso de seleccion y podra ser consultado por la organizacion contratante.</p>
          <button type="button" className="btn btn-ghost mb-5 self-start" onClick={() => void testDevices()}>{hasTestedDevices ? 'Volver a probar camara y microfono' : 'Probar audio y video'}</button>
          <label className="mb-5 flex items-start gap-3 text-sm text-[var(--ink)]"><input type="checkbox" checked={recordingConsent} onChange={(event) => setRecordingConsent(event.target.checked)} className="mt-1 h-4 w-4 accent-[var(--purple)]" /><span>Entiendo y acepto que la entrevista de habilidades blandas sera grabada y utilizada para evaluar mi postulacion.</span></label>
          {deviceError && <p className="soft-error mb-4">{deviceError}</p>}{error && <p className="soft-error mb-4">{error}</p>}
          <button type="button" className="btn btn-accent self-start" onClick={() => void beginInterview()} disabled={!hasTestedDevices || !recordingConsent || isStarting}>{isStarting ? 'Iniciando...' : 'Aceptar y comenzar entrevista'} <ArrowRightIcon size={16} /></button>
        </section>
      </main>
    </div>
  );
  if (isCompleted) return <div className="center-shell"><div className="center-card"><div className="success-check"><CheckIcon size={30} /></div><h3 className="text-xl font-bold mb-2.5">Entrevista completada</h3><p className="text-[var(--ink-soft)] text-sm leading-relaxed mb-6">Tus respuestas y video fueron guardados. La IA iniciará el análisis de correspondencia con la vacante.</p><button type="button" className="btn btn-primary btn-block py-3" onClick={() => router.push('/candidato/resultados')}>Ver estado del análisis</button></div></div>;

  const finished = currentQuestion >= questions.length;
  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');
  return (
    <div className="interview-shell soft-interview-shell">
      <div className="interview-heading">
        <div className="interview-heading-top">
          <span className="eyebrow">Entrevista de habilidades blandas</span>
        </div>
        <div className="interview-title-row">
          <h1>{vacancyTitle}</h1>
          <div className={`interview-timer ${remainingSeconds <= 60 ? 'interview-timer-warning' : ''}`} role="timer" aria-label={`Tiempo restante: ${minutes} minutos y ${seconds} segundos`}>
            <span>Tiempo restante</span>
            <strong>{minutes}:{seconds}</strong>
          </div>
        </div>
        <p>Responde de forma natural. La cámara permanecerá activa durante toda la entrevista.</p>
      </div>
      {isTimedOut && !isCompleted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 className="mb-3 text-2xl font-bold text-[var(--ink)]">Entrevista en video incompleta</h2>
            <p className="mb-5 text-sm leading-6 text-[var(--ink-soft)]">
              Se agotaron los 25 minutos. La grabación y las respuestas disponibles se guardaron.
            </p>
            <button type="button" className="btn btn-accent" onClick={() => router.push('/candidato/resultados')} disabled={isSubmitting}>
              Continuar
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}

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
