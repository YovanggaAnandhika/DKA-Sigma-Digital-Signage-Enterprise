'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Monitor, Compass, LayoutGrid, History } from 'lucide-react';

interface LayoutsLayoutProps {
  children: React.ReactNode;
}

export default function LayoutsLayout({ children }: LayoutsLayoutProps) {
  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, '') || '';

  // Tabs only show on the main root tab index pages
  const isRootTabPage = [
    '/studio/layouts',
    '/studio/layouts/data',
    '/studio/layouts/history',
    '/studio/layouts/resolusi',
    '/studio/layouts/orientasi',
  ].includes(normalizedPath);

  if (!isRootTabPage) {
    return <>{children}</>;
  }

  const tabs = [
    {
      id: 'data',
      label: 'Data Layout',
      href: '/studio/layouts/data',
      icon: LayoutGrid,
    },
    {
      id: 'history',
      label: 'Riwayat Ubah',
      href: '/studio/layouts/history',
      icon: History,
    },
    {
      id: 'resolusi',
      label: 'Master Resolusi',
      href: '/studio/layouts/resolusi',
      icon: Monitor,
    },
    {
      id: 'orientasi',
      label: 'Master Orientasi',
      href: '/studio/layouts/orientasi',
      icon: Compass,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Palette size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Layout
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              Manajemen tata letak multi-layer dan zona layar promosi retail.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <nav className="dashboard-tabs" aria-label="Navigasi layout">
        {tabs.map((tab) => {
          const isActive = normalizedPath === tab.href;
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              className="dashboard-tab"
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon size={19} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Content for Active Tab */}
      <div>{children}</div>
    </div>
  );
}
