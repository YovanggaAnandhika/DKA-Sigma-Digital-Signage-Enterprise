'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
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
  const { device, deviceId, isLiveConnected } = useDisplayDetail();
  const basePath = `/hardware/displays/${deviceId}`;

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <Link
          href="/hardware/displays/player"
          className="btn btn-outline"
          style={{ width: 36, minWidth: 36, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%' }}
          aria-label="Kembali ke daftar layar"
          title="Kembali ke daftar layar"
        >
          <ArrowLeft size={16} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ color: 'var(--text-primary)', fontSize: '1.05rem', fontWeight: 700, overflowWrap: 'anywhere' }}>
            {device?.name || 'Detail layar'}
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.72rem', display: 'flex', flexWrap: 'wrap', gap: '0 8px' }}>
            <span style={{ color: isLiveConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>{isLiveConnected ? 'Online' : 'Offline'}</span>
            {device?.screenWidth && device.screenHeight ? <span>{device.screenWidth} × {device.screenHeight}</span> : null}
            {device?.ipAddress ? <span>{device.ipAddress}</span> : null}
            {device?.lastHeartbeatAt ? <span>Heartbeat {formatIndonesianDateTime(device.lastHeartbeatAt)}</span> : null}
          </p>
        </div>
      </div>
      <nav aria-label="Navigasi detail layar" style={{ display: 'flex', gap: 4, overflowX: 'auto', borderBottom: '1px solid var(--border-subtle)' }}>
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
                padding: '8px 12px',
                color: active ? 'var(--primary-600)' : 'var(--text-secondary)',
                borderBottom: active ? '2px solid var(--primary-500)' : '2px solid transparent',
                fontSize: '0.8rem',
                fontWeight: active ? 700 : 600,
                whiteSpace: 'nowrap',
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
