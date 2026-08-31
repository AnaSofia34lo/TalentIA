'use client';

import React, { useState } from 'react';
import { useAuth } from '../../../shared/context/AuthContext';
import { CheckIcon } from '../../../shared/components/ui/Icons';

export default function AdminPerfilPage() {
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div className="page-head">
        <div>
          <h1 className="page-title">Mi perfil</h1>
          <p className="page-sub">Información de tu cuenta de administrador.</p>
        </div>
      </div>

      <div className="card card-pad max-w-[560px]">
        <div className="flex items-center gap-4.5 mb-5.5">
          <div className="avatar avatar-lg">{user.avatarInitials}</div>
          <div>
            <h3 className="text-lg font-bold">{user.name}</h3>
            <p className="text-[var(--ink-soft)] text-sm">{user.roleTitle}</p>
          </div>
        </div>

        <form onSubmit={handleSave} className="flex flex-col gap-3.5">
          <div className="field">
            <label>Nombre completo</label>
            <input className="input" defaultValue={user.name} />
          </div>

          <div className="field">
            <label>Correo</label>
            <input className="input" defaultValue={user.email} />
          </div>

          <div className="field">
            <label>Teléfono</label>
            <input className="input" defaultValue={user.phone || '+57 310 987 6543'} />
          </div>

          <div className="field">
            <label>Rol</label>
            <input className="input" defaultValue="Administradora de Selección" disabled />
          </div>

          <div className="flex items-center gap-3 mt-2">
            <button type="submit" className="btn btn-primary">
              Guardar cambios
            </button>
            {saved && (
              <span className="text-xs font-semibold text-[var(--green)] flex items-center gap-1.5">
                <CheckIcon size={16} /> Cambios guardados
              </span>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
