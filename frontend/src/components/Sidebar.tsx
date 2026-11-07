'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Tv,
  Palette,
  FolderOpen,
  ShieldCheck,
  Zap,
  CalendarDays,
  Layers,
  Cpu,
  Building,
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';

interface NavItem {
  name: string;
  desc?: string;
  href: string;
  icon: React.ComponentType<any>;
  badge?: string;
  color: string;
  rgb: string;
  gradient: string;
}

interface NavGroup {
  heading: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    heading: 'UTAMA',
    items: [
      {
        name: 'Ringkasan',
        desc: 'Ikhtisar & Metrik Layar',
        href: '/',
        icon: LayoutDashboard,
        color: '#2563eb',
        rgb: '37, 99, 235',
        gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      },
      {
        name: 'Rundown Operasional',
        desc: 'Kalender Tayang Layar',
        href: '/studio/schedules',
        icon: CalendarDays,
        color: '#d97706',
        rgb: '217, 119, 6',
        gradient: 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)',
      },
    ],
  },
  {
    heading: 'OPERASI & PERANGKAT',
    items: [
      {
        name: 'Player',
        desc: 'Manajemen & Pairing Player',
        href: '/hardware/displays',
        icon: Tv,
        color: '#0284c7',
        rgb: '2, 132, 199',
        gradient: 'linear-gradient(135deg, #38bdf8 0%, #0369a1 100%)',
      },
      {
        name: 'Chip',
        desc: 'Internet Of Things',
        href: '/hardware/iot',
        icon: Cpu,
        color: '#059669',
        rgb: '5, 150, 105',
        gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)',
      },
    ],
  },
  {
    heading: 'STUDIO & KONTEN',
    items: [
      {
        name: 'Tata Letak',
        desc: 'Tata Letak Multi-Zona',
        href: '/studio/layouts',
        icon: Palette,
        color: '#7c3aed',
        rgb: '124, 58, 237',
        gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
      },
      {
        name: 'Komponen',
        desc: 'Widget & Daftar Putar',
        href: '/studio/components',
        icon: Layers,
        color: '#db2777',
        rgb: '219, 39, 119',
        gradient: 'linear-gradient(135deg, #ec4899 0%, #be185d 100%)',
      },
      {
        name: 'Pustaka',
        desc: 'Aset Gambar & Video',
        href: '/studio/media',
        icon: FolderOpen,
        color: '#4f46e5',
        rgb: '79, 70, 229',
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4338ca 100%)',
      },
    ],
  },
  {
    heading: 'SISTEM & AKSES',
    items: [
      {
        name: 'Identitas',
        desc: 'Perusahaan & Cabang',
        href: '/iam/identity',
        icon: Building,
        color: '#0d9488',
        rgb: '13, 148, 136',
        gradient: 'linear-gradient(135deg, #14b8a6 0%, #0f766e 100%)',
      },
      {
        name: 'Hak Akses & Peran',
        desc: 'Pengaturan Akun & Peran',
        href: '/iam/roles',
        icon: ShieldCheck,
        color: '#ea580c',
        rgb: '234, 88, 12',
        gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)',
      },
    ],
  },
];

export function Sidebar() {
  const { collapsed } = useSidebar();
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: collapsed ? '76px' : '280px',
        backgroundColor: 'var(--bg-secondary)',
        borderRight: '1px solid var(--border-subtle)',
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 40,
        flexShrink: 0,
        transition: 'width 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: '4px 0 24px rgba(0, 0, 0, 0.04)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
          padding: collapsed ? '0 18px' : '0 24px',
          borderBottom: '1px solid var(--border-subtle)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
            flexShrink: 0,
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            cursor: 'default',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.05) rotate(-2deg)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
          }}
        >
          <Zap size={22} />
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              HNDSigma
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 700,
                padding: '2px 6px',
                borderRadius: '6px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--primary-500)',
                letterSpacing: '0.05em',
                border: '1px solid rgba(37, 99, 235, 0.2)',
              }}
            >
              PRO
            </span>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '16px 8px' : '18px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {navGroups.map((group) => (
          <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!collapsed ? (
              <div
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.09em',
                  color: 'var(--text-muted)',
                  padding: '4px 10px 6px 10px',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.heading}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '6px 4px' }} />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              const itemVars = {
                '--item-color': item.color,
                '--item-gradient': item.gradient,
                '--item-bg': `rgba(${item.rgb}, 0.08)`,
                '--item-border': `rgba(${item.rgb}, 0.18)`,
                '--item-bg-hover': `rgba(${item.rgb}, 0.16)`,
                '--item-border-hover': `rgba(${item.rgb}, 0.32)`,
                '--item-active-bg': `rgba(${item.rgb}, 0.09)`,
                '--item-active-border': `rgba(${item.rgb}, 0.22)`,
                '--item-glow': `rgba(${item.rgb}, 0.32)`,
              } as React.CSSProperties;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? `${item.name} - ${item.desc || ''}` : undefined}
                  className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                  style={{
                    ...itemVars,
                    padding: collapsed ? '9px 0' : '8px 10px',
                    gap: '12px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                  }}
                >
                  {isActive && !collapsed && (
                    <div className="sidebar-active-indicator" />
                  )}

                  <div
                    className="sidebar-icon-squircle"
                    style={{
                      width: collapsed ? '40px' : '34px',
                      height: collapsed ? '40px' : '34px',
                    }}
                  >
                    <Icon
                      size={collapsed ? 20 : 18}
                      strokeWidth={2.2}
                      style={{
                        flexShrink: 0,
                      }}
                    />
                  </div>

                  {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: '2px' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 500,
                          whiteSpace: 'nowrap',
                          lineHeight: 1.25,
                          color: 'var(--text-primary)',
                          transition: 'color 0.15s ease',
                        }}
                      >
                        {item.name}
                      </span>
                      {item.desc && (
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 400,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            color: 'var(--text-muted)',
                            lineHeight: 1.2,
                          }}
                        >
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
                        padding: '2px 6px',
                        borderRadius: '9999px',
                        fontWeight: 700,
                        backgroundColor: `rgba(${item.rgb}, 0.15)`,
                        color: item.color,
                        border: `1px solid rgba(${item.rgb}, 0.3)`,
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
