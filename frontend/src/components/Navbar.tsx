'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, LogOut, Menu, X, ChevronDown, ShieldCheck, Sparkles, ShieldAlert } from 'lucide-react';
import { useSidebar } from './SidebarProvider';
import { useTheme } from './ThemeProvider';
import { getStoredSession, clearSession, UserSession } from '../lib/auth';
import { api, ImpersonatedCorporation } from '../lib/services';
import { useRouter } from 'next/navigation';

export function Navbar() {
  const { collapsed, toggle } = useSidebar();
  const { theme, toggleTheme } = useTheme();
  const [profileOpen, setProfileOpen] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [impersonatedCorp, setImpersonatedCorp] = useState<ImpersonatedCorporation | null>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setSession(getStoredSession());

    const syncImpersonation = () => {
      const current = api.getImpersonatedCorporation();
      // If someone set default-corp as impersonated, clear it
      if (current?.slug === 'default-corp' || current?.id === '00000000-0000-0000-0000-000000000001') {
        api.clearImpersonatedCorporation();
        setImpersonatedCorp(null);
      } else {
        setImpersonatedCorp(current);
      }
    };
    syncImpersonation();
    window.addEventListener('dkasigma_impersonation_change', syncImpersonation);
    return () => window.removeEventListener('dkasigma_impersonation_change', syncImpersonation);
  }, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearSession();
    router.push('/login');
  };

  const initials = session?.fullName
    ? session.fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : 'SU';

  return (
    <header
      style={{
        height: '72px',
        borderBottom: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-secondary)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        position: 'sticky',
        top: 0,
        zIndex: 30,
        padding: '0 28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)',
        transition: 'all 0.3s ease',
      }}
    >
      {/* Left: Sidebar Toggle & System Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={toggle}
          style={{
            padding: '9px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
            e.currentTarget.style.color = 'var(--primary-400)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {collapsed ? <Menu size={18} /> : <X size={18} />}
        </button>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '4px 10px',
            borderRadius: '20px',
            backgroundColor: 'rgba(16, 185, 129, 0.08)',
            border: '1px solid rgba(16, 185, 129, 0.2)',
          }}
        >
          <span
            title="Status Sistem: Terhubung (Online)"
            aria-label="Online"
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: 'var(--accent-emerald)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.8)',
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--accent-emerald)', letterSpacing: '0.02em' }}>
            ONLINE
          </span>
        </div>

        {impersonatedCorp && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 14px',
              borderRadius: '24px',
              backgroundColor: 'rgba(245, 158, 11, 0.14)',
              border: '1px solid rgba(245, 158, 11, 0.45)',
              boxShadow: '0 2px 8px rgba(245, 158, 11, 0.12)',
            }}
          >
            <ShieldAlert size={15} style={{ color: '#d97706', flexShrink: 0 }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 800, color: '#b45309', letterSpacing: '0.04em' }}>
                Impersonasi:
              </span>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                {impersonatedCorp.name}
              </span>
            </div>
            <button
              onClick={() => {
                api.clearImpersonatedCorporation();
                window.location.reload();
              }}
              style={{
                background: 'rgba(245, 158, 11, 0.25)',
                border: 'none',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                padding: 0,
                color: '#d97706',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '4px',
                transition: 'all 0.15s ease',
              }}
              title="Hentikan impersonasi"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          style={{
            padding: '9px',
            borderRadius: '10px',
            backgroundColor: 'var(--bg-surface-elevated)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
          }}
          title="Ganti Tema"
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(37, 99, 235, 0.1)';
            e.currentTarget.style.color = 'var(--primary-400)';
            e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
            e.currentTarget.style.color = 'var(--text-secondary)';
            e.currentTarget.style.borderColor = 'var(--border-subtle)';
          }}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* User Profile Menu */}
        <div style={{ position: 'relative' }} ref={profileRef}>
          <button
            onClick={() => setProfileOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '6px 12px 6px 6px',
              borderRadius: '14px',
              backgroundColor: profileOpen ? 'rgba(37, 99, 235, 0.08)' : 'transparent',
              border: '1px solid',
              borderColor: profileOpen ? 'rgba(59, 130, 246, 0.3)' : 'transparent',
              cursor: 'pointer',
              color: 'inherit',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              if (!profileOpen) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
            }}
            onMouseLeave={(e) => {
              if (!profileOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 700,
                boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
              }}
            >
              {initials}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.25 }}>
                {session?.fullName || 'Superadmin'}
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {session?.email || 'admin@hndgroup.id'}
              </div>
            </div>
            <ChevronDown
              size={14}
              style={{
                color: 'var(--text-muted)',
                transform: profileOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                marginLeft: '2px',
              }}
            />
          </button>

          {/* Dropdown Card */}
          {profileOpen && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '240px',
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '16px',
                boxShadow: '0 12px 32px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                zIndex: 50,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'rgba(255, 255, 255, 0.02)' }}>
                <div style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {session?.fullName || 'Superadmin'}
                </div>
                <div style={{ fontSize: '0.725rem', color: 'var(--text-muted)', marginTop: '2px', wordBreak: 'break-all' }}>
                  {session?.email || 'admin@hndgroup.id'}
                </div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginTop: '10px',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(37, 99, 235, 0.1)',
                    width: 'fit-content',
                  }}
                >
                  <ShieldCheck size={13} style={{ color: 'var(--primary-400)' }} />
                  <span style={{ fontSize: '0.675rem', fontWeight: 600, color: 'var(--primary-400)' }}>
                    Super Administrator
                  </span>
                </div>
              </div>

              <div style={{ padding: '8px' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    fontSize: '0.8125rem',
                    color: 'var(--accent-rose)',
                    backgroundColor: 'transparent',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    textAlign: 'left',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'rgba(244, 63, 94, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <LogOut size={16} />
                  Keluar / Logout
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}