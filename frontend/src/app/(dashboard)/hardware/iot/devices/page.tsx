'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Settings2 } from 'lucide-react';
import { IotDevice, listIotDevices } from '@/lib/services/studio/iot.service';

export default function IotDevicesPage() {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setDevices((await listIotDevices()).filter((device) => device.isApproved));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat perangkat IoT.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-outline iot-icon-button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Muat ulang daftar perangkat"
          title="Muat ulang daftar perangkat"
        >
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--accent-rose)' }}>{error}</p>}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th>Nama perangkat</th>
                <th>Device UID</th>
                <th>Alamat IP</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat perangkat...</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada perangkat yang disetujui.</td></tr>
              ) : devices.map((device) => (
                <tr key={device.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{device.name}</td>
                  <td>{device.deviceUid}</td>
                  <td>{device.ipAddress || '-'}</td>
                  <td>{device.isActive ? 'Aktif' : 'Nonaktif'}</td>
                  <td style={{ textAlign: 'right' }}>
                    <Link
                      href={`/hardware/iot/devices/${device.id}/edit`}
                      className="btn btn-outline iot-icon-button"
                      aria-label={`Konfigurasi ${device.name}`}
                      title="Konfigurasi perangkat"
                    >
                      <Settings2 size={18} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
