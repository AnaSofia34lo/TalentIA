'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  LogoSparkIcon
} from '../../../../shared/components/ui/Icons';
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
  const { startTechnicalInterview, submitTechnicalAnswer, completeTechnicalInterview } = useAuth();
  const vacancyId = searchParams.get('vacancyId');
  const vacancyTitle = searchParams.get('vacancy') || DEFAULT_VACANCY;
  const [loadedVacancyId, setLoadedVacancyId] = useState<string | null>(null);
  const [vacancy, setVacancy] = useState<VacancyContext | null>(null);
  const [interviewId, setInterviewId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Array<{ id: string; category: string; prompt: string; answer: string | null }>>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);
  const [loadError, setLoadError] = useState('');

  React.useEffect(() => {
    if (!vacancyId) return;

    let active = true;
    void startTechnicalInterview(vacancyId)
      .then((interview) => {
        if (!active) return;
        setInterviewId(interview.interviewId);
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
  }, [startTechnicalInterview, vacancyId]);

  useEffect(() => {
    const chat = chatMessagesRef.current;
    if (!chat) return;
    chat.scrollTo({ top: chat.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleFinish = async () => {
    if (!interviewId) return;
    try {
      await completeTechnicalInterview(interviewId);
      router.push(`/candidato/postulaciones/entrevista-blanda?vacancyId=${encodeURIComponent(vacancyId || '')}&vacancy=${encodeURIComponent(vacancy?.title || vacancyTitle)}`);
    } catch (requestError) {
      setLoadError(requestError instanceof Error ? requestError.message : 'No fue posible finalizar la entrevista.');
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedAnswer = answer.trim();
    const question = questions[currentQuestion];
    if (!trimmedAnswer || !question || !interviewId || isSubmittingAnswer) return;

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

  if (vacancyId && loadedVacancyId !== vacancyId) return <InterviewLoading />;

  if (loadError && !interviewId) {
    return <div className="center-shell"><div className="center-card"><h3 className="text-lg font-bold mb-2">No se pudo cargar la entrevista</h3><p className="text-[var(--red)] text-sm">{loadError}</p></div></div>;
  }

  return (
    <div className="interview-shell">
      <div className="interview-heading">
        <div className="interview-heading-top">
          <span className="eyebrow">Evaluación técnica con IA</span>
          <Link href="/candidato/postulaciones" className="btn btn-ghost btn-sm">
            <ArrowLeftIcon size={16} />
            Salir
          </Link>
        </div>
        <h1>{vacancy?.title || vacancyTitle}</h1>
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
            <button type="button" className="btn btn-accent px-6 py-3" onClick={handleFinish}>
              Continuar con entrevista en video
              <ArrowRightIcon size={16} />
            </button>
          </div>
        )}
        <p className="chat-footer-note">Pregunta {Math.min(currentQuestion + 1, questions.length)} de {questions.length} · Entrevista escrita</p>
      </main>
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
