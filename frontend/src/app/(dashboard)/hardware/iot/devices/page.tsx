'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { RefreshCw, Settings2 } from 'lucide-react';
import { IotDevice, isIotDeviceOnline, listIotDevices } from '@/lib/services/studio/iot.service';
import { TableDataValue, TableStatus } from '@/components/ui/TableDataValue';
import { CircleCheck, CircleX, Cpu, Fingerprint, Wifi } from 'lucide-react';

export default function IotDevicesPage() {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async (showLoading = false) => {
    setError('');
    if (showLoading) setLoading(true);
    try {
      setDevices((await listIotDevices()).filter((device) => device.isApproved));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat perangkat IoT.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    let timeout: number;
    const poll = async () => {
      await refresh();
      if (active) timeout = window.setTimeout(() => void poll(), 5_000);
    };

    void refresh(true).then(() => {
      if (active) timeout = window.setTimeout(() => void poll(), 5_000);
    });

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [refresh]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button
          type="button"
          className="btn btn-outline iot-icon-button"
          onClick={() => void refresh(true)}
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
                <th>Koneksi / konfigurasi</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>Memuat perangkat...</td></tr>
              ) : devices.length === 0 ? (
                <tr><td colSpan={5} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>Belum ada perangkat yang disetujui.</td></tr>
              ) : devices.map((device) => {
                const online = isIotDeviceOnline(device.lastSeenAt);
                return (
                  <tr key={device.id}>
                    <td><TableDataValue icon={Cpu}>{device.name}</TableDataValue></td>
                    <td><TableDataValue icon={Fingerprint} tone="violet">{device.deviceUid}</TableDataValue></td>
                    <td>{device.ipAddress ? <TableDataValue icon={Wifi} tone="cyan">{device.ipAddress}</TableDataValue> : '-'}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '5px' }}>
                        <TableStatus icon={online ? CircleCheck : CircleX} tone={online ? 'emerald' : 'rose'}>
                          {online ? 'Online' : 'Offline'}
                        </TableStatus>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                          Konfigurasi {device.isActive ? 'aktif' : 'nonaktif'}
                        </span>
                      </div>
                    </td>
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
