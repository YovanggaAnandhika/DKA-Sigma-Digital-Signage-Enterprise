'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CheckCircle2, Cpu } from 'lucide-react';

export default function IotLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isEditPage = pathname.includes('/edit');

  if (isEditPage) return <>{children}</>;

  const tabs = [
    { href: '/hardware/iot/devices', label: 'Perangkat disetujui', icon: Cpu },
    { href: '/hardware/iot/approval', label: 'Menunggu persetujuan', icon: CheckCircle2 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <header style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          padding: '12px',
          borderRadius: '16px',
          backgroundColor: 'rgba(37, 99, 235, 0.12)',
          color: 'var(--primary-400)',
          border: '1px solid rgba(59, 130, 246, 0.25)',
          display: 'flex',
        }}>
          <Cpu size={24} />
        </div>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>Perangkat IoT</h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Kelola persetujuan perangkat dan konfigurasi tombol.
          </p>
        </div>
      </header>

      <nav
        aria-label="Navigasi perangkat IoT"
        className="card-elevated"
        style={{
          padding: '5px',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '10px',
        }}
      >
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={active ? 'page' : undefined}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 14px',
                borderRadius: '7px',
                textDecoration: 'none',
                whiteSpace: 'nowrap',
                backgroundColor: active ? 'var(--primary-600)' : 'transparent',
                color: active ? '#fff' : 'var(--text-secondary)',
                fontWeight: active ? 600 : 500,
                fontSize: '0.8125rem',
              }}
            >
              <Icon size={15} />
              {tab.label}
            </Link>
          );
        })}
      </nav>

      <div>{children}</div>
    </div>
  );
}
