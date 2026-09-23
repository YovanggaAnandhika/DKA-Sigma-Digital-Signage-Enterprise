'use client';

import React, { useState } from 'react';
import { ShieldAlert, ArrowRight, Monitor } from 'lucide-react';
import { loginWithGrpc, saveSession } from '@/lib/auth';

interface LoginFormProps {
  setIsExiting: (val: boolean) => void;
}

export default function LoginForm({ setIsExiting }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      const session = await loginWithGrpc(email, password);
      saveSession(session);
      setIsExiting(true);
      window.location.href = '/';
    } catch (err: any) {
      setErrorMsg(err.message || 'Login gagal. Periksa kembali kredensial Anda.');
      setLoading(false);
    }
  };

  return (
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
  );
}
