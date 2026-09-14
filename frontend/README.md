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

`/candidato/perfil` requiere una sesión activa de Supabase
Authentication con JWT y rol `candidate`. El correo se muestra deshabilitado y
solo lectura. El nombre, teléfono, ciudad y enlaces se guardan mediante
`PATCH /candidate/profile`.

El contexto global actualiza el nombre y las iniciales por defecto en el
sidebar, encabezado y demás vistas después de guardar.

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

## HU-05: Registrar experiencia

El registro de experiencia laboral es independiente del perfil personal y de la
carga de la hoja de vida. Desde `Mi hoja de vida` (`/candidato/cv`), el candidato
autenticado registra y gestiona:

- cargo actual;
- empresa;
- años de experiencia;
- resumen profesional.

La información se guarda mediante `PATCH /candidate/cv` y se consulta mediante
`GET /candidate/cv`. El frontend valida los campos antes de enviarlos y el
backend repite las validaciones para proteger la integridad de los datos.

Criterios de aceptación:

- Registro exitoso: al completar los campos y guardar, la experiencia queda almacenada y actualizada en el perfil del candidato.
- Campo obligatorio vacío: si `Cargo actual` u otro campo obligatorio está vacío, se muestra `Campo obligatorio` resaltado en rojo y no se envía el formulario.

El formulario se integra con NestJS, acceso exclusivo del candidato autenticado
y corresponde a una funcionalidad documentada en Swagger.

## Ejecución

```bash
npm install
npm run dev
```

## Nota

La primera base funcional ha sido preparada para que el proyecto se integre con Supabase y quede listo para crecimiento modular.
