'use client';

import React from 'react';
import Link from 'next/link';
import { Tv } from 'lucide-react';
import type { Device } from '@/lib/services/hardware';

interface DashboardDeviceListProps {
  devices: Device[];
  loading: boolean;
}

export default function DashboardDeviceList({
  devices,
  loading,
}: DashboardDeviceListProps) {
  return (
    <div className="card-elevated" style={{ padding: '20px', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Tv size={18} style={{ color: 'var(--primary-400)' }} />
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Status Layar Retail Terkini
          </h3>
        </div>
        <Link href="/displays" style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}>
          Lihat Semua →
        </Link>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Nama Display</th>
              <th>Kode Pairing</th>
              <th>Status</th>
              <th>Alamat IP</th>
            </tr>
          </thead>
          <tbody>
            {devices.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                  {loading ? 'Memuat data dari gRPC backend...' : 'Belum ada display player terdaftar.'}
                </td>
              </tr>
            ) : (
              devices.slice(0, 5).map((d) => (
                <tr key={d.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <Link href={`/displays/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                      {d.name}
                    </Link>
                  </td>
                  <td style={{ fontFamily: 'monospace' }}>
                    <span
                      style={{
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {d.pairingCode}
                    </span>
                  </td>
                  <td>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                        color: d.isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                        border: d.isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                      }}
                    >
                      {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                    </span>
                  </td>
                  <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                    {d.ipAddress || '127.0.0.1'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
