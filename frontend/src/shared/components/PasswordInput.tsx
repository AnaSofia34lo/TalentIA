'use client';

import React, { useState } from 'react';
import { EyeIcon, EyeOffIcon, LockIcon } from './ui/Icons';

type PasswordInputProps = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  autoComplete?: string;
};

export function PasswordInput({
  id,
  label,
  value,
  onChange,
  placeholder = 'Ingresa tu contraseña',
  className = '',
  autoComplete = 'current-password',
}: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className="input-icon-wrap input-icon-wrap--password">
        <span className="icon">
          <LockIcon size={18} />
        </span>
        <input
          id={id}
          className={`input ${className}`.trim()}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          className="password-toggle"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
        </button>
      </div>
    </div>
  );
}
