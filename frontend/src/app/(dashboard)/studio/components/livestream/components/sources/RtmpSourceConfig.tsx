'use client';

import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { copyToClipboard } from '@/lib/core/copyToClipboard';

interface RtmpSourceConfigProps {
  serverUrl?: string;
  rtmpServerUrl?: string;
  fullRtmpIngestUrl?: string;
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
  rtmpServerUrl,
  fullRtmpIngestUrl,
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

  const fallbackServer = typeof window !== 'undefined' && window.location.hostname
    ? `rtmp://${window.location.hostname}:1935/live`
    : 'rtmp://sigma.dkaapis.test:1935/live';
  const server = serverUrl || rtmpServerUrl || fallbackServer;
  const fullUrl = fullRtmpIngestUrl || `${server}/${streamKey}`;

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* Primary Single Ingest URL */}
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          URL Siaran RTMP
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            readOnly
            value={fullUrl}
            className="form-input"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          />
          <button
            type="button"
            onClick={() => handleCopy(fullUrl, 'full')}
            className="btn btn-outline"
            style={{ padding: '0 12px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
            title="Salin URL RTMP"
          >
            {copiedField === 'full' ? (
              <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={13} />
            )}
            <span>{copiedField === 'full' ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* Format Terpisah untuk OBS Studio */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '8px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
            Server OBS
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              readOnly
              value={server}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                padding: '5px 8px',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(server, 'server')}
              className="btn btn-outline"
              style={{ padding: '0 8px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
              title="Salin Server"
            >
              {copiedField === 'server' ? (
                <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '3px' }}>
            Stream Key
          </label>
          <div style={{ display: 'flex', gap: '4px' }}>
            <input
              type="text"
              readOnly
              value={streamKey}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.72rem',
                padding: '5px 8px',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(streamKey, 'key')}
              className="btn btn-outline"
              style={{ padding: '0 8px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
              title="Salin Key"
            >
              {copiedField === 'key' ? (
                <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
              ) : (
                <Copy size={12} />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* RTMP Authentication */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Autentikasi Pengirim
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
                backgroundColor: '#ffffff',
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
                placeholder="Username siaran"
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
                  placeholder="Password siaran"
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
