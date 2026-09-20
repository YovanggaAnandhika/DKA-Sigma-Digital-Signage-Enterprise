'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { loginWithGrpc, saveSession } from '../../lib/grpc-client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('admin@dkasigma.io');
  const [password, setPassword] = useState('DKASigma123!');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg(err.message || 'Login gagal. Periksa kembali email dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#000000',
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background Radial Glow */}
      <div
        style={{
          position: 'absolute',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(0, 0, 0, 0) 70%)',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main Elevated Card Panel */}
      <div
        className="card-elevated"
        style={{
          position: 'relative',
          zIndex: 1,
          width: '100%',
          maxWidth: '440px',
          padding: '40px 36px',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
          backgroundColor: '#0a0a0a',
          border: '1px solid #222222',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.75)',
        }}
      >
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '14px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 8px 24px rgba(37, 99, 235, 0.35)',
            }}
          >
            <Sparkles size={28} />
          </div>

          <h1
            style={{
              fontSize: '1.625rem',
              fontWeight: 800,
              letterSpacing: '-0.025em',
              color: '#ffffff',
              lineHeight: 1.2,
            }}
          >
            DKASigma Enterprise
          </h1>
          <p
            style={{
              fontSize: '0.8125rem',
              color: '#a1a1aa',
              marginTop: '8px',
              lineHeight: 1.4,
            }}
          >
            Masuk ke panel kontrol signage via Rust Tonic gRPC & Envoy
          </p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#fda4af',
              fontSize: '0.8125rem',
              lineHeight: 1.4,
            }}
          >
            <AlertCircle size={18} style={{ color: '#f43f5e', flexShrink: 0, marginTop: '1px' }} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#e4e4e7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Mail size={15} style={{ color: '#60a5fa' }} />
              <span>Email Administrator</span>
            </label>
            <input
              type="email"
              required
              className="form-input"
              style={{
                padding: '10px 14px',
                fontSize: '0.875rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
              }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@dkasigma.io"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <label
              style={{
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#e4e4e7',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Lock size={15} style={{ color: '#60a5fa' }} />
              <span>Password</span>
            </label>
            <input
              type="password"
              required
              className="form-input"
              style={{
                padding: '10px 14px',
                fontSize: '0.875rem',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                border: '1px solid #27272a',
                borderRadius: '8px',
                color: '#ffffff',
              }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.8125rem',
              color: '#a1a1aa',
              paddingTop: '2px',
            }}
          >
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                defaultChecked
                style={{ accentColor: '#2563eb', width: '15px', height: '15px', cursor: 'pointer' }}
              />
              <span>Ingat sesi ini</span>
            </label>
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                color: '#60a5fa',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                padding: '2px 8px',
                borderRadius: '4px',
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              Argon2id + JWT
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '12px',
              fontSize: '0.875rem',
              fontWeight: 700,
              marginTop: '6px',
              borderRadius: '8px',
              backgroundColor: '#2563eb',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            {loading ? (
              <span>Menghubungkan ke gRPC...</span>
            ) : (
              <>
                <span>Masuk ke Dashboard</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Footnote */}
        <div
          style={{
            paddingTop: '18px',
            borderTop: '1px solid #222222',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            fontSize: '0.75rem',
            color: '#71717a',
          }}
        >
          <ShieldCheck size={16} style={{ color: '#10b981' }} />
          <span>Multi-table RBAC • Envoy Proxy & TLS Active</span>
        </div>
      </div>
    </div>
  );
}
