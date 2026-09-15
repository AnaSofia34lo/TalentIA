import { describe, expect, it } from 'vitest';
import { AnalyzeCandidateResumeUseCase } from './analyze-candidate-resume.use-case.js';
import { WorkExperience } from '../../domain/entities/work-experience.entity.js';
import { Certification } from '../../domain/entities/certification.entity.js';
import { TechnicalSkill } from '../../domain/entities/technical-skill.entity.js';
import { GeminiResumeParserAdapter } from '../../infrastructure/ai/gemini-resume-parser.adapter.js';

describe('AnalyzeCandidateResumeUseCase — experiencia laboral (HU-06)', () => {
  const useCase = Object.create(
    AnalyzeCandidateResumeUseCase.prototype,
  ) as AnalyzeCandidateResumeUseCase;

  it('elige la experiencia más reciente (empleo actual)', () => {
    const experiences = [
      new WorkExperience({
        userId: 'u1',
        company: 'Antigua SA',
        role: 'Junior',
        startDate: '2018',
        endDate: '2020',
      }),
      new WorkExperience({
        userId: 'u1',
        company: 'Estudio Croma',
        role: 'Diseñadora UX/UI',
        startDate: '2021',
        endDate: 'Actual',
      }),
    ];

    const latest = useCase.pickMostRecent(experiences);
    expect(latest.company).toBe('Estudio Croma');
    expect(latest.role).toBe('Diseñadora UX/UI');
  });

  it('construye DTO válido para updateCv a partir de la experiencia', () => {
    const latest = new WorkExperience({
      userId: 'u1',
      company: 'Estudio Croma',
      role: 'Diseñadora UX/UI',
      startDate: '2021-01',
      endDate: null,
      description: 'Diseño de productos digitales B2B y sistemas de diseño.',
    });

    const dto = useCase.buildCvDto(latest, [latest]);
    expect(dto).not.toBeNull();
    expect(dto!.professionalTitle).toBe('Diseñadora UX/UI');
    expect(dto!.currentCompany).toBe('Estudio Croma');
    expect(dto!.summary.length).toBeGreaterThanOrEqual(20);
    expect(dto!.yearsOfExperience).toBeGreaterThanOrEqual(0);
  });

  it('omite autocomplete si falta company o role', () => {
    const incomplete = WorkExperience.fromExtracted('u1', {
      company: null,
      role: 'Dev',
    });
    expect(incomplete).toBeNull();
  });

  it('estima años de experiencia desde fechas', () => {
    const experiences = [
      new WorkExperience({
        userId: 'u1',
        company: 'A',
        role: 'Dev',
        startDate: '2020',
        endDate: '2022',
      }),
      new WorkExperience({
        userId: 'u1',
        company: 'B',
        role: 'Senior',
        startDate: '2022',
        endDate: '2024',
      }),
    ];
    expect(useCase.estimateYears(experiences)).toBe(4);
  });
});

describe('Certification entity — certificaciones (HU-07)', () => {
  it('omite certificaciones sin nombre', () => {
    expect(
      Certification.fromExtracted('u1', {
        name: null,
        issuer: 'Coursera',
        date: '2022',
      }),
    ).toBeNull();

    expect(
      Certification.fromExtracted('u1', {
        name: '   ',
        issuer: 'Coursera',
      }),
    ).toBeNull();
  });

  it('acepta certificación válida aunque falte issuer o date', () => {
    const cert = Certification.fromExtracted('u1', {
      name: 'Google UX Design',
      issuer: null,
      date: null,
    });
    expect(cert).not.toBeNull();
    expect(cert!.name).toBe('Google UX Design');
    expect(cert!.issuer).toBeNull();
  });
});

describe('TechnicalSkill entity — skills técnicos (HU-07)', () => {
  it('omite skills sin nombre', () => {
    expect(
      TechnicalSkill.fromExtracted('u1', {
        name: null,
        estimatedProficiency: 80,
      }),
    ).toBeNull();
  });

  it('usa proficiency 50 por defecto y recorta al rango 0-100', () => {
    const withDefault = TechnicalSkill.fromExtracted('u1', {
      name: 'Figma',
      estimatedProficiency: null,
    });
    expect(withDefault).not.toBeNull();
    expect(withDefault!.estimatedProficiency).toBe(50);

    const clamped = TechnicalSkill.fromExtracted('u1', {
      name: 'TypeScript',
      estimatedProficiency: 150,
    });
    expect(clamped!.estimatedProficiency).toBe(100);
  });
});

describe('GeminiResumeParserAdapter.normalize — respuesta IA', () => {
  const adapter = new GeminiResumeParserAdapter();

  it('normaliza JSON completo de experiencia y certificaciones', () => {
    const result = adapter.normalize(
      JSON.stringify({
        workExperience: [
          {
            company: 'Acme',
            role: 'Backend',
            startDate: '2020',
            endDate: '2023',
            description: 'APIs NestJS',
          },
        ],
        certifications: [
          { name: 'AWS SAA', issuer: 'Amazon', date: '2024' },
          { name: null, issuer: 'Ignorado', date: '2020' },
        ],
        technicalSkills: [
          { name: 'TypeScript', estimatedProficiency: 85 },
          { name: null, estimatedProficiency: 10 },
        ],
      }),
    );

    expect(result.workExperience).toHaveLength(1);
    expect(result.workExperience[0].company).toBe('Acme');
    expect(result.certifications).toHaveLength(2);
    expect(result.certifications[1].name).toBeNull();
    expect(result.technicalSkills[0].estimatedProficiency).toBe(85);
  });

  it('tolera payload incompleto sin tumbar el flujo', () => {
    const result = adapter.normalize(JSON.stringify({}));
    expect(result.workExperience).toEqual([]);
    expect(result.certifications).toEqual([]);
    expect(result.technicalSkills).toEqual([]);
  });

  it('rechaza JSON inválido', () => {
    expect(() => adapter.normalize('{no-json')).toThrow(/JSON válido/);
  });

  it('normaliza JSON envuelto en bloques de código markdown', () => {
    const result = adapter.normalize(
      '```json\n{\n  "workExperience": [{"company": "Google", "role": "SWE", "startDate": "2021", "endDate": "2023", "description": "Dev"}],\n  "certifications": [],\n  "technicalSkills": []\n}\n```',
    );
    expect(result.workExperience).toHaveLength(1);
    expect(result.workExperience[0].company).toBe('Google');
  });

  it('detecta errores transitorios de Gemini (503, UNAVAILABLE, high demand, 429)', () => {
    expect(
      adapter.isTransientError(
        new Error(
          'ApiError: {"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}',
        ),
      ),
    ).toBe(true);

    expect(
      adapter.isTransientError({
        status: 'UNAVAILABLE',
        message: 'High demand spike',
      }),
    ).toBe(true);

    expect(
      adapter.isTransientError({
        code: 429,
        message: 'Resource exhausted',
      }),
    ).toBe(true);

    expect(
      adapter.isTransientError(new Error('Invalid API Key provided')),
    ).toBe(false);
  });
});

