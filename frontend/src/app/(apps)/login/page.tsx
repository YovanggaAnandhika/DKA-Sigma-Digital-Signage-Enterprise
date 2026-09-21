'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, ArrowRight, ShieldAlert, Monitor, CheckCircle2 } from 'lucide-react';
import { loginWithGrpc, saveSession } from '../../lib/grpc-client';

const SLIDES = [
  {
    title: 'Kelola Konten Layar Digital Tanpa Batas.',
    description: 'Atur playlist, zona, dan jadwal tampilan dari satu dashboard terpusat yang dirancang untuk skala enterprise.',
    icon: <Zap size={24} color="#34d399" />,
  },
  {
    title: 'Real-Time Sync ke Semua Perangkat.',
    description: 'Perubahan konten tersebar ke seluruh display dalam hitungan detik via gRPC streaming yang andal.',
    icon: <Monitor size={24} color="#60a5fa" />,
  },
  {
    title: 'Multi-Zona. Multi-Layout. Satu Platform.',
    description: 'Buat tata letak layar kompleks dengan zona bertumpuk, transisi, dan jadwal per-zona yang fleksibel.',
    icon: <CheckCircle2 size={24} color="#c084fc" />,
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSlide, setActiveSlide] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const session = await loginWithGrpc(email, password);
      saveSession(session);
      setIsExiting(true);
      setTimeout(() => {
        router.push('/');
        router.refresh();
      }, 500);
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali kredensial Anda.');
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        minHeight: '100vh',
        width: '100vw',
        overflow: 'hidden',
        fontFamily: "'Inter', 'Outfit', system-ui, sans-serif",
        backgroundColor: '#fff',
      }}
    >
      {/* ══ LEFT PANEL (65%) ══ */}
      <div
        style={{
          flex: '0 0 65%',
          width: '65%',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#f8fafc',
          overflow: 'hidden',
          // Grid
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

      {/* ══ RIGHT PANEL (35%) ══ */}
      <div
        style={{
          flex: '1',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          borderLeft: '1px solid #e2e8f0',
          backgroundColor: '#ffffff',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '48px 64px',
            maxWidth: '480px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          <div style={{ marginBottom: '40px' }}>
            <h2
              style={{
                fontSize: '1.875rem',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.02em',
                marginBottom: '8px',
              }}
            >
              Selamat Datang
            </h2>
            <p style={{ fontSize: '0.875rem', color: '#64748b', lineHeight: 1.6 }}>
              Silakan masuk menggunakan kredensial admin Anda untuk mengakses dashboard manajemen.
            </p>
          </div>

          {/* Error */}
          {errorMsg && (
            <div
              style={{
                display: 'flex', alignItems: 'flex-start', gap: '12px',
                padding: '14px 16px', borderRadius: '12px',
                backgroundColor: '#fff1f2', border: '1px solid #fecdd3',
                color: '#be123c', fontSize: '0.875rem',
                marginBottom: '20px',
              }}
            >
              <ShieldAlert size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span style={{ fontWeight: 500, lineHeight: 1.5 }}>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Username */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Username
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan username"
                style={{
                  width: '100%', padding: '12px 16px',
                  fontSize: '0.9375rem',
                  border: '1px solid #d1d5db', borderRadius: '12px',
                  color: '#0f172a', backgroundColor: '#fff',
                  outline: 'none', boxSizing: 'border-box',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1d4ed8';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            {/* Password */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.875rem', fontWeight: 600, color: '#374151' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  width: '100%', padding: '12px 16px',
                  fontSize: '0.9375rem', fontFamily: 'monospace',
                  border: '1px solid #d1d5db', borderRadius: '12px',
                  color: '#0f172a', backgroundColor: '#fff',
                  outline: 'none', boxSizing: 'border-box',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = '#1d4ed8';
                  e.currentTarget.style.boxShadow = '0 0 0 3px rgba(29,78,216,0.12)';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db';
                  e.currentTarget.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '8px',
                width: '100%', padding: '14px',
                fontSize: '0.9375rem', fontWeight: 600,
                borderRadius: '12px', border: 'none',
                backgroundColor: loading ? '#93c5fd' : '#1d4ed8',
                color: '#fff',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                boxShadow: loading ? 'none' : '0 8px 24px rgba(29,78,216,0.25)',
                transition: 'all 0.15s ease',
                letterSpacing: '0.01em',
              }}
              onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = '#1e40af'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,78,216,0.35)'; } }}
              onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.backgroundColor = '#1d4ed8'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(29,78,216,0.25)'; } }}
            >
              {loading ? (
                <span>Sedang Memverifikasi...</span>
              ) : (
                <>
                  <span>Masuk ke Dashboard</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <p style={{ marginTop: '40px', textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8' }}>
            © {new Date().getFullYear()} PT. DKA Research Center. All rights reserved.
          </p>
        </div>
      </div>

      {/* ══ EXIT OVERLAY ══ */}
      {isExiting && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.3s ease',
          }}
        >
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '96px', height: '96px', borderRadius: '50%', border: '4px solid transparent', borderTopColor: '#1d4ed8', borderRightColor: '#34d399', borderBottomColor: '#60a5fa', borderLeftColor: '#c084fc', animation: 'spin 1s linear infinite' }} />
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', backgroundColor: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Monitor size={28} color="#1d4ed8" />
            </div>
          </div>
          <p style={{ marginTop: '28px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.15em', color: '#1d4ed8', textTransform: 'uppercase' }}>
            Memuat Dashboard
          </p>
          <style>{`
            @keyframes spin { to { transform: rotate(360deg); } }
            @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
          `}</style>
        </div>
      )}
    </div>
  );
}
