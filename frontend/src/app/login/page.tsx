'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../shared/context/AuthContext';
import { LogoSparkIcon, MailIcon, LockIcon } from '../../shared/components/ui/Icons';
import { UserRole } from '../../shared/types';

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const passwordRules = [
  { label: 'Mínimo 8 caracteres', test: (value: string) => value.length >= 8 },
  { label: 'Una letra mayúscula', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'Una letra minúscula', test: (value: string) => /[a-z]/.test(value) },
  { label: 'Debe contener números', test: (value: string) => /[0-9]/.test(value) },
  { label: 'Un carácter especial (.,-!#)', test: (value: string) => /[!@#$%^&*.,-]/.test(value) },
];

function emailError(email: string) {
  if (!email) return 'Campo obligatorio';
  if (!email.includes('@')) return 'El correo debe tener @ (arroba).';
  const [local, domain] = email.split('@');
  if (!local) return 'El correo debe tener texto antes del @.';
  if (!domain || !domain.includes('.') || domain.endsWith('.')) return 'El correo debe tener un dominio válido después del @.';
  if (!emailPattern.test(email)) return 'Ingresa un correo válido.';
  return '';
}

export default function LoginPage() {
  const router = useRouter();
  const { login, registerCandidate } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole>('candidate');
  const [registerMode, setRegisterMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const emailValidation = useMemo(() => emailError(email), [email]);
  const passwordValid = passwordRules.every((rule) => rule.test(password));
  const passwordsMatch = password.length > 0 && password === confirmPassword;

  const selectRole = (role: UserRole) => {
    if (role === selectedRole) return;
    setSelectedRole(role);
    setRegisterMode(role === 'candidate');
    setError('');
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');

    if (emailValidation) return setError(emailValidation);
    if (!password) return setError('Campo obligatorio');

    if (registerMode) {
      if (!passwordValid) return setError('La contraseña no cumple todos los requisitos.');
      if (!confirmPassword) return setError('Campo obligatorio');
      if (password !== confirmPassword) return setError('Las contraseñas deben ser iguales.');
    }

    try {
      setLoading(true);
      if (registerMode) {
        await registerCandidate(email, password, confirmPassword);
        router.push('/candidato/cv');
      } else {
        const role = await login(email, password);
        router.push(role === 'admin' ? '/admin/dashboard' : '/candidato/cv');
      }
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No fue posible completar la operación.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-screen min-h-screen flex flex-col lg:flex-row">
      <div className="hidden lg:flex flex-1 items-center justify-center p-12 relative overflow-hidden" style={{ background: 'var(--grad-brand)' }}>
        <div className="absolute w-[520px] h-[520px] rounded-full blur-[10px] -top-[140px] -left-[140px] pointer-events-none" style={{ background: 'radial-gradient(circle, rgba(108,99,255,.55), transparent 70%)' }} />
        <div className="relative z-10 text-center text-white max-w-[460px]">
          <div className="mx-auto mb-8 w-28 h-28 rounded-[32px] bg-white/15 flex items-center justify-center text-5xl">✦</div>
          <h2 className="text-white text-3xl font-bold mb-3">Contrata con la certeza de los datos</h2>
          <p className="text-white/80 text-sm leading-relaxed">TalentIA analiza hojas de vida, conduce entrevistas y evalúa competencias con IA para que tu equipo decida con evidencia.</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-white">
        <div className="w-full max-w-[430px]">
          <div className="flex items-center gap-2.5 mb-6"><div className="brand-mark"><LogoSparkIcon size={18} /></div><div className="brand-name text-xl">Talent<span>IA</span></div></div>
          <h1 className="text-2xl font-bold mb-1.5">{registerMode ? 'Crea tu cuenta' : 'Bienvenido de nuevo'}</h1>
          <p className="text-[var(--ink-soft)] text-sm mb-6">{registerMode ? 'Regístrate como candidato para comenzar tu proceso.' : 'Inicia sesión para continuar en tu espacio de trabajo.'}</p>

          <div className="flex gap-2 p-1.5 rounded-xl bg-[var(--navy-tint)] mb-6">
            <button type="button" onClick={() => selectRole('admin')} className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold ${selectedRole === 'admin' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--navy)]'}`}>Soy administrador</button>
            <button type="button" onClick={() => selectRole('candidate')} className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-semibold ${selectedRole === 'candidate' ? 'bg-white text-[var(--navy)] shadow-sm' : 'text-[var(--navy)]'}`}>Soy candidato</button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
            <div className="field">
              <label htmlFor="email">Correo electrónico</label>
              <div className="input-icon-wrap"><span className="icon"><MailIcon size={18} /></span><input id="email" className={`input ${email && emailValidation ? 'border-[var(--red)]' : ''}`} type="text" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@empresa.com" /></div>
              {email && emailValidation && <p className="text-xs text-[var(--red)] mt-1">{emailValidation}</p>}
            </div>

            <div className="field">
              <label htmlFor="password">Contraseña</label>
              <div className="input-icon-wrap"><span className="icon"><LockIcon size={18} /></span><input id="password" className="input" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Ingresa tu contraseña" /></div>
            </div>

            <div className="rounded-xl border border-[var(--line)] bg-[var(--bg)] p-3">
              <p className="text-xs font-semibold text-[var(--ink)] mb-2">La contraseña tiene los siguientes requisitos:</p>
              <div className="grid gap-1">{passwordRules.map((rule) => { const valid = rule.test(password); return <p key={rule.label} className={`text-xs ${valid ? 'text-[var(--green)]' : 'text-[var(--ink-faint)]'}`}><span className="inline-block w-4">{valid ? '✓' : '○'}</span>{rule.label}</p>; })}</div>
            </div>

            {registerMode && <>
              <div className="field">
                <label htmlFor="confirmPassword">Confirmar contraseña</label>
                <div className="input-icon-wrap"><span className="icon"><LockIcon size={18} /></span><input id="confirmPassword" className={`input ${confirmPassword && !passwordsMatch ? 'border-[var(--red)]' : ''}`} type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Repite tu contraseña" /></div>
                {confirmPassword && !passwordsMatch && <p className="text-xs text-[var(--red)] mt-1">Las contraseñas deben ser iguales.</p>}
                {passwordsMatch && <p className="text-xs text-[var(--green)] mt-1">✓ Las contraseñas coinciden.</p>}
              </div>
            </>}

            {error && <div className="rounded-lg bg-[var(--red-tint)] text-[var(--red)] text-sm p-3" role="alert">{error}</div>}
            <button type="submit" disabled={loading} className="btn btn-primary btn-block py-3 mt-1">{loading ? 'Procesando...' : registerMode ? 'Crear cuenta' : 'Iniciar sesión'}</button>
          </form>

          {selectedRole === 'candidate' && <button type="button" onClick={() => { setRegisterMode(!registerMode); setError(''); }} className="w-full text-center text-sm font-semibold text-[var(--purple)] mt-5 hover:underline">{registerMode ? 'Ya tengo una cuenta. Iniciar sesión' : '¿No tienes cuenta? Regístrate'}</button>}
        </div>
      </div>
    </div>
  );
}
