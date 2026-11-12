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
  CalendarDays,
  Layers,
  Cpu,
  Building,
  Smartphone,
  Radio,
} from 'lucide-react';
import { useSidebar } from './SidebarProvider';

interface NavItem {
  name: string;
  description: string;
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
    heading: 'Utama',
    items: [
      {
        name: 'Ringkasan',
        description: 'Dashboard & status sistem',
        href: '/',
        icon: LayoutDashboard,
      },
      {
        name: 'Jadwal Tayang',
        description: 'Atur jadwal siaran konten',
        href: '/studio/schedules',
        icon: CalendarDays,
      },
    ],
  },
  {
    heading: 'Perangkat',
    items: [
      {
        name: 'Layar',
        description: 'Manajemen player & display',
        href: '/hardware/displays',
        icon: Tv,
      },
      {
        name: 'Perangkat IoT',
        description: 'Monitoring hardware & sensor',
        href: '/hardware/iot',
        icon: Cpu,
      },
    ],
  },
  {
    heading: 'Konten',
    items: [
      {
        name: 'Tata Letak',
        description: 'Desain layout & template',
        href: '/studio/layouts',
        icon: Palette,
      },
      {
        name: 'Komponen',
        description: 'Widget & elemen konten',
        href: '/studio/components',
        icon: Layers,
      },
      {
        name: 'Pustaka Media',
        description: 'Manajemen aset video & gambar',
        href: '/studio/media',
        icon: FolderOpen,
      },
    ],
  },
  {
    heading: 'Sistem',
    items: [
      {
        name: 'Identitas Perusahaan',
        description: 'Profil & pengaturan korporasi',
        href: '/iam/identity',
        icon: Building,
      },
      {
        name: 'Hak Akses',
        description: 'Manajemen role & permission',
        href: '/iam/roles',
        icon: ShieldCheck,
      },
      {
        name: 'Pembaruan Sistem',
        description: 'Distribusi APK & firmware',
        href: '/system/apk',
        icon: Smartphone,
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
        width: collapsed ? '72px' : '260px',
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
        transition: 'width 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, var(--primary-500), var(--primary-700))',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          <Radio size={19} strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <span
              style={{
                fontWeight: 800,
                fontSize: '1rem',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              HND Signage
            </span>
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 500,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
              }}
            >
              Signage Platform
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
          padding: collapsed ? '16px 8px' : '16px 12px',
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
                  color: 'var(--text-muted)',
                  padding: '4px 10px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
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

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? `${item.name} - ${item.description}` : undefined}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: collapsed ? '10px' : '9px 12px',
                    borderRadius: '12px',
                    backgroundColor: isActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.04)' : 'none',
                    border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                  }}
                  className="sidebar-nav-link-hover"
                >
                  {/* Active Indicator Line on Left (when expanded) */}
                  {isActive && !collapsed && (
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        top: '25%',
                        bottom: '25%',
                        width: '3px',
                        backgroundColor: 'var(--primary-500)',
                        borderRadius: '0 4px 4px 0',
                      }}
                    />
                  )}

                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      backgroundColor: isActive ? 'var(--primary-500)' : 'var(--bg-surface)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      flexShrink: 0,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Icon size={17} strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>

                  {!collapsed && (
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1 }}>
                      <span
                        style={{
                          fontSize: '0.8125rem',
                          fontWeight: isActive ? 700 : 600,
                          color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          lineHeight: 1.2,
                        }}
                      >
                        {item.name}
                      </span>
                      <span
                        style={{
                          fontSize: '0.675rem',
                          fontWeight: 400,
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          marginTop: '2px',
                        }}
                      >
                        {item.description}
                      </span>
                    </div>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.625rem',
                        padding: '2px 6px',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface)',
                        color: 'var(--text-secondary)',
                        border: '1px solid var(--border-subtle)',
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