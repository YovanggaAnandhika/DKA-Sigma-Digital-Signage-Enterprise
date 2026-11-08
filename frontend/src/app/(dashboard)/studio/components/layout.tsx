'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  ArrowLeft,
  ListMusic,
  Globe,
  Images,
  Ticket,
  MessageSquareText,
  Clock,
  Radio,
} from 'lucide-react';

const MODULE_META: Record<string, { title: string; subtitle: string; icon: React.ElementType }> = {
  playlists: {
    title: 'Daftar Putar',
    subtitle: 'Kelola urutan dan durasi penayangan video & foto promosi.',
    icon: ListMusic,
  },
  ticket: {
    title: 'Nomor Antrian',
    subtitle: 'Kelola data antrean, pemanggilan nomor, dan riwayat.',
    icon: Ticket,
  },
  webview: {
    title: 'Web View',
    subtitle: 'Tampilkan halaman web langsung atau portal informasi interaktif.',
    icon: Globe,
  },
  album: {
    title: 'Album Foto',
    subtitle: 'Kelola galeri slideshow foto produk, dokumentasi, dan promosi.',
    icon: Images,
  },
  ticker: {
    title: 'Teks Berjalan',
    subtitle: 'Kelola pengumuman running text dan headline informasi penting.',
    icon: MessageSquareText,
  },
  clock: {
    title: 'Jam & Cuaca',
    subtitle: 'Widget penunjuk waktu aktual, kalender, dan perkiraan cuaca.',
    icon: Clock,
  },
  livestream: {
    title: 'Siaran Langsung',
    subtitle: 'Kelola feed RTSP CCTV, HLS (.m3u8), RTMP, YouTube Live, dan Server HLS Relay.',
    icon: Radio,
  },
};

export default function ComponentsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isHubPage = pathname === '/studio/components';
  const isCreateOrEdit = pathname.includes('/create') || pathname.includes('/edit');

  // If we are on the Hub Page (/studio/components), render children directly without wrappers/headers
  if (isHubPage) {
    return <div style={{ width: '100%' }}>{children}</div>;
  }

  // Detect which module we are in
  const pathParts = pathname.split('/');
  // pathname format: /studio/components/<module_name>/...
  const moduleKey = pathParts[3] || '';
  const currentMeta = MODULE_META[moduleKey];
  const Icon = currentMeta?.icon;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', ...(isCreateOrEdit ? { flex: 1, minHeight: 0 } : {}) }}>
      {/* Sub-module Header with Circular Back Button pointing back to /studio/components */}
      {!isCreateOrEdit && currentMeta && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/studio/components"
              className="btn btn-outline"
              style={{
                width: '42px',
                minWidth: '42px',
                height: '42px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '50%',
                border: '1px solid var(--border-subtle)',
              }}
              aria-label="Kembali ke Menu Komponen"
              title="Kembali ke Menu Komponen"
            >
              <ArrowLeft size={18} />
            </Link>

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
                {Icon && <Icon size={22} />}
              </div>
              <div>
                <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                  {currentMeta.title}
                </h1>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                  {currentMeta.subtitle}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Render Active Route Page */}
      <div style={isCreateOrEdit ? { flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' } : undefined}>
        {children}
      </div>
    </div>
  );
}
