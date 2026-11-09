'use client';

import React from 'react';
import Link from 'next/link';
import {
  ListMusic,
  Ticket,
  Globe,
  Images,
  MessageSquareText,
  Clock,
  Radio,
} from 'lucide-react';

interface ComponentModule {
  id: string;
  title: string;
  description: string;
  href: string;
  icon: React.ElementType;
}

const MODULES: ComponentModule[] = [
  {
    id: 'playlists',
    title: 'Daftar Putar',
    description: 'Urutan penayangan video dan foto promosi per zona layar secara terjadwal.',
    href: '/studio/components/playlists',
    icon: ListMusic,
  },
  {
    id: 'ticket',
    title: 'Nomor Antrian',
    description: 'Sistem panggilan antrean loket terintegrasi tombol fisik dan suara panggilan.',
    href: '/studio/components/ticket',
    icon: Ticket,
  },
  {
    id: 'webview',
    title: 'Web View',
    description: 'Sematkan halaman web interaktif, dasbor analitik, atau sistem berbasis web.',
    href: '/studio/components/webview',
    icon: Globe,
  },
  {
    id: 'album',
    title: 'Album Foto',
    description: 'Galeri foto promosi produk bergulir otomatis dengan efek transisi sinematik.',
    href: '/studio/components/album',
    icon: Images,
  },
  {
    id: 'ticker',
    title: 'Teks Berjalan',
    description: 'Running text untuk pengumuman singkat, berita kilat, atau teks selamat datang.',
    href: '/studio/components/ticker',
    icon: MessageSquareText,
  },
  {
    id: 'clock',
    title: 'Jam & Cuaca',
    description: 'Penunjuk jam digital/analog dan informasi cuaca lokasi setempat secara realtime.',
    href: '/studio/components/clock',
    icon: Clock,
  },
  {
    id: 'livestream',
    title: 'Siaran Langsung',
    description: 'Tayangan siaran langsung kamera RTMP, WHIP, RTSP CCTV, atau video stream.',
    href: '/studio/components/livestream',
    icon: Radio,
  },
];

export default function ComponentsHubPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Page Header */}
      <div>
        <h1
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            letterSpacing: '-0.02em',
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Komponen Layar
        </h1>
        <p
          style={{
            fontSize: '0.8125rem',
            color: 'var(--text-muted)',
            margin: '4px 0 0 0',
          }}
        >
          Pilih modul widget di bawah untuk mengelola materi tayangan dan elemen interaktif.
        </p>
      </div>

      {/* Minimalist Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '14px',
        }}
      >
        {MODULES.map((item) => {
          const Icon = item.icon;

          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                textDecoration: 'none',
                color: 'inherit',
                display: 'flex',
              }}
            >
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px 18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '10px',
                  width: '100%',
                  transition: 'border-color 0.15s ease, background-color 0.15s ease',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-strong)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.backgroundColor = 'var(--bg-surface)';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '34px',
                      height: '34px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-secondary)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--text-secondary)',
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={18} strokeWidth={1.8} />
                  </div>

                  <h3
                    style={{
                      margin: 0,
                      fontSize: '0.925rem',
                      fontWeight: 600,
                      letterSpacing: '-0.01em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.title}
                  </h3>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.8125rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                  }}
                >
                  {item.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
