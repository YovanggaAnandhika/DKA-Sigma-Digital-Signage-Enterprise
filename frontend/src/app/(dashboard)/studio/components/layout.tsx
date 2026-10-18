'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Layers,
  ListMusic,
  Globe,
  Images,
  Ticket,
  MessageSquareText,
  Clock,
} from 'lucide-react';

const TABS = [
  { id: 'playlists', label: 'Daftar Putar', href: '/studio/components/playlists', icon: ListMusic },
  { id: 'webview', label: 'Web View', href: '/studio/components/webview', icon: Globe },
  { id: 'album', label: 'Album Foto', href: '/studio/components/album', icon: Images },
  { id: 'ticket', label: 'Nomor Antrian', href: '/studio/components/ticket', icon: Ticket },
  { id: 'ticker', label: 'Teks Berjalan', href: '/studio/components/ticker', icon: MessageSquareText },
  { id: 'clock', label: 'Jam & Cuaca', href: '/studio/components/clock', icon: Clock },
];

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCreateOrEdit = pathname.includes('/create') || pathname.includes('/edit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...(isCreateOrEdit ? { flex: 1, minHeight: 0 } : {}) }}>
      {/* Top Header & Tab Navigation Bar on List Pages */}
      {!isCreateOrEdit && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  padding: '10px',
                  borderRadius: '12px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Layers size={22} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Komponen
                </h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Kelola modul konten dan widget interaktif signage.
                </p>
              </div>
            </div>
          </div>

          {/* Route path-based Tab Navigation Bar */}
          <div
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
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = pathname.startsWith(tab.href);

              return (
                <Link
                  key={tab.id}
                  href={tab.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 14px',
                    borderRadius: '7px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 600 : 500,
                    fontSize: '0.8125rem',
                  }}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Render Active Route Page */}
      <div style={isCreateOrEdit ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}>{children}</div>
    </div>
  );
}
