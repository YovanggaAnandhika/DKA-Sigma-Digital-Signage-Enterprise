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
  ArrowRight,
  Sparkles,
  Layers,
} from 'lucide-react';

interface ComponentModule {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  badgeColor: string;
  badgeBg: string;
  description: string;
  href: string;
  icon: React.ElementType;
  gradient: string;
  shadowColor: string;
  features: string[];
}

const MODULES: ComponentModule[] = [
  {
    id: 'playlists',
    title: 'Daftar Putar',
    subtitle: 'Playlist Media & Urutan Tayang',
    badge: 'Media Playlist',
    badgeColor: '#3b82f6',
    badgeBg: 'rgba(59, 130, 246, 0.12)',
    description: 'Kelola urutan, durasi, dan transisi penayangan video & foto promosi per zona layar secara terjadwal.',
    href: '/studio/components/playlists',
    icon: ListMusic,
    gradient: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
    shadowColor: 'rgba(59, 130, 246, 0.3)',
    features: ['Urutan Loop', 'Mode Shuffle', 'Preset Durasi Detik'],
  },
  {
    id: 'ticket',
    title: 'Nomor Antrian',
    subtitle: 'Sistem Panggilan & Loket Cerdas',
    badge: 'Antrean & IoT',
    badgeColor: '#f59e0b',
    badgeBg: 'rgba(245, 158, 11, 0.12)',
    description: 'Sistem panggilan antrean loket kasir/teller, integrasi tombol fisik IoT, dan suara TTS Bahasa Indonesia.',
    href: '/studio/components/ticket',
    icon: Ticket,
    gradient: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
    shadowColor: 'rgba(245, 158, 11, 0.3)',
    features: ['Tombol Fisik IoT', 'Suara Panggilan TTS', 'Display Loket Sektor'],
  },
  {
    id: 'webview',
    title: 'Web View',
    subtitle: 'Sematkan Situs & URL Interaktif',
    badge: 'Live Web Stream',
    badgeColor: '#10b981',
    badgeBg: 'rgba(16, 185, 129, 0.12)',
    description: 'Tampilkan halaman web interaktif, dashboard analitik internal, CCTV streaming, atau sistem berbasis cloud.',
    href: '/studio/components/webview',
    icon: Globe,
    gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    shadowColor: 'rgba(16, 185, 129, 0.3)',
    features: ['Auto Refresh Interval', 'Skala Zoom Kustom', 'Bypass Cache Browser'],
  },
  {
    id: 'album',
    title: 'Album Foto',
    subtitle: 'Galeri Foto & Slide Dinamis',
    badge: 'Galeri Visual',
    badgeColor: '#8b5cf6',
    badgeBg: 'rgba(139, 92, 246, 0.12)',
    description: 'Galeri foto promosi katalog produk bergulir otomatis dengan efek transisi sinematik Ken Burns.',
    href: '/studio/components/album',
    icon: Images,
    gradient: 'linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%)',
    shadowColor: 'rgba(139, 92, 246, 0.3)',
    features: ['Transisi Ken Burns', 'Label Promo Badge', 'Tag Harga Produk'],
  },
  {
    id: 'ticker',
    title: 'Teks Berjalan',
    subtitle: 'Running Text & Berita Kilat',
    badge: 'Running Text',
    badgeColor: '#ec4899',
    badgeBg: 'rgba(236, 72, 153, 0.12)',
    description: 'Teks berjalan untuk pengumuman singkat, berita kilat, promo harga coret, atau teks selamat datang.',
    href: '/studio/components/ticker',
    icon: MessageSquareText,
    gradient: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)',
    shadowColor: 'rgba(236, 72, 153, 0.3)',
    features: ['Kecepatan Ticker Dinamis', 'Badge Kategori Teks', 'Kustomisasi Warna HDR'],
  },
  {
    id: 'clock',
    title: 'Jam & Cuaca',
    subtitle: 'Widget Penunjuk Waktu & Cuaca',
    badge: 'Informasi Realtime',
    badgeColor: '#06b6d4',
    badgeBg: 'rgba(6, 182, 212, 0.12)',
    description: 'Widget penunjuk jam digital/analog dan prakiraan cuaca otomatis kota setempat yang estetis.',
    href: '/studio/components/clock',
    icon: Clock,
    gradient: 'linear-gradient(135deg, #06b6d4 0%, #0284c7 100%)',
    shadowColor: 'rgba(6, 182, 212, 0.3)',
    features: ['Tema Frosted Glass', 'Pilihan Kota Otomatis', 'Format 12/24 Jam & Detik'],
  },
  {
    id: 'livestream',
    title: 'Siaran Langsung',
    subtitle: 'Live Streaming & Server HLS Relay',
    badge: 'Dual-Mode Stream',
    badgeColor: '#f43f5e',
    badgeBg: 'rgba(244, 63, 94, 0.12)',
    description: 'Tayangkan feed RTSP CCTV, HLS (.m3u8), RTMP OBS, atau YouTube Live dengan dukungan Server HLS Relay Origin.',
    href: '/studio/components/livestream',
    icon: Radio,
    gradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 100%)',
    shadowColor: 'rgba(244, 63, 94, 0.3)',
    features: ['Server HLS Relay', 'RTSP CCTV & RTMP', 'Low-Latency & Auto-Retry'],
  },
];

export default function ComponentsHubPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px', width: '100%' }}>
      {/* Hero / Header Section */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '20px',
          paddingBottom: '24px',
          borderBottom: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, var(--primary-500) 0%, var(--primary-700) 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 8px 24px rgba(2, 132, 199, 0.25)',
              flexShrink: 0,
            }}
          >
            <Layers size={28} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  color: 'var(--text-primary)',
                  margin: 0,
                }}
              >
                Komponen Studio
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(2, 132, 199, 0.12)',
                  color: 'var(--primary-400)',
                  border: '1px solid rgba(2, 132, 199, 0.25)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Sparkles size={12} />
                {MODULES.length} Modul Widget
              </span>
            </div>
            <p
              style={{
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                margin: '6px 0 0 0',
                lineHeight: 1.5,
                maxWidth: '620px',
              }}
            >
              Pilih modul widget di bawah untuk mengelola materi tayangan, widget antrean, tautan web live, dan elemen interaktif multi-zona layar signage.
            </p>
          </div>
        </div>
      </div>

      {/* Aesthetic Card Grid Menu */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
          gap: '22px',
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
                flexDirection: 'column',
              }}
            >
              <div
                className="card-elevated"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: '18px',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  height: '100%',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: 'var(--card-shadow)',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(-4px)';
                  el.style.borderColor = item.badgeColor;
                  el.style.boxShadow = `0 14px 34px -8px ${item.shadowColor}, var(--card-shadow)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.transform = 'translateY(0)';
                  el.style.borderColor = 'var(--border-subtle)';
                  el.style.boxShadow = 'var(--card-shadow)';
                }}
              >
                {/* Header: Icon & Badge */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div
                    style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '14px',
                      background: item.gradient,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#ffffff',
                      boxShadow: `0 6px 18px ${item.shadowColor}`,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={24} />
                  </div>

                  <span
                    style={{
                      fontSize: '0.725rem',
                      fontWeight: 700,
                      padding: '4px 10px',
                      borderRadius: '8px',
                      backgroundColor: item.badgeBg,
                      color: item.badgeColor,
                      letterSpacing: '0.02em',
                      border: `1px solid ${item.badgeColor}22`,
                    }}
                  >
                    {item.badge}
                  </span>
                </div>

                {/* Content: Title & Description */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                  <h3
                    style={{
                      margin: 0,
                      fontSize: '1.15rem',
                      fontWeight: 800,
                      letterSpacing: '-0.02em',
                      color: 'var(--text-primary)',
                    }}
                  >
                    {item.title}
                  </h3>
                  <span
                    style={{
                      fontSize: '0.775rem',
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {item.subtitle}
                  </span>
                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '0.85rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.55,
                    }}
                  >
                    {item.description}
                  </p>
                </div>

                {/* Chips / Key Capabilities */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {item.features.map((feat, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {feat}
                    </span>
                  ))}
                </div>

                {/* Card Footer: CTA Action */}
                <div
                  style={{
                    paddingTop: '14px',
                    borderTop: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                  }}
                >
                  <span
                    style={{
                      fontSize: '0.825rem',
                      fontWeight: 700,
                      color: item.badgeColor,
                    }}
                  >
                    Buka Modul
                  </span>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '8px',
                      backgroundColor: item.badgeBg,
                      color: item.badgeColor,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease',
                    }}
                  >
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
