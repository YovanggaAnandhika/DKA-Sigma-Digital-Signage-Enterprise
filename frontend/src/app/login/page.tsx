'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, AlertCircle, Monitor } from 'lucide-react';
import { loginWithGrpc, saveSession } from '../../lib/grpc-client';

const slides = [
  {
    headline: 'Kelola Konten Layar Digital Tanpa Batas.',
    sub: 'Atur playlist, zona, dan jadwal tampilan dari satu dashboard terpusat yang dirancang untuk skala enterprise.',
  },
  {
    headline: 'Real-Time Sync ke Semua Perangkat.',
    sub: 'Perubahan konten tersebar ke seluruh display dalam hitungan detik via gRPC streaming.',
  },
  {
    headline: 'Multi-Zona. Multi-Layout. Satu Platform.',
    sub: 'Buat tata letak layar kompleks dengan zona bertumpuk, transisi, dan jadwal per-zona.',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setSlideIndex((i) => (i + 1) % slides.length);
    }, 4500);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const session = await loginWithGrpc(email, password);
      saveSession(session);
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali kredensial Anda.');
    } finally {
      setLoading(false);
    }
  };

  const slide = slides[slideIndex];

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Outfit', sans-serif",
      }}
    >
      {/* ── LEFT PANEL ── */}
      <div
        style={{
          flex: 1,
          backgroundColor: '#f0f2f5',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          padding: '36px 48px',
          overflow: 'hidden',
          // Grid background
          backgroundImage:
            'linear-gradient(rgba(0,0,0,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,0.06) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      >
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              backgroundColor: '#1d4ed8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(29,78,216,0.35)',
            }}
          >
            <Monitor size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#0f172a', lineHeight: 1 }}>
              DKASigma
            </div>
            <div style={{ fontSize: '0.6875rem', color: '#64748b', letterSpacing: '0.04em', marginTop: '2px' }}>
              Enterprise Edition
            </div>
          </div>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Hero Content */}
        <div style={{ maxWidth: '420px' }}>
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              backgroundColor: 'rgba(29,78,216,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '20px',
            }}
          >
            <Zap size={18} color="#1d4ed8" fill="#1d4ed8" />
          </div>

          <h1
            key={slideIndex}
            style={{
              fontSize: '1.875rem',
              fontWeight: 800,
              color: '#0f172a',
              lineHeight: 1.25,
              marginBottom: '12px',
              animation: 'fadeSlide 0.5s ease',
            }}
          >
            {slide.headline}
          </h1>
          <p
            key={slideIndex + '-sub'}
            style={{
              fontSize: '0.9375rem',
              color: '#475569',
              lineHeight: 1.65,
              animation: 'fadeSlide 0.5s ease',
            }}
          >
            {slide.sub}
          </p>
        </div>

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Slide dots */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setSlideIndex(i)}
              style={{
                width: i === slideIndex ? '24px' : '8px',
                height: '8px',
                borderRadius: '99px',
                backgroundColor: i === slideIndex ? '#1d4ed8' : '#cbd5e1',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes fadeSlide {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div
        style={{
          width: '420px',
          flexShrink: 0,
          backgroundColor: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '56px 48px',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.07)',
        }}
      >
        <div style={{ marginBottom: '32px' }}>
          <h2
            style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              color: '#0f172a',
              marginBottom: '6px',
            }}
          >
            Selamat Datang
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.5 }}>
            Silakan masuk menggunakan kredensial admin Anda untuk mengakses dashboard manajemen.
          </p>
        </div>

        {/* Error */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: '#fef2f2',
              border: '1px solid #fecaca',
              color: '#b91c1c',
              fontSize: '0.8125rem',
              marginBottom: '20px',
            }}
          >
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '1px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {/* Email */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
              Username
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Masukkan username"
              style={{
                padding: '11px 14px',
                fontSize: '0.9375rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#0f172a',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1d4ed8'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {/* Password */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: '#374151' }}>
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                padding: '11px 14px',
                fontSize: '0.9375rem',
                border: '1px solid #d1d5db',
                borderRadius: '8px',
                color: '#0f172a',
                backgroundColor: '#fff',
                outline: 'none',
                transition: 'border-color 0.15s',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1d4ed8'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#d1d5db'; }}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '6px',
              padding: '13px',
              fontSize: '0.9375rem',
              fontWeight: 700,
              borderRadius: '8px',
              border: 'none',
              backgroundColor: loading ? '#93c5fd' : '#1d4ed8',
              color: '#ffffff',
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#1e40af'; }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.backgroundColor = '#1d4ed8'; }}
          >
            {loading ? (
              <span>Menghubungkan...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footer */}
        <div
          style={{
            marginTop: 'auto',
            paddingTop: '40px',
            fontSize: '0.75rem',
            color: '#94a3b8',
            textAlign: 'center',
          }}
        >
          © {new Date().getFullYear()} PT. DKA Research Center. All rights reserved.
        </div>
      </div>
    </div>
  );
}
