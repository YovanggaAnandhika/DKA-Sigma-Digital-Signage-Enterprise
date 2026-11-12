'use client';

import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff } from 'lucide-react';
import { copyToClipboard } from '@/lib/core/copyToClipboard';

interface SrtSourceConfigProps {
  serverUrl: string;
  streamKey: string;
  requiresAuth: boolean;
  onToggleAuth: (val: boolean) => void;
  username: string;
  onChangeUsername: (val: string) => void;
  password: string;
  onChangePassword: (val: string) => void;
}

export default function SrtSourceConfig({
  serverUrl,
  streamKey,
  requiresAuth,
  onToggleAuth,
  username,
  onChangeUsername,
  password,
  onChangePassword,
}: SrtSourceConfigProps) {
  const [copied, setCopied] = useState(false);
  const [showUrl, setShowUrl] = useState(false);

  const streamId = requiresAuth
    ? `#!::m=publish,r=live/${streamKey},u=${encodeURIComponent(username)},s=${encodeURIComponent(password)}`
    : `publish:live/${streamKey}`;
  const srtUrl = `${serverUrl}?streamid=${encodeURIComponent(streamId)}&pkt_size=1316`;

  const handleCopy = async () => {
    if (await copyToClipboard(srtUrl)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <div>
        <label
          htmlFor="srt-ingest-url"
          style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}
        >
          URL Ingest SRT (UDP)
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <input
              id="srt-ingest-url"
              type={requiresAuth && !showUrl ? 'password' : 'text'}
              readOnly
              value={srtUrl}
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: '0.75rem', paddingRight: requiresAuth ? '34px' : undefined }}
            />
            {requiresAuth && (
              <button
                type="button"
                onClick={() => setShowUrl(!showUrl)}
                aria-label={showUrl ? 'Sembunyikan URL SRT' : 'Tampilkan URL SRT'}
                title={showUrl ? 'Sembunyikan URL' : 'Tampilkan URL'}
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
                  padding: 0,
                }}
              >
                {showUrl ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-outline"
            style={{ padding: '0 12px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
            title="Salin URL SRT"
          >
            {copied ? <Check size={13} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={13} />}
            <span>{copied ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
        OBS harus mengirim melalui SRT caller. Pastikan UDP/8890 diteruskan ke <code>dka-product-sigma-streamer:8890</code> di Nginx Proxy Manager.
      </p>

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
              <label htmlFor="srt-ingest-username" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Username
              </label>
              <input
                id="srt-ingest-username"
                type="text"
                value={username}
                onChange={(event) => onChangeUsername(event.target.value)}
                placeholder="Username siaran"
                className="form-input"
                style={{ fontSize: '0.75rem' }}
              />
            </div>
            <div>
              <label htmlFor="srt-ingest-password" style={{ display: 'block', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '3px' }}>
                Password
              </label>
              <input
                id="srt-ingest-password"
                type="password"
                value={password}
                onChange={(event) => onChangePassword(event.target.value)}
                placeholder="Password siaran"
                className="form-input"
                style={{ fontSize: '0.75rem' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
