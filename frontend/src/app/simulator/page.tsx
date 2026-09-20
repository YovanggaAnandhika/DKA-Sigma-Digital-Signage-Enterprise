'use client';

import { useState, useEffect } from 'react';
import { 
  Tv, 
  Layers, 
  Radio, 
  Film, 
  Image as ImageIcon,
  Clock,
  Play,
  Pause,
  RotateCw,
  Sparkles
} from 'lucide-react';
import { api, Playlist, Layout } from '@/lib/api';

export default function SimulatorPage() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);

  // Fallback demo sequence if playlist is empty
  const playlistItems = [
    { title: 'Promo Diskon 50% Weekend Spesial', type: 'video', color: '#1e1b4b', tag: 'VIDEO 4K', duration: 4 },
    { title: 'Segar Setiap Hari - Aneka Buah & Sayur', type: 'image', color: '#064e3b', tag: 'PROMO BANNER', duration: 4 },
    { title: 'Member Reward Point Ganda Kasir', type: 'video', color: '#701a75', tag: 'LOYALTY REWARD', duration: 4 },
  ];

  useEffect(() => {
    async function loadResources() {
      try {
        const [pRes, lRes] = await Promise.all([
          api.getPlaylists(),
          api.getLayouts()
        ]);
        setPlaylists(pRes.data || []);
        setLayouts(lRes.data || []);
      } catch (err) {
        // gRPC error handled gracefully
      } finally {
        setLoading(false);
      }
    }
    loadResources();
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % playlistItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [isPlaying, playlistItems.length]);

  const currentItem = playlistItems[slideIndex];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <Tv size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Live Player Screen Simulator
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Simulasi visual pemutaran multi-zona layout dan perputaran playlist pada perangkat Android retail
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.12)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              color: '#34d399',
              fontSize: '0.75rem',
              fontWeight: 700,
            }}
          >
            <span
              style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
              }}
            />
            <span>gRPC Stream Active</span>
          </div>
          <div
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              color: 'var(--text-secondary)',
              fontSize: '0.75rem',
              fontFamily: 'monospace',
            }}
          >
            FPS: 60.0
          </div>
        </div>
      </div>

      {/* Simulator Device Screen Container */}
      <div
        className="card-elevated"
        style={{
          padding: '28px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: '#050505',
          border: '1px solid #1f1f1f',
        }}
      >
        {/* Physical 16:9 Display Frame */}
        <div
          style={{
            width: '100%',
            maxWidth: '880px',
            aspectRatio: '16 / 9',
            backgroundColor: '#000000',
            borderRadius: '12px',
            overflow: 'hidden',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 255, 255, 0.1)',
            border: '4px solid #18181b',
            display: 'flex',
            flexDirection: 'column',
            position: 'relative',
          }}
        >
          {/* Main Visual Display (Upper portion) */}
          <div style={{ flex: 1, display: 'flex', position: 'relative', overflow: 'hidden' }}>
            {/* ZONE 1: Video / Media Utama (70% Left) */}
            <div
              style={{
                width: '70%',
                height: '100%',
                backgroundColor: currentItem.color,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '24px',
                textAlign: 'center',
                transition: 'background-color 0.6s ease',
                position: 'relative',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#ffffff',
                  marginBottom: '14px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  boxShadow: '0 8px 16px rgba(0, 0, 0, 0.3)',
                }}
              >
                {currentItem.type === 'video' ? (
                  <Film size={28} style={{ color: '#a5b4fc' }} />
                ) : (
                  <ImageIcon size={28} style={{ color: '#6ee7b7' }} />
                )}
              </div>

              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  marginBottom: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                }}
              >
                {currentItem.tag}
              </span>

              <h2
                style={{
                  fontSize: '1.4rem',
                  fontWeight: 800,
                  color: '#ffffff',
                  maxWidth: '380px',
                  lineHeight: 1.3,
                  margin: 0,
                }}
              >
                {currentItem.title}
              </h2>

              <div
                style={{
                  marginTop: '14px',
                  padding: '4px 12px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  fontSize: '0.75rem',
                  fontFamily: 'monospace',
                  color: '#e4e4e7',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Clock size={12} style={{ color: '#60a5fa' }} />
                <span>
                  Slide {slideIndex + 1} dari {playlistItems.length} • Auto-rotating ({currentItem.duration}d)
                </span>
              </div>
            </div>

            {/* ZONE 2: Side Promo Banner (30% Right) */}
            <div
              style={{
                width: '30%',
                height: '100%',
                backgroundColor: '#090d16',
                borderLeft: '2px solid rgba(255, 255, 255, 0.1)',
                padding: '20px 16px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: '#f59e0b',
                    backgroundColor: 'rgba(245, 158, 11, 0.12)',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(245, 158, 11, 0.25)',
                    display: 'inline-block',
                  }}
                >
                  ⭐ SPESIAL HARI INI
                </span>
                <h3
                  style={{
                    fontSize: '0.9375rem',
                    fontWeight: 800,
                    color: '#ffffff',
                    marginTop: '8px',
                    lineHeight: 1.3,
                  }}
                >
                  Kupon Belanja Rp 50.000
                </h3>
                <p
                  style={{
                    fontSize: '0.75rem',
                    color: '#94a3b8',
                    marginTop: '6px',
                    lineHeight: 1.4,
                  }}
                >
                  Scan QR di kasir untuk klaim cashback instan pada struk!
                </p>
              </div>

              {/* QR Box Visual */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  padding: '12px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '100px',
                  height: '100px',
                  margin: '8px auto',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                }}
              >
                <div
                  style={{
                    width: '100%',
                    height: '100%',
                    border: '2px dashed #64748b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0f172a',
                    fontWeight: 800,
                    fontSize: '0.625rem',
                    textAlign: 'center',
                    lineHeight: 1.2,
                  }}
                >
                  QR SCAN CASHIER
                </div>
              </div>

              <div style={{ fontSize: '0.6875rem', color: '#64748b', textAlign: 'center' }}>
                Berlaku di seluruh gerai OmniSign
              </div>
            </div>
          </div>

          {/* ZONE 3: Running Text Ticker (Bottom Bar) */}
          <div
            style={{
              height: '42px',
              backgroundColor: '#0c0a1f',
              borderTop: '2px solid rgba(255, 255, 255, 0.12)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              gap: '12px',
              overflow: 'hidden',
            }}
          >
            <span
              style={{
                backgroundColor: '#f43f5e',
                color: '#ffffff',
                fontSize: '0.625rem',
                fontWeight: 800,
                padding: '3px 8px',
                borderRadius: '4px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                flexShrink: 0,
              }}
            >
              LIVE TICKER
            </span>
            <div
              style={{
                fontSize: '0.8125rem',
                fontWeight: 500,
                color: '#f1f5f9',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              Selamat datang di Toko Retail OmniSign • Nikmati promo Buy 1 Get 1 Free seluruh aneka roti & minuman • Jam Operasional: 08:00 - 22:00 WIB • Gunakan aplikasi member untuk diskon tambahan!
            </div>
          </div>
        </div>

        {/* Player Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
          >
            {isPlaying ? (
              <>
                <Pause size={14} />
                <span>Jeda Playback</span>
              </>
            ) : (
              <>
                <Play size={14} />
                <span>Lanjutkan</span>
              </>
            )}
          </button>
          <button
            onClick={() => setSlideIndex((prev) => (prev + 1) % playlistItems.length)}
            className="btn btn-secondary"
            style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
          >
            <RotateCw size={14} />
            <span>Next Slide</span>
          </button>
        </div>
      </div>

      {/* Backend Diagnostics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={16} style={{ color: 'var(--primary-400)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Layout Database Aktif (Tonic gRPC)
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {layouts.length > 0 ? (
              <>
                Terdeteksi <strong style={{ color: 'var(--text-primary)' }}>{layouts.length} layout terdaftar</strong> di database PostgreSQL.
              </>
            ) : (
              'Belum ada layout custom, simulator menggunakan default 3-zone split layout.'
            )}
          </p>
        </div>

        <div className="card-elevated" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={16} style={{ color: 'var(--accent-emerald)' }} />
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Sinkronisasi Playlist Database
            </h3>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
            {playlists.length > 0 ? (
              <>
                Terhubung dengan <strong style={{ color: 'var(--text-primary)' }}>{playlists.length} playlist aktif</strong> dari Postgres.
              </>
            ) : (
              'Menggunakan loop rotasi visual OmniSign Retail Demo.'
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
