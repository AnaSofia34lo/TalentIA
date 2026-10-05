export const INTERVIEW_QUESTION_GENERATOR = Symbol('INTERVIEW_QUESTION_GENERATOR');

export type InterviewQuestionCategory = 'technical' | 'behavioral';

export type GeneratedInterviewQuestion = {
  category: InterviewQuestionCategory;
  prompt: string;
  sortOrder: number;
};

export type InterviewQuestionGenerationInput = {
  name: string;
  description: string;
  salary: number;
  technicalSkills?: string[];
  softSkills?: string[];
  area?: string;
  level?: string;
  modality?: string;
  useCases?: string;
};

export interface InterviewQuestionGeneratorPort {
  generate(input: InterviewQuestionGenerationInput): Promise<GeneratedInterviewQuestion[]>;
}
