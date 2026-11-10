'use client';

import React from 'react';

interface StreamSettingsCardProps {
  lowLatencyMode: boolean;
  onToggleLowLatency: (val: boolean) => void;
  autoReconnect: boolean;
  onToggleAutoReconnect: (val: boolean) => void;
  isMuted?: boolean;
  onToggleMute?: (val: boolean) => void;
}

export default function StreamSettingsCard({
  lowLatencyMode,
  onToggleLowLatency,
  autoReconnect,
  onToggleAutoReconnect,
  isMuted = true,
  onToggleMute,
}: StreamSettingsCardProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        gap: '16px',
        flexWrap: 'wrap',
      }}
    >
      {/* Low Latency Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          role="switch"
          aria-checked={lowLatencyMode}
          onClick={() => onToggleLowLatency(!lowLatencyMode)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: '32px',
            height: '18px',
            padding: '2px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: lowLatencyMode ? 'var(--primary-600)' : 'var(--border-strong)',
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
              transform: lowLatencyMode ? 'translateX(14px)' : 'translateX(0)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Latensi Rendah
        </span>
      </div>

      {/* Auto Reconnect Switch */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <button
          type="button"
          role="switch"
          aria-checked={autoReconnect}
          onClick={() => onToggleAutoReconnect(!autoReconnect)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            width: '32px',
            height: '18px',
            padding: '2px',
            borderRadius: 'var(--radius-full)',
            backgroundColor: autoReconnect ? 'var(--primary-600)' : 'var(--border-strong)',
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
              transform: autoReconnect ? 'translateX(14px)' : 'translateX(0)',
              transition: 'transform 0.15s ease',
            }}
          />
        </button>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
          Sambung Otomatis
        </span>
      </div>

      {/* Audio Mute Switch */}
      {onToggleMute && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            role="switch"
            aria-checked={!isMuted}
            onClick={() => onToggleMute(!isMuted)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              width: '32px',
              height: '18px',
              padding: '2px',
              borderRadius: 'var(--radius-full)',
              backgroundColor: !isMuted ? 'var(--accent-emerald)' : 'var(--border-strong)',
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
                transform: !isMuted ? 'translateX(14px)' : 'translateX(0)',
                transition: 'transform 0.15s ease',
              }}
            />
          </button>
          <span style={{ fontSize: '0.78rem', color: !isMuted ? 'var(--accent-emerald)' : 'var(--text-secondary)' }}>
            {!isMuted ? 'Audio Aktif' : 'Audio Dibisukan'}
          </span>
        </div>
      )}
    </div>
  );
}
