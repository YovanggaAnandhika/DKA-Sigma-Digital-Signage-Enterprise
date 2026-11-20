'use client';

import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface RtspSourceConfigProps {
  sourceUrl: string;
  onChangeSourceUrl: (val: string) => void;
  relayMode: 'SERVER' | 'DIRECT';
  onChangeRelayMode: (mode: 'SERVER' | 'DIRECT') => void;
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
  relayMode,
  onChangeRelayMode,
  requiresAuth,
  onToggleAuth,
  username,
  onChangeUsername,
  password,
  onChangePassword,
}: RtspSourceConfigProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: '4px',
          }}
        >
          URL RTSP Feed Kamera
        </label>
        <input
          type="text"
          value={sourceUrl}
          onChange={(e) => onChangeSourceUrl(e.target.value)}
          placeholder="rtsp://192.168.1.50:554/Streaming/Channels/101"
          className="form-input"
          style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}
          required
        />
      </div>

      {/* Mode Pengiriman RTSP */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label
          style={{
            display: 'block',
            fontSize: '0.75rem',
            fontWeight: 600,
            color: 'var(--text-secondary)',
          }}
        >
          Mode Pengiriman RTSP
        </label>
        <div
          role="radiogroup"
          aria-label="Mode Pengiriman RTSP"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            padding: '3px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: 'var(--bg-primary)',
            border: '1px solid var(--border-subtle)',
            width: 'fit-content',
            gap: '4px',
          }}
        >
          <button
            type="button"
            role="radio"
            aria-checked={relayMode === 'SERVER'}
            onClick={() => onChangeRelayMode('SERVER')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor:
                relayMode === 'SERVER' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: relayMode === 'SERVER' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: relayMode === 'SERVER' ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            Relay Server UDP (Multi-Layar)
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={relayMode === 'DIRECT'}
            onClick={() => onChangeRelayMode('DIRECT')}
            style={{
              padding: '5px 12px',
              borderRadius: 'var(--radius-full)',
              border: 'none',
              backgroundColor:
                relayMode === 'DIRECT' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: relayMode === 'DIRECT' ? 'var(--text-primary)' : 'var(--text-muted)',
              fontSize: '0.74rem',
              fontWeight: relayMode === 'DIRECT' ? 600 : 500,
              cursor: 'pointer',
            }}
          >
            Direct LAN (Player ke Kamera)
          </button>
        </div>
        <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          {relayMode === 'SERVER'
            ? 'Backend menarik 1 koneksi H.264 dari kamera lalu menyebar lewat UDP 8189 ke banyak layar & CMS.'
            : 'Android terhubung langsung ke IP kamera di jaringan LAN (termasuk audio AAC kamera).'}
        </div>
      </div>

      {/* RTSP Camera Authentication */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Autentikasi Kamera
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={requiresAuth}
            onClick={() => onToggleAuth(!requiresAuth)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              width: '32px',
              height: '18px',
              padding: '2px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: requiresAuth ? 'var(--primary-600)' : 'var(--border-strong)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                backgroundColor: 'var(--bg-surface)',
                transform: requiresAuth ? 'translateX(14px)' : 'translateX(0)',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
        </div>

        {requiresAuth && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => onChangeUsername(e.target.value)}
                placeholder="Username kamera"
                className="form-input"
                style={{ fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onChangePassword(e.target.value)}
                  placeholder="Password kamera"
                  className="form-input"
                  style={{ paddingRight: '32px', fontSize: '0.75rem' }}
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
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  title={showPassword ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
