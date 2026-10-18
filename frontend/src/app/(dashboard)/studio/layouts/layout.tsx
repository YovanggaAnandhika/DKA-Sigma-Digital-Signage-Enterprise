'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Palette, Monitor, Compass, LayoutGrid } from 'lucide-react';

interface LayoutsLayoutProps {
  children: React.ReactNode;
}

export default function LayoutsLayout({ children }: LayoutsLayoutProps) {
  const pathname = usePathname();

  const tabs = [
    {
      id: 'data',
      label: 'Data Layout',
      href: '/studio/layouts/data',
      icon: LayoutGrid,
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
        }}
      >
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.id}
              href={tab.href}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                borderBottom: isActive ? '2px solid var(--primary-500)' : '2px solid transparent',
                borderRadius: '8px 8px 0 0',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
            >
              <Icon size={16} style={{ color: isActive ? 'var(--primary-400)' : 'var(--text-muted)' }} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>

      {/* Content for Active Tab */}
      <div>{children}</div>
    </div>
  );
}
