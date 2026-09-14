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
- `POST /auth/register/recruiter`: crea un recruiter en Supabase Auth, sincroniza `users`, crea o reutiliza su `Organization` y devuelve un JWT.
- `POST /auth/login`: verifica la existencia de la cuenta, valida la contraseña y devuelve el JWT de Supabase.
- `GET /auth/me`: requiere `Authorization: Bearer <access_token>` y devuelve el usuario autenticado.
- `GET /`: endpoint público de disponibilidad.
- `GET /health`: endpoint público de salud.

En Swagger usa **Authorize** con el valor `Bearer <access_token>` después de iniciar sesión.

### Roles y registro de recruiter

El backend utiliza una sola entidad `users`. Los roles válidos de negocio son `candidate`
para el flujo de candidato y `recruiter` para el flujo que anteriormente se identificaba
como admin, administrador o empresa.

`POST /auth/register/recruiter` es un endpoint público independiente del registro de
candidatos. Recibe `email`, `password`, `confirmPassword` y `fullName`. En este flujo,
`fullName` representa el nombre de la empresa y se guarda en `users.fullName`; además,
se crea o reutiliza una fila en `organizations` y se guarda su clave foránea en
`users.organizationId`.

Ejemplo de solicitud:

```json
{
  "email": "talentia@empresa.co",
  "password": "Empresa123!",
  "confirmPassword": "Empresa123!",
  "fullName": "Innovaciones Andinas S.A.S."
}
```

El endpoint valida correo, campos obligatorios, mínimo de ocho caracteres, mayúscula,
minúscula, número, carácter especial y coincidencia de contraseñas. Devuelve `409` si
el correo ya existe. La respuesta contiene `role: recruiter`, `organizationId`, el JWT
de Supabase y los datos de la organización.

Los usuarios antiguos con `role: admin` se normalizan a `recruiter` mediante la migración
`20260914000000_normalize_admin_role` y el arranque de la aplicación. También se
normaliza el `app_metadata.role` de Supabase al iniciar sesión.

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

### HU-03: Perfil del candidato

Todos estos endpoints requieren `Authorization: Bearer <access_token>` y el rol
`candidate`, validado por Supabase Authentication y JWT:

- `GET /candidate/profile`: consulta nombre, correo de solo lectura, teléfono y enlaces.
- `PATCH /candidate/profile`: actualiza nombre, teléfono, ciudad, LinkedIn y portafolio.

El correo no aparece como campo actualizable en ningún DTO. El nombre se guarda
en Prisma y en `user_metadata.fullName` de Supabase Auth.

### HU-04: Subir hoja de vida

El candidato autenticado puede adjuntar su hoja de vida en formato PDF para
utilizarla en sus postulaciones. Esta funcionalidad es independiente de la
edición del perfil y requiere `Authorization: Bearer <access_token>` con rol
`candidate`.

Flujo documentado:

1. El backend recibe el archivo mediante `POST /candidate/cv/file`.
2. Se valida que el archivo sea PDF y no supere 5 MB.
3. El archivo se guarda en el bucket de hojas de vida de Supabase Storage.
4. Se asocia la ruta del archivo al candidato en Prisma.
5. Se genera una URL firmada temporal para su consulta o descarga.
6. El servicio queda documentado en Swagger con parámetros, ejemplos y respuestas.

El candidato solo puede cargar y consultar su propia hoja de vida. El frontend
de Next.js proporciona el selector de archivo y envía el PDF al backend.

### HU-05: Registrar experiencia

El registro de experiencia laboral es independiente del perfil personal y de la
carga de la hoja de vida. Requiere `Authorization: Bearer <access_token>` y el
rol `candidate`.

Servicios documentados:

- `GET /candidate/cv`: consulta cargo actual, empresa, años de experiencia y resumen profesional.
- `PATCH /candidate/cv`: registra o actualiza la experiencia laboral del candidato.

El flujo contempla:

1. Diseñar la estructura de datos para almacenar la experiencia mediante Prisma.
2. Recibir, consultar y actualizar la experiencia desde NestJS.
3. Validar los datos obligatorios en backend y frontend.
4. Persistir cargo actual, empresa, años de experiencia y resumen profesional.
5. Acceso exclusivo del candidato autenticado y gestión de su perfil.
6. Documentar los servicios en Swagger.

Criterios de aceptación:

- Registro exitoso: cuando el candidato completa los campos y guarda, el sistema almacena o actualiza su experiencia.
- Campo obligatorio vacío: si deja vacío `Cargo actual` u otro campo obligatorio, el backend rechaza la solicitud y el frontend muestra `Campo obligatorio` resaltado en rojo.

## Seguridad

- JWT de Supabase validado en cada request protegido
- validación de DTOs con class-validator
- respuestas de error centralizadas

## Arquitectura

Se separan capas de dominio, aplicación e infraestructura para mantener la solución escalable y testeable.
