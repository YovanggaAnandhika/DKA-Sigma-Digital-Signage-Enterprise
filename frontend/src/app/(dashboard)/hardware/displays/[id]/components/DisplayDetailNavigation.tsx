'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Monitor, Wifi, Network, Clock, Radio } from 'lucide-react';
import { useDisplayDetail } from '../context/DisplayDetailContext';
import { formatIndonesianDateTime } from './formatIndonesianDateTime';

const tabs = [
  { path: 'overview', label: 'Ringkasan' },
  { path: 'playback', label: 'Pemutaran' },
  { path: 'monitor', label: 'Monitor' },
  { path: 'history', label: 'Riwayat' },
];

export default function DisplayDetailNavigation() {
  const pathname = usePathname();
  const { device, deviceId, deviceLoadError, diagnosticsError, isLiveConnected } = useDisplayDetail();
  const basePath = `/hardware/displays/${deviceId}`;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
      {/* Header Info & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Link
            href="/hardware/displays/player"
            className="btn btn-outline"
            style={{
              width: 38,
              minWidth: 38,
              height: 38,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            aria-label="Kembali ke daftar layar"
            title="Kembali ke daftar layar"
          >
            <ArrowLeft size={17} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '1.1rem', fontWeight: 700, margin: 0, overflowWrap: 'anywhere' }}>
              {device?.name || 'Detail Layar'}
            </h1>
            
            {/* Meta Info with Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 5, flexWrap: 'wrap' }}>
              {/* Badge Status Online/Offline */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  color: isLiveConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    backgroundColor: isLiveConnected ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    boxShadow: isLiveConnected ? '0 0 6px var(--accent-emerald)' : 'none',
                  }}
                />
                {isLiveConnected ? 'Online' : 'Offline'}
              </span>

              {device?.screenWidth && device.screenHeight && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                  <Monitor size={13} style={{ opacity: 0.7 }} />
                  {device.screenWidth} × {device.screenHeight}
                </span>
              )}

              {device?.ipAddress && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.72rem', fontFamily: 'monospace' }}>
                  <Network size={13} style={{ opacity: 0.7 }} />
                  {device.ipAddress}
                </span>
              )}

              {device?.lastHeartbeatAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                  <Clock size={12} style={{ opacity: 0.7 }} />
                  {formatIndonesianDateTime(device.lastHeartbeatAt)}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {(deviceLoadError || diagnosticsError) && !device && (
        <div
          role="status"
          aria-live="polite"
          style={{
            padding: '12px 16px',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            borderRadius: '12px',
            background: 'rgba(244, 63, 94, 0.08)',
            color: 'var(--accent-rose)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {deviceLoadError
            ? 'Gagal memuat detail layar. Menunggu player terhubung untuk mencoba kembali.'
            : 'Koneksi status player terputus. Mencoba menyambungkan kembali.'}
        </div>
      )}

      {/* Modern Pill / Segmented Tabs Navigation */}
      <nav
        aria-label="Navigasi detail layar"
        style={{
          display: 'flex',
          gap: 6,
          padding: 4,
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '14px',
          width: 'fit-content',
          maxWidth: '100%',
          overflowX: 'auto',
        }}
      >
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.path}`;
          const active = pathname === href;
          return (
            <Link
              key={tab.path}
              href={href}
              aria-current={active ? 'page' : undefined}
              style={{
                flexShrink: 0,
                padding: '7px 16px',
                borderRadius: '10px',
                color: active ? 'var(--text-primary)' : 'var(--text-secondary)',
                backgroundColor: active ? 'var(--bg-surface)' : 'transparent',
                boxShadow: active ? '0 2px 8px rgba(0, 0, 0, 0.1)' : 'none',
                fontSize: '0.78rem',
                fontWeight: active ? 700 : 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease',
              }}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}