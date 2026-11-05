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
  MonitorPlay,
  CalendarDays,
  Layers,
  Cpu,
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
      { name: 'Rundown Operasional', desc: 'Kalender Tayang Layar', href: '/studio/schedules', icon: CalendarDays },
    ],
  },
  {
    heading: 'OPERASI & PERANGKAT',
    items: [
      { name: 'Player', desc: 'Manajemen & Pairing Player', href: '/hardware/displays', icon: Tv },
      { name: 'Player Groups', desc: 'Pengelompokan Groups', href: '/hardware/groups', icon: MonitorPlay },
      { name: 'Chip', desc: 'Internet Of Things', href: '/hardware/iot', icon: Cpu },
    ],
  },
  {
    heading: 'STUDIO & KONTEN',
    items: [
      { name: 'Tata Letak', desc: 'Tata Letak Multi-Zona', href: '/studio/layouts', icon: Palette },
      { name: 'Komponen', desc: 'Widget & Daftar Putar', href: '/studio/components', icon: Layers },
      { name: 'Pustaka', desc: 'Aset Gambar & Video', href: '/studio/media', icon: FolderOpen },
    ],
  },
  {
    heading: 'SISTEM & AKSES',
    items: [
      { name: 'Hak Akses & Peran', desc: 'Pengaturan Akun & Peran', href: '/iam/roles', icon: ShieldCheck },
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
            boxShadow: '0 4px 12px rgba(37, 99, 235, 0.35)',
            flexShrink: 0,
            transition: 'transform 0.2s ease',
          }}
        >
          <Zap size={22} />
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
            <span style={{ fontWeight: 800, fontSize: '1.05rem', letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
              HNDSigma
            </span>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: '6px', backgroundColor: 'rgba(37, 99, 235, 0.15)', color: 'var(--primary-400)', letterSpacing: '0.05em' }}>
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
          padding: '20px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {navGroups.map((group) => (
          <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {!collapsed ? (
              <div
                style={{
                  fontSize: '0.675rem',
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                  color: 'var(--text-muted)',
                  padding: '4px 12px 8px 12px',
                  whiteSpace: 'nowrap',
                }}
              >
                {group.heading}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '8px 4px' }} />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? `${item.name} - ${item.desc || ''}` : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '12px' : '10px 14px',
                    borderRadius: '12px',
                    textDecoration: 'none',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                    border: isActive ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid transparent',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    position: 'relative',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.03)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }
                  }}
                >
                  <Icon
                    size={20}
                    style={{
                      flexShrink: 0,
                      color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                      transition: 'transform 0.2s ease, color 0.2s ease',
                    }}
                  />

                  {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden', gap: '2px' }}>
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: isActive ? 600 : 500,
                          whiteSpace: 'nowrap',
                          lineHeight: 1.25,
                          color: isActive ? 'var(--primary-300)' : 'var(--text-primary)',
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