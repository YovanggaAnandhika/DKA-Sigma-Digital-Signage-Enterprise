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
  { id: 'webview', label: 'Web View', href: '/studio/components/webview', badge: 'Auto-Refresh', icon: Globe },
  { id: 'album', label: 'Album Foto', href: '/studio/components/album', badge: 'Ken Burns', icon: Images },
  { id: 'ticket', label: 'Nomor Antrian', href: '/studio/components/ticket', badge: 'Audio Chime', icon: Ticket },
  { id: 'ticker', label: 'Teks Berjalan', href: '/studio/components/ticker', icon: MessageSquareText },
  { id: 'clock', label: 'Jam & Cuaca', href: '/studio/components/clock', icon: Clock },
];

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isCreateOrEdit = pathname.includes('/create') || pathname.includes('/edit');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header & Tab Navigation Bar on List Pages */}
      {!isCreateOrEdit && (
        <>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  padding: '12px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--primary-400)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                }}
              >
                <Layers size={24} />
              </div>
              <div>
                <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                  Komponen Konten Layar
                </h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Pusat pengelolaan widget dan komponen promosi: Daftar Putar, Web View, Album Foto, Nomor Antrian, Teks Berjalan, dan Jam & Cuaca.
                </p>
              </div>
            </div>
          </div>

          {/* Route path-based Tab Navigation Bar */}
          <div
            className="card-elevated"
            style={{
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              backgroundColor: 'var(--bg-secondary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
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
                    padding: '10px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
                    color: isActive ? '#ffffff' : 'var(--text-secondary)',
                    fontWeight: isActive ? 700 : 500,
                    fontSize: '0.8125rem',
                    boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span
                      style={{
                        fontSize: '0.625rem',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '9999px',
                        backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(59, 130, 246, 0.15)',
                        color: isActive ? '#ffffff' : 'var(--primary-400)',
                      }}
                    >
                      {tab.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </>
      )}

      {/* Render Active Route Page */}
      <div>{children}</div>
    </div>
  );
}
