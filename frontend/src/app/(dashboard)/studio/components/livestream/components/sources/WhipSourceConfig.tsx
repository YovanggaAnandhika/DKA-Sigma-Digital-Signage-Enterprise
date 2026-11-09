'use client';

import React, { useState } from 'react';
import { Check, Copy, Eye, EyeOff, RotateCw } from 'lucide-react';
import { copyToClipboard } from '@/lib/core/copyToClipboard';

function generateSecureToken(length = 20): string {
  const chars = '23456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ';
  let result = 'sig_tok_';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

interface WhipSourceConfigProps {
  whipUrl: string;
  requiresAuth: boolean;
  onToggleAuth: (val: boolean) => void;
  bearerToken?: string;
  password?: string;
  onChangeBearerToken?: (val: string) => void;
  onChangePassword?: (val: string) => void;
  onGenerateToken?: () => void;
}

export default function WhipSourceConfig({
  whipUrl,
  requiresAuth,
  onToggleAuth,
  bearerToken,
  password,
  onChangeBearerToken,
  onChangePassword,
  onGenerateToken,
}: WhipSourceConfigProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const token = bearerToken ?? password ?? '';

  const handleTokenChange = (val: string) => {
    onChangeBearerToken?.(val);
    onChangePassword?.(val);
  };

  const handleGenerate = () => {
    if (onGenerateToken) {
      onGenerateToken();
    } else {
      handleTokenChange(generateSecureToken());
    }
  };

  const handleToggleAuth = (checked: boolean) => {
    onToggleAuth(checked);
    if (checked && !token) {
      handleGenerate();
    }
  };

  const handleCopy = async (text: string, field: string) => {
    const success = await copyToClipboard(text);
    if (success) {
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {/* WHIP Endpoint URL */}
      <div>
        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
          URL Server WHIP
        </label>
        <div style={{ display: 'flex', gap: '6px' }}>
          <input
            type="text"
            readOnly
            value={whipUrl}
            className="form-input"
            style={{
              fontFamily: 'monospace',
              fontSize: '0.75rem',
            }}
          />
          <button
            type="button"
            onClick={() => handleCopy(whipUrl, 'url')}
            className="btn btn-outline"
            style={{ padding: '0 12px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
            title="Salin URL WHIP"
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

      {/* WHIP Token Authentication */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Autentikasi Token
          </span>
          <button
            type="button"
            role="switch"
            aria-checked={requiresAuth}
            onClick={() => handleToggleAuth(!requiresAuth)}
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                Bearer Token
              </label>
              <button
                type="button"
                onClick={handleGenerate}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-500)',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: 0,
                }}
              >
                <RotateCw size={11} />
                <span>Buat Token Baru</span>
              </button>
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => handleTokenChange(e.target.value)}
                  placeholder="Masukkan token siaran"
                  className="form-input"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    paddingRight: '32px',
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
                    display: 'flex',
                    alignItems: 'center',
                    padding: 0,
                  }}
                  title={showToken ? 'Sembunyikan' : 'Tampilkan'}
                >
                  {showToken ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(token, 'token')}
                className="btn btn-outline"
                style={{ padding: '0 12px', gap: '4px', whiteSpace: 'nowrap', fontSize: '0.75rem' }}
                title="Salin Token"
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
