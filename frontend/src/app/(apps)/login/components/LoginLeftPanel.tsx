'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Monitor, CheckCircle2 } from 'lucide-react';

const SLIDES = [
  {
    title: 'Kelola Konten Layar Digital Tanpa Batas.',
    description: 'Atur playlist, layer, dan jadwal tampilan dari satu dashboard terpusat yang dirancang untuk skala enterprise.',
    icon: <Zap size={24} color="#34d399" />,
  },
  {
    title: 'Real-Time Sync ke Semua Perangkat.',
    description: 'Perubahan konten tersebar ke seluruh display dalam hitungan detik via gRPC streaming yang andal.',
    icon: <Monitor size={24} color="#60a5fa" />,
  },
  {
    title: 'Multi-Layer. Multi-Layout. Satu Platform.',
    description: 'Buat tata letak layar kompleks dengan layer bertumpuk, transisi, dan jadwal per-layer yang fleksibel.',
    icon: <CheckCircle2 size={24} color="#c084fc" />,
  },
];

export default function LoginLeftPanel() {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  return (
    <div
      style={{
        flex: '0 0 65%',
        width: '65%',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#f8fafc',
        overflow: 'hidden',
        backgroundImage:
          'linear-gradient(to right, #80808014 1px, transparent 1px), linear-gradient(to bottom, #80808014 1px, transparent 1px)',
        backgroundSize: '24px 24px',
      }}
    >
      {/* Gradient blobs */}
      <div style={{ position: 'absolute', top: '-20%', left: '-10%', width: '70%', height: '70%', borderRadius: '50%', background: 'rgba(29,78,216,0.08)', filter: 'blur(120px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '-20%', width: '60%', height: '60%', borderRadius: '50%', background: 'rgba(5,150,105,0.08)', filter: 'blur(120px)', pointerEvents: 'none' }} />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          height: '100%',
          padding: '48px 96px',
        }}
      >
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '48px', height: '48px', borderRadius: '14px',
              backgroundColor: '#1d4ed8',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(29,78,216,0.3)',
            }}
          >
            <Monitor size={24} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>DKASigma</div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', marginTop: '3px', letterSpacing: '0.04em' }}>Enterprise Edition</div>
          </div>
        </div>

        {/* Slides */}
        <div style={{ position: 'relative', maxWidth: '540px', minHeight: '260px' }}>
          {SLIDES.map((slide, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                inset: 0,
                transition: 'opacity 0.7s ease, transform 0.7s ease',
                opacity: i === activeSlide ? 1 : 0,
                transform: i === activeSlide ? 'translateY(0)' : 'translateY(24px)',
                pointerEvents: i === activeSlide ? 'auto' : 'none',
              }}
            >
              <div
                style={{
                  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                  padding: '12px', borderRadius: '16px',
                  backgroundColor: 'rgba(255,255,255,0.6)',
                  border: '1px solid rgba(203,213,225,0.5)',
                  backdropFilter: 'blur(4px)',
                  marginBottom: '24px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
              >
                {slide.icon}
              </div>
              <h1
                style={{
                  fontSize: '2.5rem',
                  fontWeight: 800,
                  color: '#0f172a',
                  lineHeight: 1.15,
                  letterSpacing: '-0.025em',
                  marginBottom: '16px',
                }}
              >
                {slide.title}
              </h1>
              <p style={{ fontSize: '1.0625rem', color: '#475569', lineHeight: 1.7, fontWeight: 300 }}>
                {slide.description}
              </p>
            </div>
          ))}
        </div>

        {/* Slide dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '48px' }}>
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setActiveSlide(i)}
              aria-label={`Slide ${i + 1}`}
              style={{
                height: '6px',
                width: i === activeSlide ? '32px' : '8px',
                borderRadius: '99px',
                backgroundColor: i === activeSlide ? '#1d4ed8' : '#cbd5e1',
                border: 'none', cursor: 'pointer', padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
