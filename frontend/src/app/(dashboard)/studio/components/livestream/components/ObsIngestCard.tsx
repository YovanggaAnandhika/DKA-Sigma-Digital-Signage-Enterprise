'use client';

import React, { useState } from 'react';
import { Check, Copy, KeyRound, Sparkles } from 'lucide-react';

interface ObsIngestCardProps {
  serverUrl: string;
  streamKey: string;
  serverHost?: string;
  requiresAuth?: boolean;
  bearerToken?: string;
  onGenerateToken?: () => void;
}

export default function ObsIngestCard({
  serverUrl,
  streamKey,
  serverHost = 'sigma.dkaapis.test',
  requiresAuth = false,
  bearerToken = '',
  onGenerateToken,
}: ObsIngestCardProps) {
  const [ingestType, setIngestType] = useState<'WHIP' | 'RTMP'>('WHIP');
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, field: string) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const whipServerUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/streams/${streamKey}/whip`
    : `http://${serverHost}/streams/${streamKey}/whip`;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        padding: '9px 12px',
        borderRadius: 'var(--radius-md)',
        backgroundColor: 'var(--bg-surface-elevated)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      {/* Protocol Toggle (WHIP vs RTMP) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            type="button"
            onClick={() => setIngestType('WHIP')}
            style={{
              padding: '2px 8px',
              borderRadius: '5px',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: ingestType === 'WHIP' ? 'var(--primary-500)' : 'transparent',
              color: ingestType === 'WHIP' ? '#ffffff' : 'var(--text-muted)',
              border: ingestType === 'WHIP' ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
              transition: 'all 0.15s ease',
            }}
          >
            WHIP
          </button>

          <button
            type="button"
            onClick={() => setIngestType('RTMP')}
            style={{
              padding: '2px 8px',
              borderRadius: '5px',
              fontSize: '0.68rem',
              fontWeight: 700,
              cursor: 'pointer',
              backgroundColor: ingestType === 'RTMP' ? 'var(--bg-surface)' : 'transparent',
              color: ingestType === 'RTMP' ? 'var(--text-primary)' : 'var(--text-muted)',
              border: ingestType === 'RTMP' ? '1px solid var(--border-strong)' : '1px solid var(--border-subtle)',
              transition: 'all 0.15s ease',
            }}
          >
            RTMP
          </button>
        </div>

        <span style={{ fontSize: '0.65rem', fontWeight: 600, color: 'var(--accent-emerald)' }}>
          Siap Ingest
        </span>
      </div>

      {/* WHIP View */}
      {ingestType === 'WHIP' ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: requiresAuth ? '1.2fr 1fr' : '1fr',
            gap: '8px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '3px',
              }}
            >
              Server URL (OBS: WHIP)
            </label>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                readOnly
                value={whipServerUrl}
                className="form-input"
                style={{
                  fontFamily: 'monospace',
                  fontSize: '0.74rem',
                  padding: '5px 8px',
                  backgroundColor: 'var(--bg-primary)',
                }}
              />
              <button
                type="button"
                onClick={() => handleCopy(whipServerUrl, 'whip_server')}
                className="btn btn-outline"
                style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
                title="Salin WHIP URL"
              >
                {copiedField === 'whip_server' ? (
                  <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <Copy size={12} />
                )}
                <span>{copiedField === 'whip_server' ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>

          {requiresAuth && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '3px' }}>
                <label
                  style={{
                    fontSize: '0.66rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  Bearer Token (OBS)
                </label>
                {onGenerateToken && (
                  <button
                    type="button"
                    onClick={onGenerateToken}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      fontSize: '0.65rem',
                      fontWeight: 600,
                      color: 'var(--primary-400)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                    title="Generate Token Baru"
                  >
                    <Sparkles size={11} />
                    <span>Generate Token</span>
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <input
                  type="text"
                  readOnly
                  value={bearerToken}
                  placeholder="Klik Generate Token"
                  className="form-input"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.74rem',
                    padding: '5px 8px',
                    backgroundColor: 'var(--bg-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleCopy(bearerToken, 'whip_token')}
                  disabled={!bearerToken}
                  className="btn btn-outline"
                  style={{ padding: '0 9px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.72rem' }}
                  title="Salin Bearer Token"
                >
                  {copiedField === 'whip_token' ? (
                    <Check size={12} style={{ color: 'var(--accent-emerald)' }} />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedField === 'whip_token' ? 'Disalin' : 'Salin'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* RTMP View */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '3px',
              }}
            >
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
            <label
              style={{
                display: 'block',
                fontSize: '0.66rem',
                fontWeight: 700,
                color: 'var(--text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                marginBottom: '3px',
              }}
            >
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
      )}
    </div>
  );
}
