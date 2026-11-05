'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Cpu, Link2, Unlink } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueCounter } from '../../types';
import { addCounter, listCounters } from '@/lib/services/studio/queue.service';
import {
  bindIotDevice,
  listQueueIotBindings,
  QueueIotBinding,
  unbindIotDevice,
} from '@/lib/services/studio/iot.service';

export default function TabIotBindingTab() {
  const { queue, isNew, loading: queueLoading } = useQueueEditor();
  const [devices, setDevices] = useState<QueueIotBinding[]>([]);
  const [counters, setCounters] = useState<QueueCounter[]>([]);
  const [counterSelections, setCounterSelections] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    if (queueLoading) return;
    if (!queue.id || isNew) {
      setLoading(false);
      return;
    }
    setError('');
    try {
      const [items, counterResponse] = await Promise.all([
        listQueueIotBindings(queue.id),
        listCounters(queue.id),
      ]);
      let availableCounters = counterResponse.itemsList ?? [];
      if (
        availableCounters.length === 0 &&
        queue.counters.length === 1 &&
        queue.counters[0].id === 'cnt-1'
      ) {
        const defaultCounter = queue.counters[0];
        await addCounter(queue.id, defaultCounter.counterNumber, defaultCounter.counterName, defaultCounter.operatorName);
        availableCounters = (await listCounters(queue.id)).itemsList ?? [];
      }
      setDevices(items);
      setCounters(availableCounters);
      setCounterSelections(Object.fromEntries(items.map((item) => [item.iotDeviceId, item.counterId])));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat binding IoT.');
    } finally {
      setLoading(false);
    }
  }, [queue, queueLoading, isNew]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggleBinding = async (device: QueueIotBinding) => {
    try {
      setError('');
      if (device.isBound) {
        await unbindIotDevice(queue.id!, device.iotDeviceId);
      } else {
        await bindIotDevice(queue.id!, device.iotDeviceId, counterSelections[device.iotDeviceId] || undefined);
      }
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memperbarui binding IoT.');
    }
  };

  const saveCounterSelection = async (device: QueueIotBinding) => {
    try {
      setError('');
      await bindIotDevice(
        queue.id!,
        device.iotDeviceId,
        counterSelections[device.iotDeviceId] || undefined,
      );
      await refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memperbarui loket binding IoT.');
    }
  };

  if (isNew || !queue.id) {
    return <p className="card-elevated" style={{ padding: '20px', color: 'var(--text-secondary)' }}>
      Simpan queue terlebih dahulu sebelum mengatur binding perangkat IoT.
    </p>;
  }

  return (
    <section className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <header>
        <h2 style={{ margin: 0, fontSize: '1rem', color: 'var(--text-primary)' }}>Binding perangkat IoT</h2>
        <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          Pilih perangkat yang dikaitkan dengan queue ini. Satu aksi perangkat dijalankan pada semua queue yang terikat.
        </p>
      </header>
      {error && <p role="alert" style={{ margin: 0, color: 'var(--accent-rose)' }}>{error}</p>}
      {loading ? <p style={{ color: 'var(--text-muted)' }}>Memuat daftar perangkat...</p> : devices.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Belum ada perangkat yang disetujui. Kelola perangkat melalui menu Perangkat IoT.</p>
      ) : devices.map((device) => (
        <article key={device.iotDeviceId} style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(180px, 260px) auto', gap: '12px', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
            <Cpu size={17} color={device.isActive ? 'var(--accent-emerald)' : 'var(--text-muted)'} />
            <div>
              <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>{device.deviceName}</strong>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{device.deviceUid} · {device.isActive ? 'Aktif' : 'Nonaktif'}</div>
            </div>
          </div>
          <select
            className="form-input"
            aria-label={`Pilih loket untuk ${device.deviceName}`}
            value={counterSelections[device.iotDeviceId] || ''}
            onChange={(event) => setCounterSelections((selections) => ({ ...selections, [device.iotDeviceId]: event.target.value }))}
          >
            <option value="">Tanpa loket khusus</option>
            {counters.map((counter) => (
              <option key={counter.id} value={counter.id}>{counter.counterName}</option>
            ))}
          </select>
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
            {device.isBound && (counterSelections[device.iotDeviceId] || '') !== device.counterId && (
              <button type="button" className="btn btn-primary" onClick={() => void saveCounterSelection(device)}>
                Simpan Loket
              </button>
            )}
            <button type="button" className={device.isBound ? 'btn btn-outline' : 'btn btn-primary'} onClick={() => void toggleBinding(device)}>
              {device.isBound ? <><Unlink size={14} /> Lepas</> : <><Link2 size={14} /> Ikat</>}
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
