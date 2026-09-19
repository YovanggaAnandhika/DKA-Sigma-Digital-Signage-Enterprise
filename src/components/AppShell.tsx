'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Tv,
  Palette,
  ListMusic,
  FolderOpen,
  ShieldCheck,
  Zap,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sparkles,
  LogOut,
} from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { getStoredSession, clearSession, UserSession } from '../lib/grpc-client';

interface NavItemDef {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  badgeType?: 'primary' | 'emerald' | 'amber';
}

interface NavSectionDef {
  title: string;
  items: NavItemDef[];
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    const currentSession = getStoredSession();
    setSession(currentSession);
    setIsCheckingAuth(false);

    if (!currentSession && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, isLoginPage, router]);

  const handleLogout = () => {
    clearSession();
    setSession(null);
    router.push('/login');
  };

  // If on login page, render content directly without sidebar or app header
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If unauthenticated or checking auth on protected route, show smooth loading screen
  if (isCheckingAuth || !session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          fontSize: '0.9rem',
          gap: '10px',
        }}
      >
        <Sparkles size={20} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
        <span>Memvalidasi sesi gRPC OmniSign...</span>
      </div>
    );
  }

  const navigationSections: NavSectionDef[] = [
    {
      title: 'Operations & Fleet',
      items: [
        {
          label: 'Overview',
          href: '/',
          icon: <LayoutDashboard size={19} />,
        },
        {
          label: 'Displays & Pairing',
          href: '/displays',
          icon: <Tv size={19} />,
          badge: '3 Units',
          badgeType: 'emerald',
        },
        {
          label: 'Live Simulator',
          href: '/simulator',
          icon: <Zap size={19} />,
          badge: 'Stream',
          badgeType: 'amber',
        },
      ],
    },
    {
      title: 'Studio & Content',
      items: [
        {
          label: 'Layout Designer',
          href: '/layouts',
          icon: <Palette size={19} />,
        },
        {
          label: 'Playlists',
          href: '/playlists',
          icon: <ListMusic size={19} />,
        },
        {
          label: 'Media Library',
          href: '/media',
          icon: <FolderOpen size={19} />,
        },
      ],
    },
    {
      title: 'Access & Security',
      items: [
        {
          label: 'Roles & RBAC',
          href: '/roles',
          icon: <ShieldCheck size={19} />,
        },
      ],
    },
  ];

  return (
    <div className="app-container">
      {/* Refined Modern Sidebar */}
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <Link href="/" className="brand-logo">
            <div className="brand-icon-box">
              <Sparkles size={20} />
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontWeight: 800 }}>OmniSign</span>
                <span className="brand-badge">PRO</span>
              </div>
            )}
          </Link>

          <button
            onClick={() => setCollapsed(!collapsed)}
            className="collapse-toggle-btn"
            title={collapsed ? 'Perluas sidebar' : 'Perkecil sidebar'}
            aria-label="Toggle sidebar collapse"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Navigation Sections */}
        <div className="sidebar-nav-container">
          {navigationSections.map((section, idx) => (
            <div key={idx}>
              {!collapsed && (
                <div className="nav-section-title">{section.title}</div>
              )}
              <ul className="nav-links">
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={`nav-item ${isActive ? 'active' : ''}`}
                        title={collapsed ? item.label : undefined}
                      >
                        <span className="nav-item-icon">{item.icon}</span>
                        {!collapsed && <span>{item.label}</span>}
                        {!collapsed && item.badge && (
                          <span
                            className="nav-item-badge"
                            style={{
                              background:
                                item.badgeType === 'emerald'
                                  ? 'rgba(16, 185, 129, 0.15)'
                                  : item.badgeType === 'amber'
                                  ? 'rgba(245, 158, 11, 0.15)'
                                  : 'rgba(99, 102, 241, 0.15)',
                              color:
                                item.badgeType === 'emerald'
                                  ? '#10b981'
                                  : item.badgeType === 'amber'
                                  ? '#f59e0b'
                                  : '#6366f1',
                            }}
                          >
                            {item.badge}
                          </span>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        {/* Sidebar Footer with User Profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-widget">
            <div className="user-avatar">
              {session.fullName ? session.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
            {!collapsed && (
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {session.fullName || 'Admin User'}
                </div>
                <div
                  style={{
                    fontSize: '0.72rem',
                    color: 'var(--text-muted)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {session.email}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="collapse-toggle-btn"
              title="Keluar (Logout)"
              aria-label="Logout"
              style={{ color: 'var(--accent-rose)' }}
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        {/* Top Control Bar Header */}
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
              Retail Screen Operations Network
            </div>
            <span
              className="badge"
              style={{
                background: 'var(--hover-surface)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-secondary)',
                fontSize: '0.75rem',
              }}
            >
              Envoy Proxy :8080 ➔ gRPC :50051
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span className="badge badge-online">
              <span className="badge-dot"></span> Backend Rust: Online
            </span>

            {/* Dark / Light Mode Toggle Button */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={`Beralih ke mode ${theme === 'dark' ? 'Terang (Light)' : 'Gelap (Dark)'}`}
              aria-label="Toggle Theme Mode"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
          </div>
        </header>

        {/* Page Content Body */}
        <div className="page-body">{children}</div>
      </main>
    </div>
  );
}
