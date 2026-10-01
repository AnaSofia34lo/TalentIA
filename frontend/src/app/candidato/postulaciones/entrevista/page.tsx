'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CheckIcon,
  LogoSparkIcon
} from '../../../../shared/components/ui/Icons';
import { useAuth } from '../../../../shared/context/AuthContext';

type InterviewState = 'active' | 'sending' | 'sent';

interface ChatMessage {
  id: number;
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

const DEFAULT_VACANCY = 'Desarrollador Backend';

function buildTechnicalQuestions(vacancy: Pick<VacancyContext, 'title' | 'description'>) {
  const context = vacancy.description.trim()
    ? ` considerando esta necesidad de la vacante: "${vacancy.description.trim()}"`
    : '';

  return [
    `Para comenzar, ¿cómo resolverías el reto principal de ${vacancy.title}${context}? ¿Qué decisiones técnicas tomarías?`,
    'Imagina que uno de los endpoints más utilizados empieza a responder lentamente. ¿Cómo investigarías el problema y qué alternativas considerarías para resolverlo?',
    '¿Cómo asegurarías la calidad de tu código antes de llevar una nueva funcionalidad a producción?',
    'Describe una situación en la que hayas tenido que elegir entre dos tecnologías o enfoques técnicos. ¿Cómo evaluaste cuál era la mejor opción?',
    '¿Qué estrategia utilizarías para manejar errores y excepciones en un servicio backend?',
    '¿Cómo diseñarías una solución para proteger información sensible y controlar el acceso de diferentes tipos de usuarios?',
    '¿Qué ventajas y riesgos ves en utilizar una arquitectura de microservicios frente a un monolito?',
    '¿Cómo abordarías una migración de base de datos sin interrumpir el servicio en producción?',
    '¿Qué métricas revisarías para saber si una aplicación está funcionando correctamente?',
    'Cuéntame cómo organizarías el trabajo técnico de una funcionalidad desde el análisis hasta su despliegue.',
  ];
}

const defaultQuestions = buildTechnicalQuestions({ title: DEFAULT_VACANCY, description: '' });

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
  const { listCandidateApplications } = useAuth();
  const vacancyId = searchParams.get('vacancyId');
  const vacancyTitle = searchParams.get('vacancy') || DEFAULT_VACANCY;
  const [loadedVacancyId, setLoadedVacancyId] = useState<string | null>(null);
  const [vacancy, setVacancy] = useState<VacancyContext | null>(null);
  const [state, setState] = useState<InterviewState>('active');
  const [questions, setQuestions] = useState(defaultQuestions);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answer, setAnswer] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 1,
      role: 'assistant',
      text: defaultQuestions[0],
    },
  ]);

  React.useEffect(() => {
    if (!vacancyId) return;

    let active = true;
    void listCandidateApplications()
      .then((applications) => {
        const application = applications.find((item) => item.vacancyId === vacancyId);
        if (!active || !application) return;

        const loadedVacancy: VacancyContext = {
          id: application.vacancyId,
          title: application.vacancy.title,
          description: application.vacancy.description,
          salary: application.vacancy.salary,
          organization: application.vacancy.organization.name,
        };
        const generatedQuestions = buildTechnicalQuestions(loadedVacancy);
        setVacancy(loadedVacancy);
        setQuestions(generatedQuestions);
        setMessages([{ id: 1, role: 'assistant', text: generatedQuestions[0] }]);
        setCurrentQuestion(0);
        setAnswer('');
        setState('active');
        setLoadedVacancyId(vacancyId);
      })
      .catch(() => {
        setLoadedVacancyId(vacancyId);
      });

    return () => {
      active = false;
    };
  }, [listCandidateApplications, vacancyId]);

  const handleFinish = () => {
    setState('sending');
    setTimeout(() => {
      setState('sent');
    }, 2200);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedAnswer = answer.trim();
    if (!trimmedAnswer) return;

    const nextQuestion = currentQuestion + 1;
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: currentMessages.length + 1, role: 'candidate', text: trimmedAnswer },
      ...(nextQuestion < questions.length
        ? [{ id: currentMessages.length + 2, role: 'assistant' as const, text: questions[nextQuestion] }]
        : []),
    ]);
    setAnswer('');
    setCurrentQuestion(nextQuestion);
  };

  if (vacancyId && loadedVacancyId !== vacancyId) return <InterviewLoading />;

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
            onClick={() => router.push('/candidato/postulaciones')}
          >
            Volver a mis postulaciones
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="interview-shell">
      <div className="interview-topbar">
        <Link href="/candidato/postulaciones" className="btn btn-ghost btn-sm">
          <ArrowLeftIcon size={16} />
          Salir
        </Link>

        <div aria-hidden="true" />

        <div className="interview-progress">{Math.min(currentQuestion, questions.length)} / {questions.length}</div>
      </div>

      <div className="interview-heading">
        <span className="eyebrow">Evaluación técnica con IA</span>
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
        <div className="chat-messages" aria-live="polite">
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
              <div className="chat-bubble">Gracias por tus respuestas. Ya puedes finalizar la entrevista para que la IA prepare tu evaluación técnica.</div>
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
              Finalizar entrevista
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
