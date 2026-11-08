'use client';

import React, { useState } from 'react';
import { Check, Copy, Lock } from 'lucide-react';

interface ObsIngestCardProps {
  serverUrl: string;
  streamKey: string;
  requiresAuth?: boolean;
  username?: string;
  password?: string;
}

export default function ObsIngestCard({
  serverUrl,
  streamKey,
  requiresAuth = false,
  username = '',
  password = '',
}: ObsIngestCardProps) {
  const [copiedField, setCopiedField] = useState<'server' | 'key' | 'user' | 'pass' | null>(null);

  const handleCopy = (text: string, field: 'server' | 'key' | 'user' | 'pass') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        padding: '10px 12px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '10px',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Server RTMP OBS
            </label>
            <span style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
              Siap Ingest
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              readOnly
              value={serverUrl}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                padding: '5px 8px',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(serverUrl, 'server')}
              className="btn btn-outline"
              style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
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
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
            <label
              style={{
                fontSize: '0.68rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}
            >
              Stream Key
            </label>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
              UUID
            </span>
          </div>
          <div style={{ display: 'flex', gap: '6px' }}>
            <input
              type="text"
              readOnly
              value={streamKey}
              className="form-input"
              style={{
                fontFamily: 'monospace',
                fontSize: '0.75rem',
                padding: '5px 8px',
                backgroundColor: 'var(--bg-primary)',
              }}
            />
            <button
              type="button"
              onClick={() => handleCopy(streamKey, 'key')}
              className="btn btn-outline"
              style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
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

      {requiresAuth && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '10px',
            paddingTop: '6px',
            borderTop: '1px dashed var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Lock size={11} style={{ color: 'var(--primary-400)' }} />
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Username (Auth)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                readOnly
                value={username}
                placeholder="Tanpa Username"
                className="form-input"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  padding: '5px 8px',
                  backgroundColor: 'var(--bg-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => handleCopy(username, 'user')}
                disabled={!username}
                className="btn btn-outline"
                style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
                title="Salin Username Ingest"
              >
                {copiedField === 'user' ? (
                  <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedField === 'user' ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '4px' }}>
              <Lock size={11} style={{ color: 'var(--accent-emerald)' }} />
              <label
                style={{
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                }}
              >
                Password (Auth)
              </label>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="password"
                readOnly
                value={password}
                placeholder="Tanpa Password"
                className="form-input"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.75rem',
                  padding: '5px 8px',
                  backgroundColor: 'var(--bg-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => handleCopy(password, 'pass')}
                disabled={!password}
                className="btn btn-outline"
                style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
                title="Salin Password Ingest"
              >
                {copiedField === 'pass' ? (
                  <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedField === 'pass' ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
