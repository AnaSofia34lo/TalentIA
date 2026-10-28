'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { ArrowRightIcon, LogoSparkIcon } from '../../../../shared/components/ui/Icons';
import { useAuth } from '../../../../shared/context/AuthContext';

interface ChatMessage {
  id: string;
  role: 'assistant' | 'candidate';
  text: string;
}

interface VacancyContext {
  id: string;
  title: string;
  description: string;
  salary: number;
  organization: string;
}

const DEFAULT_VACANCY = 'Entrevista técnica';
const DEFAULT_TECHNICAL_INTERVIEW_DURATION_SECONDS = 30 * 60;

function InterviewLoading() {
  return (
    <div className="center-shell">
      <div className="center-card interview-loading-card">
        <div className="spinner" />
        <h3 className="text-lg font-bold mb-2">Cargando entrevista…</h3>
        <p className="text-[var(--ink-soft)] text-sm">
          Estamos preparando las preguntas según la vacante seleccionada.
        </p>
      </div>
    </div>
  );
}

function EntrevistaActivaPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { candidateProfile, startTechnicalInterview, submitTechnicalAnswer, completeTechnicalInterview } = useAuth();
  const vacancyId = searchParams.get('vacancyId');
  const vacancyTitle = searchParams.get('vacancy') || DEFAULT_VACANCY;
  const [dataTreatmentStep, setDataTreatmentStep] = useState<'duration' | 'privacy'>('duration');
  const [dataTreatmentChecked, setDataTreatmentChecked] = useState(false);
  const [dataTreatmentAccepted, setDataTreatmentAccepted] = useState(false);
  const [loadedVacancyId, setLoadedVacancyId] = useState<string | null>(null);
  const [vacancy, setVacancy] = useState<VacancyContext | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [interviewDeadline, setInterviewDeadline] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(DEFAULT_TECHNICAL_INTERVIEW_DURATION_SECONDS);
  const [isTimedOut, setIsTimedOut] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const timeoutCompletionStartedRef = useRef(false);
  const [questions, setQuestions] = useState<Array<{ id: string; category: string; prompt: string; answer: string | null }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!vacancyId || !candidateProfile?.id) return;
    const consentKey = `technical-interview-consent:${candidateProfile.id}:${vacancyId}`;
    if (sessionStorage.getItem(consentKey) === 'accepted') {
      sessionStorage.removeItem(consentKey);
      setDataTreatmentAccepted(true);
    }
  }, [candidateProfile?.id, vacancyId]);

  React.useEffect(() => {
    if (!vacancyId || !dataTreatmentAccepted || !candidateProfile?.identityDocument) return;

    let active = true;
    void startTechnicalInterview(vacancyId)
      .then((interview) => {
        if (!active) return;
        setInterviewId(interview.interviewId);
        const remaining = interview.remainingSeconds ?? interview.durationSeconds;
        const startedAt = interview.startedAt ? Date.parse(interview.startedAt) : Date.now();
        setInterviewDeadline(startedAt + remaining * 1000);
        setRemainingSeconds(remaining);
        setVacancy({ id: vacancyId, title: interview.vacancy.title, description: '', salary: 0, organization: interview.vacancy.organization });
        setQuestions(interview.questions);
        const firstUnanswered = interview.questions.findIndex((question) => !question.answer);
        const questionIndex = firstUnanswered === -1 ? interview.questions.length : firstUnanswered;
        setMessages(interview.questions.slice(0, questionIndex).flatMap((question) => [
          { id: `${question.id}-question`, role: 'assistant' as const, text: question.prompt },
          ...(question.answer ? [{ id: `${question.id}-answer`, role: 'candidate' as const, text: question.answer }] : []),
        ]));
        if (questionIndex < interview.questions.length) {
          setMessages((currentMessages) => [...currentMessages, { id: `${interview.questions[questionIndex].id}-question`, role: 'assistant', text: interview.questions[questionIndex].prompt }]);
        }
        setCurrentQuestion(questionIndex);
        setLoadedVacancyId(vacancyId);
      })
      .catch((requestError) => {
        if (active) setLoadError(requestError instanceof Error ? requestError.message : 'No fue posible cargar la entrevista.');
        setLoadedVacancyId(vacancyId);
      });

    return () => {
      active = false;
    };
  }, [candidateProfile?.identityDocument, dataTreatmentAccepted, startTechnicalInterview, vacancyId]);

  useEffect(() => {
    if (!vacancyId) router.replace('/candidato/postulaciones');
  }, [router, vacancyId]);

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
  }, [interviewId, isTimedOut]);

  useEffect(() => {
    const chat = chatMessagesRef.current;
    if (!chat) return;
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!interviewDeadline || isTimedOut || !interviewId) return;

    const updateRemainingTime = () => {
      const seconds = Math.max(
        0,
        Math.ceil((interviewDeadline - Date.now()) / 1000),
      );
      setRemainingSeconds(seconds);
      if (seconds === 0) setIsTimedOut(true);
    };

    updateRemainingTime();
    const timer = window.setInterval(updateRemainingTime, 1000);
    return () => window.clearInterval(timer);
  }, [interviewDeadline, interviewId, isTimedOut]);

  const handleFinish = async () => {
    if (!interviewId || isCompleting) return;
    try {
      setIsCompleting(true);
      await completeTechnicalInterview(interviewId);
      router.push(`/candidato/postulaciones/entrevista-blanda?vacancyId=${encodeURIComponent(vacancyId || '')}&vacancy=${encodeURIComponent(vacancy?.title || vacancyTitle)}`);
    } catch (requestError) {
      setLoadError(requestError instanceof Error ? requestError.message : 'No fue posible finalizar la entrevista.');
    } finally {
      setIsCompleting(false);
    }
  };

  useEffect(() => {
    if (
      !isTimedOut ||
      !interviewId ||
      isCompleting ||
      timeoutCompletionStartedRef.current
    ) return;

    timeoutCompletionStartedRef.current = true;
    setIsCompleting(true);
    void completeTechnicalInterview(interviewId)
      .then(() => setIsTimedOut(true))
      .catch((requestError) => {
        setLoadError(
          requestError instanceof Error
            ? requestError.message
            : 'No fue posible guardar la entrevista incompleta.',
        );
        setIsTimedOut(false);
        timeoutCompletionStartedRef.current = false;
      })
      .finally(() => setIsCompleting(false));
  }, [completeTechnicalInterview, interviewId, isCompleting, isTimedOut]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedAnswer = answer.trim();
    const question = questions[currentQuestion];
    if (
      !trimmedAnswer ||
      !question ||
      !interviewId ||
      isSubmittingAnswer ||
      isTimedOut ||
      isCompleting
    ) return;

    try {
      setIsSubmittingAnswer(true);
      await submitTechnicalAnswer(interviewId, question.id, trimmedAnswer);
      const nextQuestion = currentQuestion + 1;
      setMessages((currentMessages) => [
        ...currentMessages,
        { id: `${question.id}-answer`, role: 'candidate', text: trimmedAnswer },
        ...(nextQuestion < questions.length
          ? [{ id: `${questions[nextQuestion].id}-question`, role: 'assistant' as const, text: questions[nextQuestion].prompt }]
          : []),
      ]);
      setAnswer('');
      setCurrentQuestion(nextQuestion);
    } catch (requestError) {
      setLoadError(requestError instanceof Error ? requestError.message : 'No fue posible guardar tu respuesta.');
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  if (!vacancyId) {
    return <InterviewLoading />;
  }

  if (!candidateProfile?.identityDocument) {
    return (
      <div className="center-shell">
        <div className="center-card" role="alert">
          <h3 className="text-lg font-bold mb-2">Sube tu documento de identidad</h3>
          <p className="mb-5 text-sm text-[var(--ink-soft)]">Debes cargar una foto o PDF de tu documento desde tu perfil antes de presentar la entrevista.</p>
          <Link className="btn btn-primary" href="/candidato/perfil">Ir a mi perfil</Link>
        </div>
      </div>
    );
  }

  if (!dataTreatmentAccepted) {
    return (
      <div className="interview-shell">
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="data-treatment-title"
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            {dataTreatmentStep === 'duration' ? (
              <>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--purple)]">
                  Parte 1 de 2 · Antes de comenzar
                </p>
                <h1 id="data-treatment-title" className="mb-3 text-2xl font-bold text-[var(--ink)]">
                  Tiempo necesario para completar el proceso
                </h1>
                <p className="mb-5 text-sm leading-6 text-[var(--ink-soft)]">
                  Para realizar todo el proceso debes contar con aproximadamente 1 hora
                  y 30 minutos disponibles: 30 minutos para la entrevista técnica y
                  25 minutos para la entrevista en video.
                </p>
                <p className="mb-6 text-sm leading-6 text-[var(--ink-soft)]">
                  Una vez iniciada la entrevista no podrás salir de ella ni cambiar de
                  página. Asegúrate de tener una conexión estable y de poder completarla.
                </p>
                <div className="flex justify-end">
                  <button type="button" className="btn btn-accent" onClick={() => setDataTreatmentStep('privacy')}>
                    Continuar
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.08em] text-[var(--purple)]">
                  Parte 2 de 2 · Autorización
                </p>
                <h1 id="data-treatment-title" className="mb-3 text-2xl font-bold text-[var(--ink)]">
                  Tratamiento de tus datos personales
                </h1>
                <p className="mb-4 text-sm leading-6 text-[var(--ink-soft)]">
                  Para realizar la entrevista técnica guardaremos tus respuestas y las
                  analizaremos en relación con los requisitos de la vacante. La información
                  quedará asociada a tu proceso de selección y podrá ser consultada por la
                  organización contratante.
                </p>
                <p className="mb-5 text-sm leading-6 text-[var(--ink-soft)]">
                  Puedes consultar nuestra Política de Tratamiento de Datos Personales para
                  conocer tus derechos y la forma de ejercerlos.
                </p>
                <label className="mb-6 flex items-start gap-3 text-sm text-[var(--ink)]">
                  <input
                    type="checkbox"
                    checked={dataTreatmentChecked}
                    onChange={(event) => setDataTreatmentChecked(event.target.checked)}
                    className="mt-1 h-4 w-4 accent-[var(--purple)]"
                  />
                  <span>
                    Autorizo el tratamiento de mis datos personales para realizar y evaluar
                    esta entrevista técnica.
                  </span>
                </label>
                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                  <button type="button" className="btn btn-ghost" onClick={() => setDataTreatmentStep('duration')}>
                    Volver
                  </button>
                  <button type="button" className="btn btn-accent" disabled={!dataTreatmentChecked} onClick={() => setDataTreatmentAccepted(true)}>
                    Aceptar y comenzar
                    <ArrowRightIcon size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (loadedVacancyId !== vacancyId) return <InterviewLoading />;

  if (loadError && !interviewId) {
    return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">No se pudo cargar la entrevista</h3><p className="text-[var(--red)] text-sm">{loadError}</p></div></div>;
  }

  const minutes = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
  const seconds = (remainingSeconds % 60).toString().padStart(2, '0');

  return (
    <div className="interview-shell">
      <div className="interview-heading">
        <div className="interview-heading-top">
          <span className="eyebrow">Evaluación técnica con IA</span>
        </div>
        <div className="interview-title-row">
          <h1>{vacancy?.title || vacancyTitle}</h1>
          <div className={`interview-timer ${remainingSeconds <= 60 ? 'interview-timer-warning' : ''}`} role="timer" aria-label={`Tiempo restante: ${minutes} minutos y ${seconds} segundos`}>
            <span>Tiempo restante</span>
            <strong>{minutes}:{seconds}</strong>
          </div>
        </div>
        <p>Responde con calma. Tus respuestas se analizarán en relación con los requisitos de esta vacante.</p>
      </div>

      <main className="interview-chat-card">
        <div className="chat-header">
          <div className="chat-header-avatar"><LogoSparkIcon size={19} /></div>
          <div>
            <strong>{vacancy?.organization || 'Empresa contratante'}</strong>
            <span>Entrevistador técnico · En línea</span>
          </div>
          <span className="chat-status-dot" aria-label="En línea" />
        </div>
        <div className="chat-messages" ref={chatMessagesRef} aria-live="polite">
          {messages.map((message) => (
            <div className={`chat-message ${message.role}`} key={message.id}>
              {message.role === 'assistant' && (
                <div className="chat-avatar"><LogoSparkIcon size={15} /></div>
              )}
              <div className="chat-bubble">{message.text}</div>
            </div>
          ))}
          {currentQuestion >= questions.length && (
            <div className="chat-message assistant">
              <div className="chat-avatar"><LogoSparkIcon size={16} /></div>
              <div className="chat-bubble">Gracias por tus respuestas. Tu entrevista técnica escrita quedó guardada. Puedes continuar con la entrevista en video.</div>
            </div>
          )}
        </div>

        {currentQuestion < questions.length ? (
          <form className="chat-composer" onSubmit={handleSubmit}>
            <textarea
              value={answer}
              onChange={(event) => setAnswer(event.target.value)}
              placeholder="Escribe tu respuesta..."
              aria-label="Tu respuesta"
              rows={3}
            />
            <button type="submit" className="btn btn-accent chat-send" disabled={!answer.trim()} aria-label="Enviar respuesta" title="Enviar respuesta">
              <ArrowRightIcon size={18} />
            </button>
          </form>
        ) : (
          <div className="interview-actions">
            <button type="button" className="btn btn-accent px-6 py-3" onClick={handleFinish} disabled={isCompleting}>
              Continuar con entrevista en video
              <ArrowRightIcon size={16} />
            </button>
          </div>
        )}
        <p className="chat-footer-note">Pregunta {Math.min(currentQuestion + 1, questions.length)} de {questions.length} · Entrevista escrita</p>
      </main>
      {isTimedOut && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4" role="alertdialog" aria-modal="true" aria-labelledby="incomplete-interview-title">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
            <h2 id="incomplete-interview-title" className="mb-3 text-2xl font-bold text-[var(--ink)]">
              Entrevista incompleta
            </h2>
            <p className="mb-5 text-sm leading-6 text-[var(--ink-soft)]">
              Se agotaron los 30 minutos. Tus respuestas guardadas se conservaron y
              la entrevista fue registrada como incompleta.
            </p>
            <button type="button" className="btn btn-accent" onClick={() => router.push(`/candidato/postulaciones/entrevista-blanda?vacancyId=${encodeURIComponent(vacancyId || '')}&vacancy=${encodeURIComponent(vacancy?.title || vacancyTitle)}`)}>
              Continuar
              <ArrowRightIcon size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EntrevistaActivaPage() {
  return (
    <React.Suspense fallback={<InterviewLoading />}>
      <EntrevistaActivaPageContent />
    </React.Suspense>
  );
}
