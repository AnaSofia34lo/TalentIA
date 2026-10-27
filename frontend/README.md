# Frontend de TalentIA

Aplicación Next.js para los flujos de candidatos y reclutadores. La sesión se administra con Supabase Authentication y las operaciones de negocio se realizan contra la API NestJS mediante JWT.

## Stack y configuración

- Next.js 16, React 19 y TypeScript.
- Supabase JS client para sesión y autenticación.
- API configurable con `NEXT_PUBLIC_API_URL`.

Crea `frontend/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon-key]
NEXT_PUBLIC_API_URL=http://localhost:3000
```

En producción, `NEXT_PUBLIC_API_URL` debe apuntar al backend HTTPS y las variables deben configurarse en el proveedor antes del build.

## Historias de usuario implementadas

Todas las historias HU-01 a HU-34 cuentan con flujo de interfaz e integración con el backend.

| ID    | Pantalla o flujo frontend                          | Resultado visible                                                       |
| ----- | -------------------------------------------------- | ----------------------------------------------------------------------- |
| HU-01 | `/login` en modo registro                          | El candidato crea su cuenta y entra a su espacio.                       |
| HU-02 | `/login`                                           | Valida credenciales y redirige según rol.                               |
| HU-03 | `/candidato/perfil`                                | Edita nombre, teléfono, ciudad, LinkedIn y portafolio.                  |
| HU-04 | `/candidato/cv`                                    | Selecciona y carga un PDF de hoja de vida.                              |
| HU-05 | `/candidato/cv`                                    | Registra cargo, empresa, años y resumen profesional.                    |
| HU-06 | `/candidato/cv`                                    | Refleja la experiencia autocompletada por el análisis del CV.           |
| HU-07 | `/candidato/cv` y resultados                       | Consume certificaciones extraídas y las presenta en el perfil evaluado. |
| HU-08 | `/candidato/vacantes`                              | Presenta Match IA y evidencia de skills técnicas.                       |
| HU-09 | `/admin/vacantes/crear`                            | Permite registrar nombre o cargo de la vacante.                         |
| HU-10 | `/admin/vacantes/crear`                            | Permite registrar la descripción del cargo.                             |
| HU-11 | `/admin/vacantes/crear`                            | Permite definir el salario mensual.                                     |
| HU-12 | `/admin/vacantes/crear`                            | Permite agregar competencias técnicas.                                  |
| HU-13 | `/admin/vacantes`                                  | Permite publicar y cambiar el estado de la vacante.                     |
| HU-14 | `/admin/vacantes`                                  | Muestra las vacantes activas del reclutador.                            |
| HU-15 | `/candidato/vacantes`                              | Permite seleccionar una vacante y consultar su detalle.                 |
| HU-16 | `/candidato/postulaciones/entrevista`              | Muestra preguntas y registra respuestas técnicas.                       |
| HU-17 | `/candidato/vacantes`                              | Envía una postulación y la muestra en postulaciones.                    |
| HU-18 | Entrevista técnica                                 | Conserva respuestas y permite retomar la sesión.                        |
| HU-19 | `/candidato/resultados` y detalle recruiter        | Muestra el resumen generado de las entrevistas.                         |
| HU-20 | `/admin/banco`                                     | Permite consultar los candidatos de una vacante.                        |
| HU-21 | Vacantes y resultados                              | Presenta la comparación entre perfil y requisitos.                      |
| HU-22 | `/candidato/vacantes`                              | Muestra el porcentaje de compatibilidad.                                |
| HU-23 | `/admin/candidatos/[id]`                           | Muestra factores que justifican el puntaje.                             |
| HU-24 | `/admin/candidatos/[id]`                           | Permite al reclutador visualizar la explicación.                        |
| HU-25 | `/admin/banco`                                     | Ordena candidatos y destaca oro, plata y bronce.                        |
| HU-26 | `/admin/candidatos/[id]` y `/admin/reportes`       | Presenta resumen, competencias, DOFA, match y evidencia.                |
| HU-27 | `/candidato/resultados`                            | Presenta fortalezas y oportunidades de mejora.                          |
| HU-28 | `/candidato/postulaciones`                         | Muestra el estado de cada aplicación y su siguiente acción.             |
| HU-29 | `/admin/vacantes/crear?edit=:id`                   | Permite editar una vacante publicada.                                   |
| HU-30 | `/candidato/postulaciones/entrevista-blanda`       | Graba la entrevista conductual con cámara y micrófono.                  |
| HU-31 | Entrevista de habilidades blandas                  | Envía y asocia el video a la postulación.                               |
| HU-32 | `/candidato/resultados` y `/admin/candidatos/[id]` | Muestra estado y resultado del análisis IA.                             |
| HU-33 | Resultados de entrevista                           | Muestra Match general y puntajes técnico/conductual.                    |
| HU-34 | `/candidato/prueba-tecnica`                        | Muestra el acceso cuando el Match alcanza el 75% requerido.             |

## Flujos de candidato

1. En `/login`, el candidato se registra o inicia sesión.
2. En `/candidato/perfil` completa información personal y documento de identidad.
3. En `/candidato/cv` carga el PDF y registra o revisa su experiencia.
4. En `/candidato/vacantes` consulta vacantes publicadas, detalle, Match IA y opción de postularse.
5. En `/candidato/postulaciones` consulta estados, inicia entrevistas y revisa resultados.
6. La entrevista técnica registra respuestas con límite de tiempo. Después, la entrevista blanda solicita permisos de cámara y micrófono, graba las respuestas y envía el video.
7. En `/candidato/resultados` consulta el estado del análisis, puntajes, retroalimentación y recomendación. En `/candidato/prueba-tecnica` accede cuando el sistema habilita la prueba por Match.

## Flujos de reclutador

El reclutador trabaja desde `/admin/dashboard`, crea y publica vacantes en `/admin/vacantes/crear`, las consulta y edita en `/admin/vacantes`, y revisa candidatos en `/admin/banco`. Desde el detalle `/admin/candidatos/[id]` consulta perfil, resumen IA, puntajes, explicación, respuestas y video. `/admin/reportes` consolida los análisis completados.

## Integración y estados

El contexto de autenticación centraliza sesión, roles, perfil, CV, vacantes, postulaciones, entrevistas y análisis. Las respuestas de la API se muestran con estados de carga, error y procesamiento; el frontend no inventa resultados mientras Gemini analiza una entrevista.

## Ejecución

```bash
npm install
npm run dev
```

La aplicación queda disponible normalmente en `http://localhost:3000`. El backend debe estar iniciado y la URL configurada en `NEXT_PUBLIC_API_URL`.
