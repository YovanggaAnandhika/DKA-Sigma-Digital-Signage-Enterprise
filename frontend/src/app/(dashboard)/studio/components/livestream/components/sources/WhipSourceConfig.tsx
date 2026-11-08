'use client';

import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, Shield, Sparkles } from 'lucide-react';
import { copyToClipboard } from '@/lib/core/copyToClipboard';

interface WhipSourceConfigProps {
  whipUrl: string;
  requiresAuth: boolean;
  onToggleAuth: (val: boolean) => void;
  bearerToken: string;
  onChangeBearerToken: (val: string) => void;
  onGenerateToken: () => void;
}

export default function WhipSourceConfig({
  whipUrl,
  requiresAuth,
  onToggleAuth,
  bearerToken,
  onChangeBearerToken,
  onGenerateToken,
}: WhipSourceConfigProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {/* Server URL Input with Copy Button */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Alamat Server WHIP
          </label>
          <span style={{ fontSize: '0.66rem', fontWeight: 700, color: 'var(--accent-emerald)' }}>
            Murni Port 80
          </span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            readOnly
            value={whipUrl}
            className="form-input"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              backgroundColor: 'var(--bg-primary)',
            }}
          />
          <button
            type="button"
            onClick={() => handleCopy(whipUrl, 'url')}
            className="btn btn-outline"
            style={{ padding: '0 12px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
            title="Salin Server URL WHIP"
          >
            {copiedField === 'url' ? (
              <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
            ) : (
              <Copy size={13} />
            )}
            <span>{copiedField === 'url' ? 'Disalin' : 'Salin'}</span>
          </button>
        </div>
      </div>

      {/* Ingest Authentication Section (Bearer Token only for WHIP) */}
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
              Autentikasi Bearer Token
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
          <div style={{ marginTop: '2px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
              <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Bearer Token (OBS)
              </label>
              <button
                type="button"
                onClick={onGenerateToken}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  fontSize: '0.67rem',
                  fontWeight: 600,
                  color: 'var(--primary-400)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                title="Generate Bearer Token Baru"
              >
                <Sparkles size={11} />
                <span>Generate Token</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={bearerToken}
                  onChange={(e) => onChangeBearerToken(e.target.value)}
                  placeholder="Token siaran WHIP"
                  className="form-input"
                  style={{
                    paddingRight: '36px',
                    fontFamily: 'monospace',
                    fontSize: '0.78rem',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(!showToken)}
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
                  title={showToken ? 'Sembunyikan Token' : 'Lihat Token'}
                >
                  {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>

              <button
                type="button"
                onClick={() => handleCopy(bearerToken, 'token')}
                disabled={!bearerToken}
                className="btn btn-outline"
                style={{ padding: '0 12px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                title="Salin Bearer Token"
              >
                {copiedField === 'token' ? (
                  <Check size={13} style={{ color: 'var(--accent-emerald)' }} />
                ) : (
                  <Copy size={13} />
                )}
                <span>{copiedField === 'token' ? 'Disalin' : 'Salin'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

