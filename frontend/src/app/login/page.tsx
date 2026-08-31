'use client';

import React, { useState } from 'react';
import { useAuth } from '../../shared/context/AuthContext';
import { LogoSparkIcon, MailIcon, LockIcon } from '../../shared/components/ui/Icons';
import { UserRole } from '../../shared/types';

export default function LoginPage() {
  const { login } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('admin');
  const [email, setEmail] = useState('ana.ramirez@talentia.co');
  const [password, setPassword] = useState('••••••••');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    if (role === 'admin') {
      setEmail('ana.ramirez@talentia.co');
    } else {
      setEmail('camila.restrepo@mail.com');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedRole);
  };

  return (
    <div className="login-screen min-h-screen flex flex-col md:flex-row">
      {/* Left Illustration Section */}
      <div
        className="login-illustration hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden"
        style={{ background: 'var(--grad-brand)' }}
      >
        <div
          className="absolute w-[520px] h-[520px] rounded-full blur-[10px] -top-[140px] -left-[140px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(108,99,255,.55), transparent 70%)' }}
        />
        <div
          className="absolute w-[420px] h-[420px] rounded-full -bottom-[120px] -right-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,.18), transparent 70%)' }}
        />

        <div className="flex flex-col items-center max-w-[520px] relative z-10 text-center">
          <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full max-w-[460px]">
            <circle cx="240" cy="190" r="150" stroke="rgba(255,255,255,.18)" strokeWidth="1.5" strokeDasharray="4 6" />
            <circle cx="240" cy="190" r="110" stroke="rgba(255,255,255,.14)" strokeWidth="1.5" />
            <line x1="240" y1="190" x2="120" y2="100" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <line x1="240" y1="190" x2="360" y2="105" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <line x1="240" y1="190" x2="110" y2="270" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <line x1="240" y1="190" x2="370" y2="280" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <line x1="240" y1="190" x2="240" y2="60" stroke="rgba(255,255,255,.35)" strokeWidth="1.5" />
            <g>
              <circle cx="240" cy="190" r="46" fill="url(#g1)" />
              <path d="M223 190a17 17 0 1134 0 17 17 0 01-34 0z" stroke="#fff" strokeWidth="2.4" />
              <path d="M215 214c3-10 12-15 25-15s22 5 25 15" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
            </g>
            <g>
              <circle cx="120" cy="100" r="30" fill="rgba(255,255,255,.14)" />
              <path d="M108 100a12 12 0 1124 0 12 12 0 01-24 0z" stroke="#fff" strokeWidth="2" />
              <path d="M102 118c2-7 9-11 18-11s16 4 18 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g>
              <circle cx="360" cy="105" r="30" fill="rgba(255,255,255,.14)" />
              <path d="M348 105a12 12 0 1124 0 12 12 0 01-24 0z" stroke="#fff" strokeWidth="2" />
              <path d="M342 123c2-7 9-11 18-11s16 4 18 11" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g>
              <circle cx="110" cy="270" r="26" fill="rgba(255,255,255,.14)" />
              <path d="M99 270a11 11 0 1122 0 11 11 0 01-22 0z" stroke="#fff" strokeWidth="2" />
              <path d="M93 286c2-6 8-10 17-10s15 4 17 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g>
              <circle cx="370" cy="280" r="26" fill="rgba(255,255,255,.14)" />
              <path d="M359 280a11 11 0 1122 0 11 11 0 01-22 0z" stroke="#fff" strokeWidth="2" />
              <path d="M353 296c2-6 8-10 17-10s15 4 17 10" stroke="#fff" strokeWidth="2" strokeLinecap="round" />
            </g>
            <g>
              <rect x="216" y="30" width="48" height="48" rx="14" fill="rgba(255,255,255,.16)" />
              <path d="M232 54l6 6 12-14" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </g>
            <circle cx="240" cy="190" r="4" fill="#fff" />
            <defs>
              <linearGradient id="g1" x1="194" y1="144" x2="286" y2="236" gradientUnits="userSpaceOnUse">
                <stop stopColor="#6C63FF" />
                <stop offset="1" stopColor="#123C73" />
              </linearGradient>
            </defs>
          </svg>

          <div className="login-copy text-white mt-8 text-center max-w-[440px]">
            <h2 className="text-white text-2xl font-bold mb-2.5">Contrata con la certeza de los datos</h2>
            <p className="text-white/80 text-sm leading-relaxed">
              TalentIA analiza hojas de vida, conduce entrevistas y evalúa competencias con IA — para que tu equipo decida con evidencia, no con intuición.
            </p>
          </div>
        </div>
      </div>

      {/* Right Form Section */}
      <div className="flex-1 flex items-center justify-center p-8 md:p-12 bg-white">
        <div className="w-full max-w-[380px]">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="brand-mark">
              <LogoSparkIcon size={18} />
            </div>
            <div className="brand-name text-xl">
              Talent<span>IA</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold mb-1.5">Bienvenido de nuevo</h1>
          <p className="text-[var(--ink-soft)] text-sm mb-6">
            Inicia sesión para continuar en tu espacio de trabajo.
          </p>

          {/* Role selector tab */}
          <div className="flex gap-2 p-1.5 rounded-xl bg-[var(--navy-tint)] mb-6">
            <button
              type="button"
              onClick={() => handleRoleChange('admin')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                selectedRole === 'admin'
                  ? 'bg-white text-[var(--navy)] shadow-sm'
                  : 'bg-transparent text-[var(--navy)] hover:bg-white/50'
              }`}
            >
              Soy administrador
            </button>
            <button
              type="button"
              onClick={() => handleRoleChange('candidate')}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-semibold transition-all ${
                selectedRole === 'candidate'
                  ? 'bg-white text-[var(--navy)] shadow-sm'
                  : 'bg-transparent text-[var(--navy)] hover:bg-white/50'
              }`}
            >
              Soy candidato
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="field">
              <label>Correo electrónico</label>
              <div className="input-icon-wrap">
                <span className="icon">
                  <MailIcon size={18} />
                </span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nombre@empresa.com"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label>Contraseña</label>
              <div className="input-icon-wrap">
                <span className="icon">
                  <LockIcon size={18} />
                </span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end -mt-1.5">
              <a href="#" className="text-xs font-semibold text-[var(--purple)] hover:underline">
                ¿Olvidaste tu contraseña?
              </a>
            </div>

            <button type="submit" className="btn btn-primary btn-block py-3 mt-1">
              Iniciar sesión
            </button>
          </form>

          {/* Social login divider */}
          <div className="flex items-center gap-3 text-[var(--ink-faint)] text-xs my-5 before:flex-1 before:h-px before:bg-[var(--line)] after:flex-1 after:h-px after:bg-[var(--line)]">
            o continúa con
          </div>

          <button
            type="button"
            onClick={() => login(selectedRole)}
            className="w-full flex items-center justify-center gap-2.5 border border-[var(--line)] rounded-xl py-2.5 px-4 font-semibold text-sm text-[var(--ink)] bg-white hover:bg-[var(--bg)] hover:border-[#cfd8e6] transition-all"
          >
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 01-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.87 2.7-6.62z" />
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 009 18z" />
              <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.66 9c0-.59.1-1.17.29-1.7V4.97H.98A9 9 0 000 9c0 1.45.35 2.83.98 4.03l2.97-2.33z" />
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 00.98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z" />
            </svg>
            Continuar con Google
          </button>

          <p className="text-[var(--ink-faint)] text-xs text-center mt-6">
            Selecciona tu rol y presiona Iniciar sesión para acceder al espacio.
          </p>
        </div>
      </div>
    </div>
  );
}
