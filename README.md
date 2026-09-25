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

## Estado de las historias de usuario

| Historia | Capacidad | Estado actual |
| --- | --- | --- |
| HU-01 | Registro de candidatos | Implementada |
| HU-02 | Inicio de sesión | Implementada |
| HU-03 | Información personal del candidato | Implementada |
| HU-04 | Carga de hoja de vida en PDF | Implementada |
| HU-05 | Registro de experiencia laboral | Implementada |
| HU-06 | Extracción de experiencia laboral con IA | Implementada |
| HU-07 | Identificación de certificaciones | Backend implementado; visualización dedicada pendiente |
| HU-08 | Skills técnicas y Match IA trazable | Implementada |
| HU-09 | Nombre de la vacante | Implementada |
| HU-10 | Descripción del cargo | Implementada |
| HU-11 | Salario de la vacante | Implementada |
| HU-12 | Competencias técnicas de la vacante | Implementada |
| HU-13 | Cambio de estado de la vacante | Implementada |

### Candidato

El candidato puede registrarse, iniciar sesión, completar su perfil, cargar un PDF,
registrar experiencia y consultar vacantes publicadas. El análisis con Gemini extrae
experiencia, certificaciones y habilidades técnicas, y estas últimas alimentan el
porcentaje de compatibilidad con cada vacante junto con evidencia por habilidad.

### Reclutador

El reclutador puede crear, consultar y editar vacantes. Cada vacante incluye nombre,
descripción, salario, competencias técnicas y estado (`draft`, `published`, `paused`
o `closed`). Las vacantes publicadas son visibles para candidatos.

### Alcance pendiente

El modelo de datos ya contempla postulaciones, entrevistas y evaluaciones, pero el
flujo completo para que un candidato se postule y gestione su proceso de selección
no forma parte de las HU-01 a HU-13 implementadas en esta entrega.

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

## Documentación por aplicación

- [Backend](backend/README.md): API, autenticación, persistencia, IA y Swagger.
- [Frontend](frontend/README.md): pantallas, flujos de usuario e integración con la API.

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

Inicia primero el backend para que el frontend pueda consumir la API local.

