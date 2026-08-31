import React from 'react';

export type BadgeVariant = 'green' | 'purple' | 'navy' | 'red' | 'amber';

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  withDot?: boolean;
  className?: string;
}

export function Badge({ variant = 'navy', children, withDot = false, className = '' }: BadgeProps) {
  return (
    <span className={`badge badge-${variant} ${className}`}>
      {withDot && <span className="badge-dot" />}
      {children}
    </span>
  );
}

export function EstadoBadge({ estado }: { estado: string }) {
  const map: Record<string, BadgeVariant> = {
    'Activa': 'green',
    'Cerrada': 'red',
    'En pausa': 'amber',
    'Entrevista completada': 'green',
    'En evaluación': 'navy',
    'Pendiente': 'amber',
    'Descartado': 'red',
    'Completada': 'green',
    'Programada': 'amber',
    'Finalizada por RRHH': 'green',
    'Entrevista enviada · en análisis': 'navy'
  };

  const variant = map[estado] || 'navy';

  return (
    <span className={`badge badge-${variant}`}>
      <span className="badge-dot" />
      {estado}
    </span>
  );
}
