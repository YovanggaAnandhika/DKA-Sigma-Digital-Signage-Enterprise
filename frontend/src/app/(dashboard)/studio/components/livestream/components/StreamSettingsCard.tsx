'use client';

import React from 'react';

interface StreamSettingsCardProps {
  lowLatencyMode: boolean;
  onToggleLowLatency: (val: boolean) => void;
  autoReconnect: boolean;
  onToggleAutoReconnect: (val: boolean) => void;
}

export default function StreamSettingsCard({
  lowLatencyMode,
  onToggleLowLatency,
  autoReconnect,
  onToggleAutoReconnect,
}: StreamSettingsCardProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
      {/* Low Latency Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Low-Latency
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            Buffer minimal
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={lowLatencyMode}
          onClick={() => onToggleLowLatency(!lowLatencyMode)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: '36px',
            height: '20px',
            padding: '2px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: lowLatencyMode ? 'var(--primary-500)' : 'var(--bg-surface)',
            border: `1px solid ${lowLatencyMode ? 'var(--primary-500)' : 'var(--border-strong)'}`,
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
              transform: lowLatencyMode ? 'translateX(16px)' : 'translateX(0)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </button>
      </div>

      {/* Auto Reconnect Switch */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          gap: '8px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Auto-Reconnect
          </span>
          <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
            Sambung otomatis
          </span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={autoReconnect}
          onClick={() => onToggleAutoReconnect(!autoReconnect)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: '36px',
            height: '20px',
            padding: '2px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: autoReconnect ? 'var(--primary-500)' : 'var(--bg-surface)',
            border: `1px solid ${autoReconnect ? 'var(--primary-500)' : 'var(--border-strong)'}`,
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
              transform: autoReconnect ? 'translateX(16px)' : 'translateX(0)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          />
        </button>
      </div>
    </div>
  );
}
