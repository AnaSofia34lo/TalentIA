# TalentIA

TalentIA es una plataforma inteligente para gestionar procesos de selección. Integra registro de candidatos y reclutadores, perfiles profesionales, vacantes, postulaciones, entrevistas técnicas y de habilidades blandas, análisis de hojas de vida y evaluación asistida por IA.

## Arquitectura

- Frontend: Next.js 16, React 19 y TypeScript.
- Backend: NestJS, TypeScript, arquitectura limpia y Swagger.
- Persistencia: PostgreSQL en Supabase mediante Prisma 7.
- Archivos: Supabase Storage compatible con S3.
- Autenticación: Supabase Authentication y JWT Bearer.
- Inteligencia artificial: Gemini para análisis de CV, generación de preguntas y análisis de entrevistas.
- Despliegue: servicios `talentia-api` y `talentia-web` en Render mediante `render.yaml`.

## Historias de usuario implementadas

Todas las historias de usuario del alcance actual están implementadas.

| ID    | Historia                                   | Rol         | Resultado implementado                                                          |
| ----- | ------------------------------------------ | ----------- | ------------------------------------------------------------------------------- |
| HU-01 | Registrar cuenta                           | Candidato   | Crea una cuenta y obtiene acceso a su espacio, vacantes y proceso de selección. |
| HU-02 | Iniciar sesión                             | Candidato   | Autentica al usuario y habilita las funcionalidades según su rol.               |
| HU-03 | Registrar información personal             | Candidato   | Completa y actualiza su perfil para postularse.                                 |
| HU-04 | Subir hoja de vida                         | Candidato   | Adjunta un PDF al perfil para usarlo en las postulaciones.                      |
| HU-05 | Registrar experiencia                      | Candidato   | Registra experiencia laboral para mejorar la evaluación de compatibilidad.      |
| HU-06 | Extraer experiencia laboral                | IA          | Extrae la experiencia del CV y la persiste en el perfil.                        |
| HU-07 | Identificar certificaciones                | IA          | Detecta y almacena certificaciones obtenidas por el candidato.                  |
| HU-08 | Identificar habilidades técnicas           | Motor de IA | Identifica skills técnicas y genera evidencia para el Match IA.                 |
| HU-09 | Registrar nombre de vacante                | Reclutador  | Crea vacantes con un nombre diferenciador.                                      |
| HU-10 | Ingresar descripción del cargo             | Reclutador  | Registra funciones y responsabilidades del cargo.                               |
| HU-11 | Definir salario ofrecido                   | Reclutador  | Publica el salario mensual ofrecido.                                            |
| HU-12 | Agregar competencia técnica                | Reclutador  | Define los conocimientos técnicos requeridos.                                   |
| HU-13 | Publicar una vacante                       | Reclutador  | Cambia el estado para hacerla visible y postulable.                             |
| HU-14 | Visualizar vacantes activas                | Reclutador  | Consulta sus vacantes activas y su información.                                 |
| HU-15 | Seleccionar vacante                        | Candidato   | Consulta el detalle de una vacante publicada.                                   |
| HU-16 | Responder preguntas de IA                  | Candidato   | Responde preguntas técnicas y conductuales generadas para la vacante.           |
| HU-17 | Enviar postulación                         | Candidato   | Registra formalmente su candidatura a una vacante.                              |
| HU-18 | Almacenar respuestas técnicas              | Sistema     | Conserva las respuestas de la entrevista técnica para su evaluación.            |
| HU-19 | Generar resumen de entrevista              | IA          | Produce un resumen automático de la entrevista.                                 |
| HU-20 | Consultar candidatos de una vacante        | Reclutador  | Revisa las postulaciones de una vacante propia.                                 |
| HU-21 | Comparar competencias                      | IA          | Contrasta las skills del candidato con los requisitos de la vacante.            |
| HU-22 | Calcular porcentaje de compatibilidad      | IA          | Calcula el porcentaje de Match IA.                                              |
| HU-23 | Justificar puntaje                         | IA          | Genera factores positivos y de mejora que explican el resultado.                |
| HU-24 | Visualizar explicación del puntaje         | Reclutador  | Consulta la explicación trazable de la calificación.                            |
| HU-25 | Visualizar ranking IA                      | Reclutador  | Ordena candidatos por puntaje y destaca los tres primeros.                      |
| HU-26 | Consultar resumen del candidato            | Reclutador  | Consulta competencias, matriz DOFA, puntajes y evidencia del candidato.         |
| HU-27 | Visualizar retroalimentación               | Candidato   | Consulta desempeño, fortalezas y aspectos de mejora de sus entrevistas.         |
| HU-28 | Visualizar estado de aplicación            | Candidato   | Consulta el avance de cada postulación.                                         |
| HU-29 | Editar vacante publicada                   | Reclutador  | Actualiza datos, requisitos, preguntas y estado de una vacante.                 |
| HU-30 | Entrevista de habilidades blandas en video | Candidato   | Responde una entrevista conductual mediante cámara y micrófono.                 |
| HU-31 | Almacenar video de entrevista              | Sistema     | Guarda el video y lo asocia con la entrevista del candidato.                    |
| HU-32 | Analizar entrevistas mediante IA           | Sistema     | Analiza respuestas técnicas y video conductual y persiste el resultado.         |
| HU-33 | Calcular Match IA de entrevistas           | Candidato   | Consulta su porcentaje de correspondencia después de las entrevistas.           |
| HU-34 | Habilitar prueba técnica por Match         | Sistema     | Habilita la prueba técnica al alcanzar al menos 75% de compatibilidad.          |

## Flujos principales

### Candidato

El candidato se registra, inicia sesión, completa su perfil, carga el CV y registra su experiencia. Puede consultar vacantes publicadas, abrir su detalle, postularse y consultar el estado de cada aplicación. Cuando corresponde, responde la entrevista técnica, realiza la entrevista de habilidades blandas en video y consulta el Match IA, la retroalimentación y el acceso a la prueba técnica.

### Reclutador

El reclutador inicia sesión, crea y publica vacantes con salario, descripción, competencias y preguntas. Puede consultar vacantes activas, editarlas, consultar sus candidatos, revisar el ranking, abrir el resumen de cada postulación y consultar las evidencias de las entrevistas.

### Inteligencia artificial

Gemini analiza el CV para extraer experiencia, certificaciones y skills técnicas; genera preguntas de entrevista cuando se solicita; y analiza las entrevistas completadas. Los resultados se almacenan con estados de procesamiento, puntajes, resumen, fortalezas, oportunidades de mejora, recomendación y explicación del puntaje.

## Documentación por aplicación

- [Backend](backend/README.md): API, autenticación, persistencia, IA, seguridad y Swagger.
- [Frontend](frontend/README.md): pantallas, navegación, flujos de candidato y reclutador.

## Frontend desplegado

La aplicación web TalentIA está disponible en:

https://talent-ia-five.vercel.app/

## Backend desplegado

Swagger está disponible en [talentia-api.onrender.com/api/docs](https://talentia-api.onrender.com/api/docs).

La url directa del backend:

https://talentia-api.onrender.com

## Ejecución rápida

```bash
# Backend
cd backend
npm install
npx prisma generate
npm run start:dev

# Frontend, en otra terminal
cd frontend
npm install
npm run dev
```

Inicia primero el backend para que el frontend consuma la API local.

## Variables de entorno y despliegue

Consulta `backend/.env.example` y `frontend/.env.example`. El archivo `render.yaml` define los servicios de producción. En Render deben configurarse las variables marcadas con `sync: false`, incluyendo la URL pública HTTPS del backend en el frontend y `FRONTEND_URL` en el backend. Nunca se deben subir archivos `.env`, claves privadas ni credenciales al repositorio.
