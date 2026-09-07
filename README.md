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

## HU-01 implementada

El registro de candidatos está implementado en backend y frontend. Usa Supabase
Auth para crear la cuenta y emitir la sesión JWT, Prisma para sincronizar el
usuario local y Swagger para probar `POST /auth/register`. El frontend valida en
vivo correo, contraseña y confirmación, y redirige a `/candidato/cv` después del
registro exitoso.

## Requisitos funcionales y de negocio

Se conservan las historias de usuario del proyecto, incluyendo perfiles de administrador, candidato y organización del flujo de reclutamiento, sin implementar todavía la funcionalidad completa del negocio.

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
