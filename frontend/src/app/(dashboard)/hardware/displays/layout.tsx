'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Tv, MonitorPlay } from 'lucide-react';

interface DisplaysLayoutProps {
  children: React.ReactNode;
}

export default function DisplaysLayout({ children }: DisplaysLayoutProps) {
  const pathname = usePathname();
  const normalizedPath = pathname?.replace(/\/$/, '') || '';

  // Tabs only show on the main root tab index pages
  const isRootTabPage = [
    '/hardware/displays',
    '/hardware/displays/player',
    '/hardware/displays/groups',
  ].includes(normalizedPath);

  if (!isRootTabPage) {
    return <>{children}</>;
  }

  const tabs = [
    {
      id: 'player',
      label: 'Layar Pemutar',
      href: '/hardware/displays/player',
      icon: Tv,
    },
    {
      id: 'groups',
      label: 'Grup Layar',
      href: '/hardware/displays/groups',
      icon: MonitorPlay,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
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
            <Tv size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Layar Pemutar
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              Manajemen registrasi display player, pengelompokan grup layar, dan status operasional perangkat.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <nav className="dashboard-tabs" aria-label="Navigasi layar dan grup">
        {tabs.map((tab) => {
          const isActive = normalizedPath === tab.href || (normalizedPath === '/hardware/displays' && tab.id === 'player');
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
