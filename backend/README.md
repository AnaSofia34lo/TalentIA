# Backend TalentIA

## Objetivo

Este backend implementa la base técnica para TalentIA siguiendo arquitectura limpia, Prisma ORM, Supabase, JWT, RBAC y Swagger.

## Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Supabase Storage (S3 compatible)
- JWT + Passport
- Swagger
- Helmet + rate limiting + CORS

## Variables de entorno

Copia `.env.example` a `.env` y configura los valores reales de Supabase.

## Conexión a Supabase

Se usa un cliente singleton para Prisma y otro cliente de Supabase con servicio inyectable para evitar agotamiento de conexiones en el plan gratuito.

## Ejecución

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run start:dev
```

## Swagger

Disponibile en:

- http://localhost:3000/api/docs

## Seguridad

- JWT para autenticación
- RBAC con roles `admin`, `candidate`, `recruiter`
- Passport strategy
- Helmet y throttling
- validación de DTOs con class-validator
- respuestas de error centralizadas

## Arquitectura

Se separan capas de dominio, aplicación e infraestructura para mantener la solución escalable y testeable.
