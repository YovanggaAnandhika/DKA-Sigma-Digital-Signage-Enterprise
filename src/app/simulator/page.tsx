'use client';

import { useState, useEffect } from 'react';

export default function SimulatorPage() {
  const [slideIndex, setSlideIndex] = useState(0);

  const playlistItems = [
    { title: 'Promo Diskon 50% Weekend', type: 'video', color: '#312e81', duration: 4 },
    { title: 'Segar Setiap Hari - Buah & Sayur', type: 'image', color: '#065f46', duration: 4 },
    { title: 'Member Reward Point Ganda', type: 'video', color: '#831843', duration: 4 },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % playlistItems.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [playlistItems.length]);

  const currentItem = playlistItems[slideIndex];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Live Android Player Screen Simulator
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Simulasi visual langsung pemutaran layout multi-kotak dan perputaran playlist pada layar retail
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <span className="badge badge-online">
            <span className="badge-dot"></span> Protocol: gRPC Stream Active
          </span>
          <span className="badge" style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--text-primary)' }}>
            Manifest Hash: #a982f1b
          </span>
        </div>
      </div>

      {/* Simulator Device Frame */}
      <div className="glass-panel" style={{ padding: '24px', background: '#020617', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={{
          width: '960px',
          height: '540px',
          background: '#000',
          position: 'relative',
          borderRadius: '8px',
          overflow: 'hidden',
          boxShadow: '0 25px 60px rgba(0,0,0,0.9), 0 0 40px rgba(99, 102, 241, 0.2)',
          border: '4px solid #1e293b',
        }}>
          {/* ZONE 1: Video Utama (Left 70%) */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '672px',
            height: '480px',
            background: currentItem.color,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '32px',
            transition: 'background-color 0.8s ease',
          }}>
            <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>
              {currentItem.type === 'video' ? '🎬' : '🖼️'}
            </div>
            <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', textAlign: 'center' }}>
              {currentItem.title}
            </div>
            <div style={{ marginTop: '12px', background: 'rgba(0,0,0,0.5)', padding: '4px 14px', borderRadius: '20px', fontSize: '0.8rem', color: '#a5b4fc' }}>
              Slide {slideIndex + 1} of {playlistItems.length} • Auto-rotating ({currentItem.type})
            </div>
          </div>

          {/* ZONE 2: Side Banner (Right 30%) */}
          <div style={{
            position: 'absolute',
            left: '672px',
            top: 0,
            width: '288px',
            height: '480px',
            background: '#0f172a',
            borderLeft: '2px solid rgba(255,255,255,0.1)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            padding: '24px',
          }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--accent-amber)', textTransform: 'uppercase' }}>
                ⭐ SPESIAL HARI INI
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '8px' }}>
                Kupon Belanja Rp 50.000
              </div>
              <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '8px' }}>
                Scan QR di kasir untuk klaim cashback instan!
              </div>
            </div>

            <div style={{
              background: '#fff',
              padding: '16px',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '140px',
            }}>
              <div style={{ color: '#000', fontWeight: 800, fontSize: '1rem', textAlign: 'center' }}>
                [QR CODE KASIR]
              </div>
            </div>

            <div style={{ fontSize: '0.7rem', color: '#64748b', textAlign: 'center' }}>
              Berlaku di seluruh gerai retail OmniSign
            </div>
          </div>

          {/* ZONE 3: Bottom Ticker Text (Full Width Bottom) */}
          <div style={{
            position: 'absolute',
            left: 0,
            bottom: 0,
            width: '100%',
            height: '60px',
            background: 'linear-gradient(90deg, #1e1b4b, #311042)',
            borderTop: '2px solid rgba(255, 255, 255, 0.15)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            overflow: 'hidden',
          }}>
            <div style={{
              background: 'var(--accent-rose)',
              color: 'var(--text-primary)',
              fontSize: '0.75rem',
              fontWeight: 800,
              padding: '3px 10px',
              borderRadius: '4px',
              marginRight: '16px',
              flexShrink: 0,
            }}>
              FLASH INFO
            </div>
            <div style={{
              color: '#f8fafc',
              fontSize: '0.9rem',
              fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Selamat datang di Toko Kami! Nikmati promo Beli 2 Gratis 1 untuk aneka roti & minuman segar hari ini • Jam Operasional: 08.00 - 22.00 WIB • Download aplikasi OmniRetail untuk diskon tambahan!
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
