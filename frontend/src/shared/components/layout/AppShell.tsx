'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import {
  LogoSparkIcon,
  DashboardIcon,
  BriefcaseIcon,
  VideoIcon,
  DatabaseIcon,
  BarChartIcon,
  UserIcon,
  FileTextIcon,
  AwardIcon,
  BellIcon,
  SearchIcon,
  LogoutIcon,
  CheckIcon
} from '../ui/Icons';

const NOTIF_ICON_MAP = {
  user: <UserIcon size={16} />,
  video: <VideoIcon size={16} />,
  award: <AwardIcon size={16} />,
  briefcase: <BriefcaseIcon size={16} />,
  check: <CheckIcon size={16} />,
  file: <FileTextIcon size={16} />
};

const NOTIF_COLOR_MAP: Record<string, [string, string]> = {
  purple: ['var(--purple-tint)', 'var(--purple)'],
  green: ['var(--green-tint)', 'var(--green)'],
  navy: ['var(--navy-tint)', 'var(--navy)'],
  amber: ['var(--amber-tint)', 'var(--amber)']
};

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { role, user, notifications, unreadCount, logout, markAllNotifsRead } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close notifications on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const isNavActive = (path: string) => {
    if (path === '/admin/vacantes' && pathname.startsWith('/admin/vacantes')) return true;
    if (path === '/admin/banco' && pathname.startsWith('/admin/candidatos')) return true;
    if (path === '/candidato/entrevistas' && pathname.startsWith('/candidato/entrevistas')) return true;
    return pathname === path;
  };

  return (
    <div className="app-shell">
      {/* Mobile Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ---------- SIDEBAR ---------- */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`} id="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <LogoSparkIcon size={18} />
          </div>
          <div>
            <div className="brand-name">
              Talent<span>IA</span>
            </div>
            <div style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--ink-faint)', letterSpacing: '0.03em', marginTop: '-2px' }}>
              DS4B · Digital Solution
            </div>
          </div>
        </div>

        {/* ADMIN NAV */}
        {role === 'admin' ? (
          <nav id="nav-admin">
            <div className="nav-group-label">General</div>
            <Link
              href="/admin/dashboard"
              className={`nav-item ${isNavActive('/admin/dashboard') ? 'active' : ''}`}
            >
              <DashboardIcon size={18} />
              <span>Dashboard</span>
            </Link>
            <Link
              href="/admin/vacantes"
              className={`nav-item ${isNavActive('/admin/vacantes') ? 'active' : ''}`}
            >
              <BriefcaseIcon size={18} />
              <span>Vacantes</span>
            </Link>
            <Link
              href="/admin/entrevistas"
              className={`nav-item ${isNavActive('/admin/entrevistas') ? 'active' : ''}`}
            >
              <VideoIcon size={18} />
              <span>Entrevistas</span>
            </Link>
            <Link
              href="/admin/banco"
              className={`nav-item ${isNavActive('/admin/banco') ? 'active' : ''}`}
            >
              <DatabaseIcon size={18} />
              <span>Banco de Talentos</span>
            </Link>
            <Link
              href="/admin/reportes"
              className={`nav-item ${isNavActive('/admin/reportes') ? 'active' : ''}`}
            >
              <BarChartIcon size={18} />
              <span>Reportes</span>
            </Link>

            <div className="nav-group-label">Cuenta</div>
            <Link
              href="/admin/perfil"
              className={`nav-item ${isNavActive('/admin/perfil') ? 'active' : ''}`}
            >
              <UserIcon size={18} />
              <span>Perfil</span>
            </Link>
          </nav>
        ) : (
          /* CANDIDATE NAV */
          <nav id="nav-candidate">
            <div className="nav-group-label">Mi espacio</div>
            <Link
              href="/candidato/inicio"
              className={`nav-item ${isNavActive('/candidato/inicio') ? 'active' : ''}`}
            >
              <DashboardIcon size={18} />
              <span>Inicio</span>
            </Link>
            <Link
              href="/candidato/vacantes"
              className={`nav-item ${isNavActive('/candidato/vacantes') ? 'active' : ''}`}
            >
              <BriefcaseIcon size={18} />
              <span>Vacantes</span>
            </Link>
            <Link
              href="/candidato/cv"
              className={`nav-item ${isNavActive('/candidato/cv') ? 'active' : ''}`}
            >
              <FileTextIcon size={18} />
              <span>Mi hoja de vida</span>
            </Link>
            <Link
              href="/candidato/entrevistas"
              className={`nav-item ${isNavActive('/candidato/entrevistas') ? 'active' : ''}`}
            >
              <VideoIcon size={18} />
              <span>Mis entrevistas</span>
            </Link>
            <Link
              href="/candidato/resultados"
              className={`nav-item ${isNavActive('/candidato/resultados') ? 'active' : ''}`}
            >
              <AwardIcon size={18} />
              <span>Resultados</span>
            </Link>

            <div className="nav-group-label">Cuenta</div>
            <Link
              href="/candidato/perfil"
              className={`nav-item ${isNavActive('/candidato/perfil') ? 'active' : ''}`}
            >
              <UserIcon size={18} />
              <span>Perfil</span>
            </Link>
          </nav>
        )}

        <div className="sidebar-footer">
          <button
            type="button"
            onClick={logout}
            className="nav-item w-full text-left bg-transparent border-0"
          >
            <LogoutIcon size={18} />
            <span>Cerrar sesión</span>
          </button>

          <Link
            href={role === 'admin' ? '/admin/perfil' : '/candidato/perfil'}
            className="user-chip"
            style={{ marginTop: '6px' }}
          >
            <div className="avatar avatar-sm">{user.avatarInitials}</div>
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {user.name}
              </div>
              <div style={{ fontSize: '11.5px', color: 'var(--ink-faint)' }}>
                {user.roleTitle}
              </div>
            </div>
          </Link>
        </div>
      </aside>

      {/* ---------- MAIN CONTENT ---------- */}
      <div className="main-content">
        <header className="topbar">
          {/* Left balanced space */}
          <div className="flex-1 hidden md:block" />

          {/* Centered Search Bar */}
          <div className="input-icon-wrap topbar-search">
            <span className="icon">
              <SearchIcon size={18} />
            </span>
            <input
              className="input"
              placeholder="Buscar candidatos, vacantes..."
            />
          </div>

          <div className="topbar-right flex-1 justify-end">
            {/* Notifications panel dropdown */}
            <div style={{ position: 'relative' }} ref={notifRef}>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setNotifOpen(!notifOpen)}
                aria-label="Notificaciones"
              >
                <BellIcon size={18} />
                {unreadCount > 0 && <span className="notif-dot" />}
              </button>

              {notifOpen && (
                <div className="notif-panel" onClick={(e) => e.stopPropagation()}>
                  <div className="notif-panel-head">
                    <b>Notificaciones</b>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={markAllNotifsRead}
                    >
                      Marcar leídas
                    </button>
                  </div>
                  <div>
                    {notifications.length > 0 ? (
                      notifications.map((n) => {
                        const colors = NOTIF_COLOR_MAP[n.color] || NOTIF_COLOR_MAP.navy;
                        return (
                          <div
                            key={n.id}
                            className={`notif-item ${n.unread ? 'unread' : ''}`}
                          >
                            <div
                              className="notif-ico"
                              style={{ background: colors[0], color: colors[1] }}
                            >
                              {NOTIF_ICON_MAP[n.icon] || <BriefcaseIcon size={16} />}
                            </div>
                            <div style={{ flex: 1 }}>
                              <div className="notif-title">{n.title}</div>
                              <div className="notif-desc">{n.desc}</div>
                              <div className="notif-time">{n.time}</div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="notif-empty">
                        No tienes notificaciones nuevas.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <Link
              href={role === 'admin' ? '/admin/perfil' : '/candidato/perfil'}
              className="user-chip cursor-pointer"
            >
              <div className="avatar avatar-sm">{user.avatarInitials}</div>
            </Link>
          </div>
        </header>

        <main className="page-container">{children}</main>
      </div>
    </div>
  );
}
