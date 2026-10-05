import { Injectable } from '@nestjs/common';
import { GoogleGenAI, Type } from '@google/genai';
import {
  type GeneratedInterviewQuestion,
  type InterviewQuestionGenerationInput,
  type InterviewQuestionGeneratorPort,
} from '../../application/ports/interview-question-generator.port.js';

const QUESTIONS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      minItems: 20,
      maxItems: 20,
      items: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING, enum: ['technical', 'behavioral'] },
          prompt: { type: Type.STRING },
          sortOrder: { type: Type.INTEGER },
        },
        required: ['category', 'prompt', 'sortOrder'],
      },
    },
  },
  required: ['questions'],
};

@Injectable()
export class GeminiInterviewQuestionGenerator implements InterviewQuestionGeneratorPort {
  async generate(input: InterviewQuestionGenerationInput): Promise<GeneratedInterviewQuestion[]> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY no está configurada; no se pueden generar preguntas.');
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
      contents: [
        'Eres un especialista senior en selección técnica y entrevistas por competencias.',
        'Genera exactamente 20 preguntas únicas para esta vacante: 10 técnicas y 10 de habilidades blandas.',
        'Las preguntas técnicas deben estar formuladas como casos de uso o situaciones reales de trabajo, no como definiciones teóricas.',
        'Las preguntas de habilidades blandas también deben pedir ejemplos o situaciones concretas.',
        'Usa toda la información proporcionada: cargo, descripción, salario, competencias, nivel, modalidad, área y casos de uso.',
        'No agregues respuestas, explicaciones ni texto fuera del JSON solicitado.',
        '',
        JSON.stringify(input),
      ].join('\n'),
      config: {
        responseMimeType: 'application/json',
        responseSchema: QUESTIONS_SCHEMA,
        temperature: 0.5,
      },
    });

    let parsed: unknown;
    try {
      parsed = JSON.parse(response.text ?? '');
    } catch {
      throw new Error('La IA devolvió preguntas en un formato inválido.');
    }

    const questions = (parsed as { questions?: unknown }).questions;
    if (!Array.isArray(questions) || questions.length !== 20) {
      throw new Error('La IA no generó exactamente 20 preguntas.');
    }

    const normalized = questions.map((question, index) => {
      const item = question as Record<string, unknown>;
      const category = item.category === 'technical' || item.category === 'behavioral'
        ? item.category
        : null;
      const prompt = typeof item.prompt === 'string' ? item.prompt.trim() : '';
      if (!category || !prompt) throw new Error('La IA generó una pregunta incompleta.');
      return {
        category: category as 'technical' | 'behavioral',
        prompt,
        sortOrder: index,
      };
    });

    const technical = normalized.filter((question) => question.category === 'technical');
    const behavioral = normalized.filter((question) => question.category === 'behavioral');
    if (technical.length !== 10 || behavioral.length !== 10) {
      throw new Error('La IA debe generar 10 preguntas técnicas y 10 de habilidades blandas.');
    }

    return normalized;
  }
}
