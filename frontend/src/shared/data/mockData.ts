import { Vacante, Candidato, Entrevista, ReporteRec, Notificacion, UserProfile } from '../types';

export const ADMIN_USER: UserProfile = {
  name: 'Ana Ramírez',
  email: 'ana.ramirez@talentia.co',
  roleTitle: 'Admin de Selección · DS4B',
  avatarInitials: 'AR',
  phone: '+57 310 987 6543'
};

export const CANDIDATE_USER: UserProfile = {
  name: 'Camila Restrepo',
  email: 'camila.restrepo@mail.com',
  roleTitle: 'Diseñadora UX/UI',
  avatarInitials: 'CR',
  phone: '+57 300 123 4567'
};

export const VACANTES: Vacante[] = [
  {
    id: 1,
    short: 'Desarrollo de Software',
    nombre: 'Desarrollador de Software (Java & Python)',
    estado: 'Activa',
    nivel: 'Semi-senior a Senior',
    fecha: '15 jul 2026',
    postulaciones: 34,
    area: 'Tecnología · DS4B',
    modalidad: 'Híbrido',
    competenciasTecnicas: ['Java', 'Python', 'Levantamiento de requisitos', 'Delimitación de alcance'],
    competenciasBlandas: ['Autonomía', 'Pensamiento analítico', 'Comunicación técnica'],
    descripcion: 'Buscamos una persona con dominio de Java y Python que participe activamente en el levantamiento de requisitos: que sepa entender lo que se le pide, delimitar el alcance real del requerimiento y ejecutarlo. Evaluamos aptitud demostrada, no solo experiencia en el CV.',
    salario: '$6M - $8.5M COP'
  },
  {
    id: 2,
    short: 'Datos e IA',
    nombre: 'Especialista en Datos e IA',
    estado: 'Activa',
    nivel: 'Senior',
    fecha: '18 jul 2026',
    postulaciones: 21,
    area: 'Tecnología · DS4B',
    modalidad: 'Remoto',
    competenciasTecnicas: ['Analítica de datos', 'Modelos de IA', 'Cruce de información', 'Uso estratégico de IA'],
    competenciasBlandas: ['Pensamiento analítico', 'Curiosidad técnica', 'Comunicación de hallazgos'],
    descripcion: 'Buscamos a alguien que sepa cruzar información, entender mediciones y analítica, y usar la Inteligencia Artificial a favor de los objetivos de DS4B — no solo operarla, sino sacarle ventaja real para el negocio.',
    salario: '$7M - $9.5M COP'
  },
  {
    id: 3,
    short: 'Levantamiento de Requisitos',
    nombre: 'Analista de Levantamiento de Requisitos',
    estado: 'Activa',
    nivel: 'Semi-senior',
    fecha: '20 jul 2026',
    postulaciones: 27,
    area: 'Producto · DS4B',
    modalidad: 'Híbrido',
    competenciasTecnicas: ['Levantamiento de información', 'Modelado de negocio', 'Documentación funcional'],
    competenciasBlandas: ['Saber preguntar', 'Escucha activa', 'Traducción técnica-negocio'],
    descripcion: 'Buscamos un/a analista experto/a en levantamiento de requisitos: que sepa preguntar, entienda el modelo de negocio del cliente y traduzca sus necesidades reales al equipo de desarrollo.',
    salario: '$5.5M - $7.5M COP'
  },
  {
    id: 4,
    short: 'Gestión de Proyectos',
    nombre: 'Gestor de Proyectos (Agile)',
    estado: 'Activa',
    nivel: 'Senior',
    fecha: '22 jul 2026',
    postulaciones: 15,
    area: 'Operaciones · DS4B',
    modalidad: 'Híbrido',
    competenciasTecnicas: ['Metodologías ágiles', 'Scrum / Kanban', 'Seguimiento de cronograma'],
    competenciasBlandas: ['Liderazgo', 'Gestión de expectativas', 'Comunicación con cliente'],
    descripcion: 'Buscamos un/a gestor/a de proyectos que garantice la ejecución al pie de la letra: de cara al cliente, dando seguimiento y gestionando expectativas; de cara al equipo, asegurando el cumplimiento de tiempos.',
    salario: '$8M - $10M COP'
  }
];

export const CANDIDATOS_BY_PERFIL: Record<string, Candidato[]> = {
  'Desarrollo de Software': [
    { id: 'mariana-torres', iniciales: 'MT', nombre: 'Mariana Torres', compat: 95, estado: 'Entrevista enviada · en análisis', fecha: '28 jul 2026', cargo: 'Desarrolladora de Software · Java & Python', experiencia: '6 años de experiencia' },
    { id: 'andres-salazar', iniciales: 'AS', nombre: 'Andrés Salazar', compat: 88, estado: 'Entrevista enviada · en análisis', fecha: '27 jul 2026', cargo: 'Desarrollador Backend Java', experiencia: '4 años de experiencia' },
    { id: 'camila-restrepo', iniciales: 'CR', nombre: 'Camila Restrepo', compat: 82, estado: 'En evaluación', fecha: '29 jul 2026', cargo: 'Desarrolladora Full Stack', experiencia: '3 años de experiencia' },
    { id: 'juan-duque', iniciales: 'JD', nombre: 'Juan Pablo Duque', compat: 76, estado: 'Entrevista enviada · en análisis', fecha: '26 jul 2026', cargo: 'Ingeniero de Software Python', experiencia: '5 años de experiencia' },
    { id: 'laura-gomez', iniciales: 'LG', nombre: 'Laura Gómez', compat: 69, estado: 'Pendiente', fecha: '30 jul 2026', cargo: 'Desarrolladora Junior', experiencia: '2 años de experiencia' },
    { id: 'santiago-rojas', iniciales: 'SR', nombre: 'Santiago Rojas', compat: 61, estado: 'Descartado', fecha: '24 jul 2026', cargo: 'Programador Web', experiencia: '2 años de experiencia' }
  ],
  'Datos e IA': [
    { id: 'carlos-medina', iniciales: 'CM', nombre: 'Carlos Medina', compat: 93, estado: 'Entrevista enviada · en análisis', fecha: '29 jul 2026', cargo: 'Científico de Datos & ML', experiencia: '5 años de experiencia' },
    { id: 'daniela-ospina', iniciales: 'DO', nombre: 'Daniela Ospina', compat: 87, estado: 'Entrevista enviada · en análisis', fecha: '28 jul 2026', cargo: 'Especialista en Analítica e IA', experiencia: '4 años de experiencia' },
    { id: 'felipe-cardenas', iniciales: 'FC', nombre: 'Felipe Cárdenas', compat: 79, estado: 'En evaluación', fecha: '27 jul 2026', cargo: 'Ingeniero de Datos', experiencia: '3 años de experiencia' },
    { id: 'manuela-rincon', iniciales: 'MR', nombre: 'Manuela Rincón', compat: 74, estado: 'Pendiente', fecha: '30 jul 2026', cargo: 'Analista de Business Intelligence', experiencia: '3 años de experiencia' },
    { id: 'esteban-vargas', iniciales: 'EV', nombre: 'Esteban Vargas', compat: 66, estado: 'Pendiente', fecha: '31 jul 2026', cargo: 'Modelador de Datos', experiencia: '2 años de experiencia' },
    { id: 'paula-jimenez', iniciales: 'PJ', nombre: 'Paula Jiménez', compat: 58, estado: 'Descartado', fecha: '22 jul 2026', cargo: 'Analista de Datos Junior', experiencia: '1 año de experiencia' }
  ],
  'Levantamiento de Requisitos': [
    { id: 'natalia-fernandez', iniciales: 'NF', nombre: 'Natalia Fernández', compat: 90, estado: 'Entrevista enviada · en análisis', fecha: '27 jul 2026', cargo: 'Analista Funcional Senior', experiencia: '5 años de experiencia' },
    { id: 'jorge-pena', iniciales: 'JP', nombre: 'Jorge Iván Peña', compat: 85, estado: 'Entrevista enviada · en análisis', fecha: '26 jul 2026', cargo: 'Product Owner / Requisitos', experiencia: '4 años de experiencia' },
    { id: 'sofia-londono', iniciales: 'SL', nombre: 'Sofía Londoño', compat: 81, estado: 'En evaluación', fecha: '29 jul 2026', cargo: 'Analista de Negocio', experiencia: '3 años de experiencia' },
    { id: 'diego-herrera', iniciales: 'DH', nombre: 'Diego Herrera', compat: 72, estado: 'Pendiente', fecha: '30 jul 2026', cargo: 'Documentador Funcional', experiencia: '2 años de experiencia' },
    { id: 'valeria-munoz', iniciales: 'VM', nombre: 'Valeria Muñoz', compat: 65, estado: 'Pendiente', fecha: '31 jul 2026', cargo: 'Consultora Junior', experiencia: '2 años de experiencia' },
    { id: 'andres-rios', iniciales: 'AR', nombre: 'Andrés Felipe Ríos', compat: 55, estado: 'Descartado', fecha: '20 jul 2026', cargo: 'Asistente de Procesos', experiencia: '1 año de experiencia' }
  ],
  'Gestión de Proyectos': [
    { id: 'ricardo-toro', iniciales: 'RT', nombre: 'Ricardo Toro', compat: 92, estado: 'Finalizada por RRHH', fecha: '25 jul 2026', cargo: 'Project Manager Agile', experiencia: '7 años de experiencia' },
    { id: 'isabela-suarez', iniciales: 'IS', nombre: 'Isabela Suárez', compat: 86, estado: 'Entrevista enviada · en análisis', fecha: '27 jul 2026', cargo: 'Scrum Master / PM', experiencia: '4 años de experiencia' },
    { id: 'miguel-cano', iniciales: 'MC', nombre: 'Miguel Ángel Cano', compat: 80, estado: 'En evaluación', fecha: '28 jul 2026', cargo: 'Coordinador de Proyectos TI', experiencia: '3 años de experiencia' },
    { id: 'daniela-castro', iniciales: 'DC', nombre: 'Daniela Castro', compat: 73, estado: 'Pendiente', fecha: '30 jul 2026', cargo: 'Líder de Proyectos', experiencia: '3 años de experiencia' },
    { id: 'julian-gil', iniciales: 'JG', nombre: 'Julián Esteban Gil', compat: 67, estado: 'Pendiente', fecha: '31 jul 2026', cargo: 'Project Coordinator', experiencia: '2 años de experiencia' },
    { id: 'camilo-ruiz', iniciales: 'CA', nombre: 'Camilo Andrés Ruiz', compat: 59, estado: 'Descartado', fecha: '21 jul 2026', cargo: 'Asistente de PMO', experiencia: '1 año de experiencia' }
  ]
};

export const ENTREVISTAS: Entrevista[] = [
  { iniciales: 'MT', nombre: 'Mariana Torres', vacante: 'Desarrollo de Software', duracion: '18:42', estado: 'Completada', fecha: '28 jul 2026' },
  { iniciales: 'CM', nombre: 'Carlos Medina', vacante: 'Datos e IA', duracion: '16:05', estado: 'Completada', fecha: '29 jul 2026' },
  { iniciales: 'NF', nombre: 'Natalia Fernández', vacante: 'Levantamiento de Requisitos', duracion: '14:30', estado: 'Completada', fecha: '27 jul 2026' },
  { iniciales: 'IS', nombre: 'Isabela Suárez', vacante: 'Gestión de Proyectos', duracion: '—', estado: 'Programada', fecha: '04 ago 2026' }
];

export const REPORTE_RECS: ReporteRec[] = [
  {
    iniciales: 'MT',
    nombre: 'Mariana Torres',
    perfil: 'Desarrollo de Software',
    compat: 95,
    texto: 'Demuestra con claridad cómo delimitaría el alcance de un requerimiento ambiguo antes de programarlo. Su punto de atención: poca exposición a equipos completamente distribuidos.'
  },
  {
    iniciales: 'CM',
    nombre: 'Carlos Medina',
    perfil: 'Datos e IA',
    compat: 93,
    texto: 'Explica con solidez cómo usaría IA para cruzar fuentes de datos dispersas y generar valor para el negocio. Punto de atención: sus ejemplos se centran en proyectos individuales, con poca evidencia de trabajo en equipos de datos grandes.'
  },
  {
    iniciales: 'NF',
    nombre: 'Natalia Fernández',
    perfil: 'Levantamiento de Requisitos',
    compat: 90,
    texto: 'Muy buena capacidad para traducir necesidades de negocio en lenguaje técnico accionable. Punto de atención: tiende a asumir alcance sin confirmarlo del todo con el cliente en escenarios de alta presión.'
  },
  {
    iniciales: 'RT',
    nombre: 'Ricardo Toro',
    perfil: 'Gestión de Proyectos',
    compat: 92,
    texto: 'Fortaleza clara en gestión de expectativas de cliente y seguimiento de cronograma. Punto de atención: en su relato prioriza el cumplimiento de fechas incluso sobre señales tempranas de riesgo del equipo.'
  },
  {
    iniciales: 'AS',
    nombre: 'Andrés Salazar',
    perfil: 'Desarrollo de Software',
    compat: 88,
    texto: 'Buen manejo técnico de Java y Python, con evidencia real de haber delimitado alcance en un proyecto anterior. Punto de atención: comunicación algo técnica en exceso al explicarle a perfiles no técnicos.'
  },
  {
    iniciales: 'DO',
    nombre: 'Daniela Ospina',
    perfil: 'Datos e IA',
    compat: 87,
    texto: 'Sólido entendimiento de métricas y analítica aplicada. Punto de atención: aún no evidencia experiencia usando IA generativa para acelerar su propio trabajo, más allá del análisis tradicional.'
  }
];

export const NOTIFS_ADMIN: Notificacion[] = [
  { id: '1', icon: 'user', color: 'purple', title: 'Nuevo candidato postulado', desc: 'Camila Restrepo aplicó a Desarrollo de Software.', time: 'Hace 12 min', unread: true },
  { id: '2', icon: 'video', color: 'green', title: 'Entrevista enviada para análisis', desc: 'Carlos Medina finalizó su entrevista en vivo — Datos e IA.', time: 'Hace 45 min', unread: true },
  { id: '3', icon: 'award', color: 'navy', title: 'Recomendación IA disponible', desc: 'Ya puedes revisar el resumen de Ricardo Toro en Reportes.', time: 'Hace 2 h', unread: true },
  { id: '4', icon: 'briefcase', color: 'amber', title: 'Vacante por vencer', desc: 'Gestión de Proyectos lleva 15 postulaciones esta semana.', time: 'Ayer', unread: false },
  { id: '5', icon: 'user', color: 'purple', title: 'Nuevo candidato postulado', desc: 'Diego Herrera aplicó a Levantamiento de Requisitos.', time: 'Ayer', unread: false }
];

export const NOTIFS_CAND: Notificacion[] = [
  { id: 'c1', icon: 'check', color: 'green', title: 'Entrevista enviada', desc: 'Tu entrevista para Gestión de Proyectos fue enviada a análisis.', time: 'Hace 1 h', unread: true },
  { id: 'c2', icon: 'briefcase', color: 'navy', title: 'Nueva vacante en DS4B', desc: 'Se abrió el perfil Datos e IA — puede interesarte.', time: 'Hace 3 h', unread: true },
  { id: 'c3', icon: 'file', color: 'amber', title: 'Actualiza tu hoja de vida', desc: 'Han pasado 60 días desde tu última actualización.', time: 'Hace 1 día', unread: false },
  { id: 'c4', icon: 'award', color: 'green', title: 'Resultado disponible', desc: 'RRHH finalizó la revisión de tu proceso.', time: 'Hace 3 días', unread: false }
];
