'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, RefreshCw } from 'lucide-react';
import { approveIotDevice, IotDevice, listIotDevices } from '@/lib/services/studio/iot.service';

export default function IotApprovalPage() {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState('');
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    setLoading(true);
    try {
      setDevices((await listIotDevices()).filter((device) => !device.isApproved));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat perangkat IoT.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const approve = async (id: string) => {
    setApprovingId(id);
    setError('');
    try {
      await approveIotDevice(id);
      setDevices((items) => items.filter((device) => device.id !== id));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Persetujuan perangkat gagal.');
    } finally {
      setApprovingId('');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <button type="button" className="btn btn-outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} /> Muat ulang
        </button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--accent-rose)' }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Memuat perangkat...</p>
      ) : devices.length === 0 ? (
        <div className="card-elevated" style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
          Tidak ada perangkat baru yang menunggu persetujuan.
        </div>
      ) : devices.map((device) => (
        <article key={device.id} className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
          <div>
            <strong style={{ color: 'var(--text-primary)' }}>{device.name}</strong>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
              {device.deviceUid} · {device.ipAddress || 'IP belum diketahui'} · Terakhir terlihat {device.lastSeenAt || '-'}
            </div>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => void approve(device.id)} disabled={approvingId === device.id}>
            <Check size={15} /> {approvingId === device.id ? 'Menyetujui...' : 'Setujui'}
          </button>
        </article>
      ))}
    </div>
  );
}
