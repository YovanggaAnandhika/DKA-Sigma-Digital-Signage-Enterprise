'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Monitor, Network, Clock, LayoutDashboard, PlayCircle, Activity, History } from 'lucide-react';
import { useDisplayDetail } from '../context/DisplayDetailContext';
import { formatIndonesianDateTime } from './formatIndonesianDateTime';

const tabs = [
  { path: 'overview', label: 'Ringkasan', icon: LayoutDashboard },
  { path: 'playback', label: 'Pemutaran', icon: PlayCircle },
  { path: 'monitor', label: 'Monitor', icon: Activity },
  { path: 'history', label: 'Riwayat', icon: History },
];

export default function DisplayDetailNavigation() {
  const pathname = usePathname();
  const { device, deviceId, deviceLoadError, diagnosticsError, isLiveConnected } = useDisplayDetail();
  const basePath = `/hardware/displays/${deviceId}`;

  if (pathname?.endsWith('/edit')) {
    return null;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
      {/* Header Info & Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <Link
            href="/hardware/displays/player"
            className="btn btn-outline"
            style={{
              width: 42,
              minWidth: 42,
              height: 42,
              padding: 0,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '50%',
              backgroundColor: 'var(--bg-surface-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            aria-label="Kembali ke daftar layar"
            title="Kembali ke daftar layar"
          >
            <ArrowLeft size={18} />
          </Link>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ color: 'var(--text-primary)', fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', margin: 0, overflowWrap: 'anywhere' }}>
              {device?.name || 'Detail Layar'}
            </h1>
            
            {/* Meta Info with Icons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, flexWrap: 'wrap' }}>
              {/* Badge Status Online/Offline */}
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.75rem',
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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  <Monitor size={13} style={{ opacity: 0.7 }} />
                  {device.screenWidth} × {device.screenHeight}
                </span>
              )}

              {device?.ipAddress && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem', fontFamily: 'monospace' }}>
                  <Network size={13} style={{ opacity: 0.7 }} />
                  {device.ipAddress}
                </span>
              )}

              {device?.lastHeartbeatAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.75rem' }}>
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

      {/* Module Tabs Navigation */}
      <nav aria-label="Navigasi detail layar" className="dashboard-tabs">
        {tabs.map((tab) => {
          const href = `${basePath}/${tab.path}`;
          const active = pathname === href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.path}
              href={href}
              aria-current={active ? 'page' : undefined}
              className="dashboard-tab"
            >
              <Icon size={19} strokeWidth={2.2} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}