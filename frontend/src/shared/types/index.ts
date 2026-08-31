export type UserRole = 'admin' | 'candidate';

export interface UserProfile {
  name: string;
  email: string;
  roleTitle: string;
  avatarInitials: string;
  phone?: string;
}

export interface Vacante {
  id: number;
  short: string;
  nombre: string;
  estado: 'Activa' | 'En pausa' | 'Cerrada';
  nivel: string;
  fecha: string;
  postulaciones: number;
  competenciasTecnicas: string[];
  competenciasBlandas: string[];
  descripcion: string;
  salario: string;
  area?: string;
  modalidad?: string;
}

export interface Candidato {
  id?: string;
  iniciales: string;
  nombre: string;
  compat: number;
  estado: string;
  fecha: string;
  perfil?: string;
  cargo?: string;
  experiencia?: string;
  email?: string;
  telefono?: string;
}

export interface Entrevista {
  id?: string;
  iniciales: string;
  nombre: string;
  vacante: string;
  duracion: string;
  estado: 'Completada' | 'Programada' | 'Pendiente';
  fecha: string;
}

export interface ReporteRec {
  id?: string;
  iniciales: string;
  nombre: string;
  perfil: string;
  compat: number;
  texto: string;
}

export interface Notificacion {
  id: string;
  icon: 'user' | 'video' | 'award' | 'briefcase' | 'check' | 'file';
  color: 'purple' | 'green' | 'navy' | 'amber';
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}
