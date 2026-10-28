# Backend de TalentIA

API NestJS que implementa autenticación, perfiles, CV, vacantes, postulaciones, entrevistas, pruebas técnicas y evaluación con IA. El código está organizado en capas de dominio, aplicación e infraestructura para mantener los casos de uso testeables.

## Backend desplegado

Swagger está disponible en [talentia-api.onrender.com/api/docs](https://talentia-api.onrender.com/api/docs).

La url directa del backend:

https://talentia-api.onrender.com

## Stack y configuración

- NestJS, TypeScript y `class-validator`.
- Prisma 7 con PostgreSQL de Supabase.
- Supabase Auth para usuarios y JWT.
- Supabase Storage para CV, documentos de identidad y videos.
- Gemini para extracción, generación y análisis asistido por IA.
- Swagger en `/api/docs`.

Copia `.env.example` a `.env`. `SUPABASE_SERVICE_ROLE_KEY` y `GEMINI_API_KEY` son secretos exclusivos del backend. `DATABASE_URL` usa la conexión transaccional/pooling y `DIRECT_URL` se reserva para migraciones.

## Historias de usuario implementadas

Todas las historias HU-01 a HU-34 están implementadas en la API y sus casos de uso asociados.

| ID    | Implementación backend     | Contrato o resultado                                                                                              |
| ----- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| HU-01 | Registro de candidato      | `POST /auth/register` crea Auth y sincroniza `users` con rol `candidate`.                                         |
| HU-02 | Autenticación              | `POST /auth/login` devuelve JWT; `GET /auth/me` consulta la sesión.                                               |
| HU-03 | Perfil                     | `GET/PATCH /candidate/profile` gestiona datos personales.                                                         |
| HU-04 | CV                         | `POST /candidate/cv/file` valida PDF, almacena y genera URL firmada.                                              |
| HU-05 | Experiencia                | `GET/PATCH /candidate/cv` persiste cargo, empresa, años y resumen.                                                |
| HU-06 | Inteligencia de CV         | El evento `candidate.cv.uploaded` extrae y persiste `WorkExperience`.                                             |
| HU-07 | Certificaciones            | El análisis persiste `Certification` y las devuelve en `/candidate/resume/analysis`.                              |
| HU-08 | Skills técnicas            | Persiste `CandidateTechnicalSkill` y evidencia de Match por habilidad.                                            |
| HU-09 | Nombre de vacante          | `POST /vacancies` recibe y persiste `name`.                                                                       |
| HU-10 | Descripción                | `POST/PATCH /vacancies` valida y persiste la descripción.                                                         |
| HU-11 | Salario                    | `POST/PATCH /vacancies` persiste el salario mensual no negativo.                                                  |
| HU-12 | Competencias               | `VacancySkill` almacena las skills técnicas requeridas.                                                           |
| HU-13 | Publicación                | `PATCH /vacancies/:vacancyId` administra `draft`, `published`, `paused` y `closed`.                               |
| HU-14 | Vacantes del reclutador    | `GET /vacancies` lista las vacantes de su organización.                                                           |
| HU-15 | Detalle de vacante         | `GET /vacancies/available` expone las vacantes publicadas.                                                        |
| HU-16 | Preguntas y respuestas     | `POST /interviews/technical/start` y `POST /interviews/:interviewId/answers`.                                     |
| HU-17 | Postulación                | `POST /candidate/applications/:vacancyId` crea la aplicación.                                                     |
| HU-18 | Persistencia de respuestas | Las respuestas se guardan asociadas a entrevista y pregunta.                                                      |
| HU-19 | Resumen                    | El análisis IA persiste resúmenes técnico y conductual.                                                           |
| HU-20 | Candidatos                 | `GET /vacancies/:vacancyId/applications` lista candidatos de la organización.                                     |
| HU-21 | Comparación                | El caso de uso de Match compara skills requeridas y extraídas del CV.                                             |
| HU-22 | Porcentaje                 | `GET /vacancies/:vacancyId/match` devuelve `matchPercentage`.                                                     |
| HU-23 | Justificación              | `scoreExplanation`, factores positivos y de mejora explican el puntaje.                                           |
| HU-24 | Consulta de explicación    | `GET /recruiter/applications/:applicationId/interview-analysis`.                                                  |
| HU-25 | Ranking                    | La respuesta de candidatos incluye `ranking`, `rank` y medallas.                                                  |
| HU-26 | Resumen del candidato      | El detalle de postulación incluye perfil, competencias, DOFA, puntajes y reportes.                                |
| HU-27 | Retroalimentación          | `GET /candidate/applications/:applicationId/interview-analysis` devuelve feedback.                                |
| HU-28 | Estado de aplicación       | `GET /candidate/applications` devuelve aplicaciones y su estado.                                                  |
| HU-29 | Edición                    | `PATCH /vacancies/:vacancyId` actualiza vacante publicada y preguntas.                                            |
| HU-30 | Entrevista en video        | `POST /interviews/behavioral/start` inicia entrevista con cámara y micrófono.                                     |
| HU-31 | Video                      | `POST /interviews/:interviewId/video` almacena el video en Storage.                                               |
| HU-32 | Análisis IA                | `POST /recruiter/applications/:applicationId/interview-analysis` ejecuta el análisis.                             |
| HU-33 | Match de entrevistas       | El análisis devuelve `technicalScore`, `behavioralScore` y `overallScore`.                                        |
| HU-34 | Prueba técnica             | `GET /candidate/applications/:applicationId/technical-test-access` habilita el acceso cuando el Match es `>= 75`. |

## Endpoints principales

### Autenticación y candidatos

- `POST /auth/register`, `POST /auth/register/recruiter`, `POST /auth/login`, `GET /auth/me`.
- `GET/PATCH /candidate/profile`, `GET/PATCH /candidate/cv`, `POST /candidate/cv/file`.
- `GET /candidate/resume/analysis` y `GET /candidate/applications`.
- `POST /candidate/applications/:vacancyId` y `GET /candidate/applications/:applicationId/technical-test-access`.

### Vacantes y Match IA

- `GET /vacancies/available` para candidatos.
- `GET /vacancies`, `POST /vacancies`, `PATCH /vacancies/:vacancyId` para reclutadores.
- `GET /vacancies/matches` y `GET /vacancies/:vacancyId/match` para compatibilidad.
- `GET /vacancies/:vacancyId/applications` para candidatos, puntajes y ranking de una vacante.
- `POST /vacancies/generate-interview-questions` para generar preguntas con IA.

### Entrevistas y análisis

- `POST /interviews/technical/start` y `POST /interviews/behavioral/start`.
- `POST /interviews/:interviewId/answers` y `POST /interviews/:interviewId/video-markers`.
- `PATCH /interviews/:interviewId/complete` y `POST /interviews/:interviewId/video`.
- `GET /candidate/interview-analyses` y `GET/POST /candidate/applications/:applicationId/interview-analysis`.
- `GET/POST /recruiter/applications/:applicationId/interview-analysis`.
- `GET /recruiter/applications/:applicationId/interview-review` para evidencias de video y respuestas.
- `GET /recruiter/reports` y `GET /recruiter/dashboard/stats`.

Los análisis manejan los estados `pending`, `processing`, `completed` y `failed`. El video se descarga desde un bucket privado, se limita por `MAX_AI_VIDEO_BYTES` y el análisis se concentra en respuestas, competencias observables y requisitos del cargo.

## Seguridad

Los endpoints protegidos requieren `Authorization: Bearer <access_token>`. Los guards validan el JWT con Supabase, los roles (`candidate` o `recruiter`) y la pertenencia del reclutador a su organización. Los DTO validan entradas, las URL de archivos son temporales y las claves de servicio nunca se exponen al frontend.

## Ejecución y migraciones

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

Swagger local: `http://localhost:3000/api/docs`.

## Despliegue

`render.yaml` ejecuta `npx prisma migrate deploy` antes de iniciar la aplicación. Configura `FRONTEND_URL` con uno o varios orígenes HTTPS separados por coma y define las variables de Supabase, base de datos y Gemini en Render.
