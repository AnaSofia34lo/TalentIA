import { describe, expect, it } from 'vitest';
import { Vacancy } from '../../domain/entities/vacancy.entity.js';
import { CreateVacancyUseCase } from './create-vacancy.use-case.js';

describe('Vacancy entity — HU-09 / HU-10', () => {
  it('acepta nombre y descripción válidos', () => {
    const vacancy = new Vacancy({
      name: 'Desarrollador Backend',
      description:
        'Responsable del diseño e implementación de APIs NestJS y Prisma.',
      createdByUserId: 'u1',
      organizationId: 'o1',
    });
    expect(vacancy.name).toBe('Desarrollador Backend');
    expect(vacancy.description.length).toBeGreaterThanOrEqual(20);
  });

  it('rechaza nombre demasiado corto (HU-09)', () => {
    expect(
      () =>
        new Vacancy({
          name: 'AB',
          description:
            'Descripción suficientemente larga para pasar la validación mínima.',
          createdByUserId: 'u1',
          organizationId: 'o1',
        }),
    ).toThrow(/nombre/i);
  });

  it('rechaza descripción demasiado corta (HU-10)', () => {
    expect(
      () =>
        new Vacancy({
          name: 'Analista QA',
          description: 'Muy corta',
          createdByUserId: 'u1',
          organizationId: 'o1',
        }),
    ).toThrow(/descripción/i);
  });
});

describe('CreateVacancyUseCase.buildSlug', () => {
  const useCase = Object.create(
    CreateVacancyUseCase.prototype,
  ) as CreateVacancyUseCase;

  it('normaliza el nombre a slug URL-safe', () => {
    expect(useCase.buildSlug('Desarrollador Backend (NestJS)')).toBe(
      'desarrollador-backend-nestjs',
    );
  });

  it('genera fallback si el nombre no aporta caracteres útiles', () => {
    expect(useCase.buildSlug('***')).toMatch(/^vacante-/);
  });
});
