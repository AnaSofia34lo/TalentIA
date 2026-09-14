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

## HU-02: Iniciar sesión

El formulario usa `POST /auth/login` del backend y Supabase Authentication para
validar las credenciales. Antes de enviar, valida en vivo correo, campos
obligatorios y los requisitos de la contraseña. Las respuestas se muestran al
usuario con mensajes claros: `Este correo no tiene una cuenta en TalentIA` o
`La contraseña no coincide con la contraseña de la cuenta`.

Con credenciales correctas se guarda la sesión JWT de Supabase y se redirige al
panel correspondiente: `/admin/dashboard` para administradores o
`/candidato/cv` para candidatos.

## HU-03: Perfil del candidato

`/candidato/perfil` y `/candidato/cv` requieren una sesión activa de Supabase
Authentication con JWT y rol `candidate`. El correo se muestra deshabilitado y
solo lectura. El nombre, teléfono, ciudad y enlaces se guardan mediante
`PATCH /candidate/profile`; el cargo, empresa, años y resumen mediante
`PATCH /candidate/cv`.

El contexto global actualiza el nombre, las iniciales por defecto y el cargo en
el sidebar, encabezado y demás vistas después de guardar.

## HU-04: Subir hoja de vida

La carga de la hoja de vida es una funcionalidad independiente del perfil. El
candidato selecciona un archivo PDF desde la interfaz de `/candidato/cv` y el
frontend lo envía al backend mediante `POST /candidate/cv/file`.

El flujo contempla:

- validación del formato PDF y del tamaño máximo de 5 MB;
- envío autenticado con la sesión JWT del candidato;
- almacenamiento en el bucket de hojas de vida de Supabase Storage;
- asociación del archivo con el perfil del candidato;
- consulta de la hoja de vida mediante una URL firmada temporal;
- mensajes de error para selección, carga y validación del archivo.

## Ejecución

```bash
npm install
npm run dev
```

## Nota

La primera base funcional ha sido preparada para que el proyecto se integre con Supabase y quede listo para crecimiento modular.
