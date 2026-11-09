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
        href: '/',
        icon: LayoutDashboard,
      },
      {
        name: 'Jadwal Tayang',
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
        href: '/hardware/displays',
        icon: Tv,
      },
      {
        name: 'Perangkat IoT',
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
        href: '/studio/layouts',
        icon: Palette,
      },
      {
        name: 'Komponen',
        href: '/studio/components',
        icon: Layers,
      },
      {
        name: 'Pustaka Media',
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
        href: '/iam/identity',
        icon: Building,
      },
      {
        name: 'Hak Akses',
        href: '/iam/roles',
        icon: ShieldCheck,
      },
      {
        name: 'Pembaruan Sistem',
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
        width: collapsed ? '64px' : '240px',
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
        transition: 'width 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      {/* Brand Header */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: collapsed ? '0 16px' : '0 20px',
          borderBottom: '1px solid var(--border-subtle)',
          justifyContent: collapsed ? 'center' : 'flex-start',
        }}
      >
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '8px',
            backgroundColor: 'var(--primary-600)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffffff',
            flexShrink: 0,
          }}
        >
          <Radio size={17} strokeWidth={2.2} />
        </div>
        {!collapsed && (
          <span
            style={{
              fontWeight: 700,
              fontSize: '0.975rem',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            HNDSigma
          </span>
        )}
      </div>

      {/* Navigation Sections */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '12px 6px' : '14px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
        }}
      >
        {navGroups.map((group) => (
          <div key={group.heading} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {!collapsed ? (
              <div
                style={{
                  fontSize: '0.675rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  padding: '4px 10px 4px 10px',
                  whiteSpace: 'nowrap',
                  letterSpacing: '0.02em',
                }}
              >
                {group.heading}
              </div>
            ) : (
              <div style={{ borderTop: '1px solid var(--border-subtle)', margin: '4px 2px' }} />
            )}

            {group.items.map((item) => {
              const Icon = item.icon;
              const isActive = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={collapsed ? item.name : undefined}
                  className={`sidebar-nav-item ${isActive ? 'is-active' : ''}`}
                  style={{
                    padding: collapsed ? '0' : '0 10px',
                    justifyContent: collapsed ? 'center' : 'flex-start',
                    gap: '10px',
                  }}
                >
                  {isActive && !collapsed && (
                    <div className="sidebar-active-indicator" />
                  )}

                  <div className="sidebar-nav-icon">
                    <Icon
                      size={18}
                      strokeWidth={isActive ? 2 : 1.75}
                    />
                  </div>

                  {!collapsed && (
                    <span
                      style={{
                        fontSize: '0.8125rem',
                        fontWeight: isActive ? 600 : 500,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: 1,
                      }}
                    >
                      {item.name}
                    </span>
                  )}

                  {!collapsed && item.badge && (
                    <span
                      style={{
                        marginLeft: 'auto',
                        fontSize: '0.625rem',
                        padding: '1px 6px',
                        borderRadius: '9999px',
                        fontWeight: 600,
                        backgroundColor: 'var(--bg-surface-elevated)',
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
