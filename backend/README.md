# Backend TalentIA

## Objetivo

Este backend implementa la base técnica para TalentIA siguiendo arquitectura limpia, Prisma ORM, Supabase, JWT y Swagger.

## Stack

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL (Supabase)
- Supabase Storage (S3 compatible)
- JWT
- Swagger
- CORS

## Variables de entorno

Copia `.env.example` a `.env` y configura los valores reales de Supabase. No uses claves de
Supabase en el frontend para llamadas administrativas: `SUPABASE_SERVICE_ROLE_KEY` solo debe
existir en el backend y nunca debe enviarse al cliente.

Para JWT se requieren `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY`.
El backend no firma tokens propios: Supabase crea el access token con `signInWithPassword` y
el guard valida cada Bearer token mediante `supabase.auth.getUser(token)`. Los roles se leen de
`app_metadata.role`, que es metadata administrada por el servidor y no editable por el usuario.

## Conexión a Supabase

Se usa un cliente singleton para Prisma y otro cliente de Supabase con servicio inyectable para evitar agotamiento de conexiones en el plan gratuito.
Como el proyecto usa Prisma 7, `PrismaService` inicializa `PrismaPg` con `DATABASE_URL`.
La URL de runtime debe ser la cadena transaccional/pooling de Supabase; `DIRECT_URL` queda
reservada para migraciones y comandos de Prisma.

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

Endpoints documentados:

- `POST /auth/register`: crea un candidato en Supabase Auth y sincroniza `users` en Prisma.
- `POST /auth/login`: verifica la existencia de la cuenta, valida la contraseña y devuelve el JWT de Supabase.
- `GET /auth/me`: requiere `Authorization: Bearer <access_token>` y devuelve el usuario autenticado.
- `GET /`: endpoint público de disponibilidad.
- `GET /health`: endpoint público de salud.

En Swagger usa **Authorize** con el valor `Bearer <access_token>` después de iniciar sesión.

### HU-01: Registro de candidato

`POST /auth/register` recibe `email`, `password`, `confirmPassword` y, opcionalmente,
`fullName`. El backend valida el formato del correo, mínimo ocho caracteres, una
mayúscula, una minúscula, un número, un carácter especial y la coincidencia de
las contraseñas. Luego crea el usuario en Supabase Auth con `role: candidate` en
`app_metadata` y crea el registro local con el mismo UUID.

Si el correo ya existe responde `409` con `Este correo ya está registrado`.

### HU-02: Inicio de sesión

`POST /auth/login` recibe `email` y `password`. Ambos campos son obligatorios;
el correo debe tener texto antes del `@`, el símbolo `@` y un dominio válido.
La contraseña se valida con los mismos requisitos definidos en HU-01. Antes de
intentar iniciar sesión, el backend verifica la existencia de la cuenta en
Supabase Auth.

Respuestas documentadas:

- `200`: credenciales correctas; devuelve `access_token`, `refresh_token`, expiración y usuario.
- `404`: `Este correo no tiene una cuenta en TalentIA`.
- `401`: `La contraseña no coincide con la contraseña de la cuenta`.
- `400`: datos obligatorios o formato de correo/contraseña inválidos.

Ejemplo:

```json
{
  "email": "candidato@talentia.co",
  "password": "Talento123!"
}
```

Ejemplo de login:

```json
{
  "email": "ana.ramirez@talentia.co",
  "password": "Password123!"
}
```

Ejemplo de respuesta:

```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "expires_at": 1780000000,
  "user": {
    "id": "2e3d1d5c-6f5f-4d30-a9dd-4e4cfd4b4f87",
    "email": "ana.ramirez@talentia.co",
    "role": "candidate"
  }
}
```

Ejemplo de llamada protegida:

```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Seguridad

- JWT de Supabase validado en cada request protegido
- validación de DTOs con class-validator
- respuestas de error centralizadas

## Arquitectura

Se separan capas de dominio, aplicación e infraestructura para mantener la solución escalable y testeable.
