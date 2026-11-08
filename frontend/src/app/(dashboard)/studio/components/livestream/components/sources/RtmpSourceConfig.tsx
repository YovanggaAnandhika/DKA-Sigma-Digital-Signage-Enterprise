'use client';

import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Shield } from 'lucide-react';
import { copyToClipboard } from '@/lib/core/copyToClipboard';

interface RtmpSourceConfigProps {
  serverUrl: string;
  streamKey: string;
  requiresAuth: boolean;
  onToggleAuth: (val: boolean) => void;
  username: string;
  onChangeUsername: (val: string) => void;
  password: string;
  onChangePassword: (val: string) => void;
}

export default function RtmpSourceConfig({
  serverUrl,
  streamKey,
  requiresAuth,
  onToggleAuth,
  username,
  onChangeUsername,
  password,
  onChangePassword,
}: RtmpSourceConfigProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Server RTMP & Stream Key */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Server RTMP OBS
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              readOnly
              value={serverUrl}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(serverUrl, 'server')}
              className="btn btn-outline"
              style={{ padding: '0 10px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
              title="Salin Server RTMP"
            >
              {copiedField === 'server' ? (
                <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Copy size={12} />
              )}
              <span>{copiedField === 'server' ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            Stream Key
          </label>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              readOnly
              value={streamKey}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.74rem',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(streamKey, 'key')}
              className="btn btn-outline"
              style={{ padding: '0 10px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
              title="Salin Stream Key"
            >
              {copiedField === 'key' ? (
                <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Copy size={12} />
              )}
              <span>{copiedField === 'key' ? 'Disalin' : 'Salin'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* RTMP Authentication (Username & Password) */}
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
              Autentikasi Pengirim (OBS RTMP)
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
                Username Ingest
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => onChangeUsername(e.target.value)}
                placeholder="Contoh: obs_user"
                className="form-input"
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                Password Ingest
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onChangePassword(e.target.value)}
                  placeholder="Password siaran"
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
