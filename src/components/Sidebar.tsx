'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tv,
  Palette,
  ListMusic,
  FolderOpen,
  ShieldCheck,
  Zap,
  Activity,
  ChevronRight,
  ChevronDown,
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';

interface NavItem {
  name: string;
  desc?: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    heading: 'UTAMA',
    items: [
      { name: 'Ringkasan', desc: 'Ikhtisar & Metrik Layar', href: '/', icon: LayoutDashboard },
      { name: 'Live Monitor', desc: 'Status Streaming & Telemetri', href: '/simulator', icon: Activity, badge: 'Live' },
    ],
  },
  {
    heading: 'OPERASI & PERANGKAT',
    items: [
      { name: 'Layar Retail', desc: 'Manajemen & Pairing Player', href: '/displays', icon: Tv },
    ],
  },
  {
    heading: 'STUDIO & KONTEN',
    items: [
      { name: 'Desain Layout', desc: 'Canvas Multi-Zona & Tata Letak', href: '/layouts', icon: Palette },
      { name: 'Daftar Putar', desc: 'Urutan & Durasi Media', href: '/playlists', icon: ListMusic },
      { name: 'Pustaka Media', desc: 'Aset Gambar & Video Promosi', href: '/media', icon: FolderOpen },
    ],
  },
  {
    heading: 'SISTEM & AKSES',
    items: [
      { name: 'Hak Akses & Role', desc: 'RBAC & Manajemen Pengguna', href: '/roles', icon: ShieldCheck },
    ],
  },
];

export function Sidebar() {
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: collapsed ? '68px' : '260px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '2px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 40,
        flexShrink: 0,
        transition: 'width 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '2px 0 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: collapsed ? '0 14px' : '0 20px',
          borderBottom: '2px solid var(--border-subtle)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '12px',
            backgroundColor: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)',
            flexShrink: 0,
          }}
        >
          <Zap size={20} />
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              OmniSign PRO
            </div>
            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Sistem Retail Signage
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '16px 8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {navGroups.map((group) => (
          <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {!collapsed ? (
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  color: 'var(--text-muted)',
                  padding: '4px 12px 6px 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.heading}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 0 8px 0' }} />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '10px' : '9px 12px',
                    borderRadius: '10px',
                    fontSize: '0.8125rem',
                    fontWeight: isActive ? 600 : 500,
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={18} style={{ flexShrink: 0, color: isActive ? 'var(--primary-500)' : 'inherit' }} />
                  {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                      <span style={{ whiteSpace: 'nowrap', lineHeight: 1.2 }}>{item.name}</span>
                      {item.desc && (
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px', whiteSpace: 'nowrap' }}>
                          {item.desc}
                        </span>
                      )}
                    </div>
                  )}
                  {!collapsed && item.badge && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.625rem',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        backgroundColor: 'rgba(16, 185, 129, 0.15)',
                        color: 'var(--accent-emerald)',
                        border: '1px solid rgba(16, 185, 129, 0.3)',
                      }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </div>
    </aside>
  );
}
