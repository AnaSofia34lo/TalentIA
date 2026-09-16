# TalentIA

## Visión general

TalentIA es una plataforma para gestión de contratación con foco en automatización del proceso de selección, procesamiento de CVs, entrevistas y evaluación de candidatos.

## Arquitectura

- Frontend: Next.js
- Backend: NestJS + TypeScript
- Base de datos: PostgreSQL en Supabase
- Storage: S3 compatible de Supabase
- ORM: Prisma
- Seguridad: JWT de Supabase
- Documentación: Swagger

## Historias de Usuario HU

HU-01: El registro de candidatos está implementado en backend y frontend. Usa Supabase
Auth para crear la cuenta y emitir la sesión JWT, Prisma para sincronizar el
usuario local y Swagger para probar `POST /auth/register`. El frontend valida en
vivo correo, contraseña y confirmación, y redirige a `/candidato/cv` después del
registro exitoso.

HU-02: El inicio de sesión HU-02 usa el mismo flujo de Supabase Authentication y JWT.
Swagger documenta `POST /auth/login`, sus parámetros, ejemplos, validaciones y
respuestas para cuenta inexistente, contraseña incorrecta y acceso exitoso.

HU-03: Perfil del candidato. Permite consultar y actualizar los datos personales
del candidato mediante Prisma, Supabase Authentication/JWT y rutas protegidas.
El correo es inmutable y los cambios se sincronizan globalmente en el frontend.

HU-04: Subir hoja de vida. Permite al candidato subir su hoja de vida en formato
PDF para adjuntarla a su perfil y utilizarla en sus postulaciones. La solución
usa Supabase Storage, validación de formato y tamaño, acceso exclusivo del
candidato autenticado, integración entre Next.js y NestJS y documentación del
servicio en Swagger.

HU-05: Registrar experiencia. Permite al candidato registrar y actualizar su
experiencia laboral, incluyendo cargo actual, empresa, años de experiencia y
resumen profesional, para mejorar su compatibilidad con las vacantes y permitir
una evaluación correcta. Incluye validaciones en frontend y backend, acceso
exclusivo del candidato autenticado, persistencia mediante Prisma y
documentación en Swagger.

HU-06: Extracción automática de experiencia laboral. Tras subir el CV (HU-04),
el módulo `resume-intelligence` descarga el PDF, extrae texto, lo analiza con
Gemini y persiste experiencias laborales. Autocompleta `PATCH /candidate/cv`
(cargo, empresa, años y resumen) sin reimplementar HU-05. Consulta en
`GET /candidate/resume/analysis`.

HU-07: Extracción de certificaciones y skills técnicos. El mismo análisis IA
persiste certificaciones y habilidades técnicas estimadas. Consultables en
`GET /candidate/resume/analysis`. Requiere `GEMINI_API_KEY` en el backend.

HU-09: Registrar nombre de vacante. El reclutador autenticado crea una vacante
con nombre/cargo vía `POST /vacancies` (módulo Clean Architecture `vacancies`).
El campo se persiste en Prisma `Vacancy.title`.

HU-10: Registrar descripción del cargo. Misma creación incluye descripción
obligatoria (mín. 20 caracteres) en `Vacancy.description`. Formulario en
`/admin/vacantes/crear`.

## Requisitos funcionales y de negocio

Se conservan las historias de usuario del proyecto, incluyendo perfiles de recruiter, candidato y organización del flujo de reclutamiento, sin implementar todavía la funcionalidad completa del negocio.

## Enlaces de integración

- Supabase URL: https://eqrxaswgpfdbvrxemxgp.supabase.co
- Project ID: eqrxaswgpfdbvrxemxgp
- Region: sa-east-1

## Variables de entorno

- Backend: revisar `.env.example` dentro de `backend/`
- Frontend: revisar `.env.example` dentro de `frontend/`

## Estructura

- `backend/`: API, Prisma, Swagger, JWT, seguridad
- `frontend/`: Next.js, UI y conexión a Supabase

## Ejecución rápida

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run start:dev

# Frontend
cd frontend
npm install
npm run dev
```

## Documentación adicional

- Backend: [backend/README.md](backend/README.md)
- Frontend: [frontend/README.md](frontend/README.md)
