'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Video } from 'lucide-react';

interface RtspSourceConfigProps {
  sourceUrl: string;
  onChangeSourceUrl: (val: string) => void;
  requiresAuth: boolean;
  onToggleAuth: (val: boolean) => void;
  username: string;
  onChangeUsername: (val: string) => void;
  password: string;
  onChangePassword: (val: string) => void;
}

export default function RtspSourceConfig({
  sourceUrl,
  onChangeSourceUrl,
  requiresAuth,
  onToggleAuth,
  username,
  onChangeUsername,
  password,
  onChangePassword,
}: RtspSourceConfigProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          URL RTSP Feed Kamera
        </label>
        <input
          type="text"
          value={sourceUrl}
          onChange={(e) => onChangeSourceUrl(e.target.value)}
          placeholder="rtsp://192.168.1.50:554/Streaming/Channels/101"
          className="form-input"
          style={{ fontFamily: 'monospace', fontSize: '0.76rem' }}
          required
        />
        <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', marginTop: '3px', display: 'block' }}>
          Masukkan alamat IP dan port RTSP feed kamera CCTV lokal.
        </span>
      </div>

      {/* RTSP Camera Authentication */}
      <div
        style={{
          padding: '10px 12px',
          borderRadius: '10px',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Shield size={14} style={{ color: requiresAuth ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
            <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Kredensial Login Kamera
            </span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={requiresAuth}
            onClick={() => onToggleAuth(!requiresAuth)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              width: '36px',
              height: '20px',
              padding: '2px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: requiresAuth ? 'var(--accent-emerald)' : 'var(--bg-surface)',
              border: `1px solid ${requiresAuth ? 'var(--accent-emerald)' : 'var(--border-strong)'}`,
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                transform: requiresAuth ? 'translateX(16px)' : 'translateX(0)',
                transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </button>
        </div>

        {requiresAuth && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                Username Kamera
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => onChangeUsername(e.target.value)}
                placeholder="admin"
                className="form-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                Password Kamera
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onChangePassword(e.target.value)}
                  placeholder="Password kamera"
                  className="form-input"
                  style={{ paddingRight: '36px' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title={showPassword ? 'Sembunyikan Password' : 'Lihat Password'}
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
