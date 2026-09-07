# Frontend TalentIA

## Objetivo

Aplicación web frontend para la experiencia de administradores y candidatos en TalentIA.

## Stack

- Next.js 16
- React 19
- TypeScript
- Supabase JS client

## Configuración

Crear un archivo `.env.local` con las variables de Supabase para conectarse al proyecto.

```bash
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## HU-01: Registrar cuenta

El flujo de candidato permite crear una cuenta mediante `POST /auth/register`.
El frontend valida en vivo el formato del correo, los cinco requisitos de la
contraseña y la coincidencia de `Contraseña` y `Confirmar contraseña`. Las
contraseñas se envían únicamente por HTTPS al backend; nunca se guardan en el
frontend. Después del registro, se guarda la sesión JWT de Supabase y se redirige
a `Mi hoja de vida` (`/candidato/cv`).

El mensaje para un correo existente es `Este correo ya está registrado` y el
mensaje para contraseñas diferentes es `Las contraseñas deben ser iguales.`.

## Ejecución

```bash
npm install
npm run dev
```

## Nota

La primera base funcional ha sido preparada para que el proyecto se integre con Supabase y quede listo para crecimiento modular.
