'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Activity, Check, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import {
  approveIotDevice,
  deleteIotDevice,
  IotDevice,
  IotPinMapping,
  listIotDevices,
  triggerIotDeviceAction,
  updateIotDevice,
} from '@/lib/services/studio/iot.service';

const ACTIONS = [
  ['CALL_NEXT', 'Panggil berikutnya'],
  ['RECALL', 'Panggil ulang'],
  ['CALL_PREV', 'Panggil sebelumnya'],
  ['TOGGLE_BREAK', 'Toggle istirahat'],
  ['TOGGLE_CLOSE', 'Toggle tutup loket'],
  ['ISSUE_TICKET', 'Terbitkan tiket'],
];

export default function IotDevicesPage() {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refresh = useCallback(async () => {
    setError('');
    try {
      setDevices(await listIotDevices());
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal memuat perangkat IoT.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const replaceDevice = (updated: IotDevice) => {
    setDevices((items) => items.map((item) => item.id === updated.id ? updated : item));
  };

  const pending = devices.filter((device) => !device.isApproved);
  const approved = devices.filter((device) => device.isApproved);

  return (
    <main style={{ padding: '28px', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.5rem' }}>Perangkat IoT</h1>
          <p style={{ margin: '6px 0 0', color: 'var(--text-secondary)' }}>
            Setujui perangkat yang ditemukan dan atur aksi pin di satu tempat.
          </p>
        </div>
        <button type="button" className="btn btn-outline" onClick={() => void refresh()} disabled={loading}>
          <RefreshCw size={15} /> Muat ulang
        </button>
      </header>

      {error && <p role="alert" style={{ color: 'var(--accent-rose)' }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--text-muted)' }}>Memuat perangkat...</p>
      ) : (
        <>
          <section style={{ marginBottom: '28px' }}>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Menunggu persetujuan ({pending.length})</h2>
            {pending.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Tidak ada perangkat baru yang menunggu persetujuan.</p>
            ) : pending.map((device) => (
              <article key={device.id} className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', marginBottom: '10px' }}>
                <div>
                  <strong style={{ color: 'var(--text-primary)' }}>{device.name}</strong>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                    {device.deviceUid} · {device.ipAddress || 'IP belum diketahui'} · Terakhir terlihat {device.lastSeenAt || '-'}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={async () => {
                    try {
                      replaceDevice(await approveIotDevice(device.id));
                    } catch (reason) {
                      setError(reason instanceof Error ? reason.message : 'Persetujuan perangkat gagal.');
                    }
                  }}
                >
                  <Check size={15} /> Setujui
                </button>
              </article>
            ))}
          </section>

          <section>
            <h2 style={{ color: 'var(--text-primary)', fontSize: '1rem' }}>Perangkat disetujui ({approved.length})</h2>
            {approved.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>Belum ada perangkat yang disetujui.</p>
            ) : approved.map((device) => (
              <IotDeviceCard
                key={device.id}
                device={device}
                onSaved={replaceDevice}
                onDeleted={() => setDevices((items) => items.filter((item) => item.id !== device.id))}
                onError={setError}
              />
            ))}
          </section>
        </>
      )}
    </main>
  );
}

function IotDeviceCard({
  device,
  onSaved,
  onDeleted,
  onError,
}: {
  device: IotDevice;
  onSaved: (device: IotDevice) => void;
  onDeleted: () => void;
  onError: (message: string) => void;
}) {
  const [name, setName] = useState(device.name);
  const [isActive, setIsActive] = useState(device.isActive);
  const [mappings, setMappings] = useState<IotPinMapping[]>(device.pinMappingsList);
  const [saving, setSaving] = useState(false);
  const [testingPin, setTestingPin] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState('');

  const updateMapping = (index: number, patch: Partial<IotPinMapping>) => {
    setMappings((items) => items.map((item, current) => current === index ? { ...item, ...patch } : item));
  };

  return (
    <article className="card-elevated" style={{ padding: '18px', marginBottom: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: '16px' }}>
        <div>
          <strong style={{ color: 'var(--text-primary)' }}>{device.deviceUid}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
            {device.ipAddress || 'IP belum diketahui'} · {device.firmwareVersion || 'Versi firmware tidak diketahui'}
          </div>
        </div>
        <button
          type="button"
          className="btn btn-outline"
          style={{ color: 'var(--accent-rose)' }}
          onClick={async () => {
            if (!window.confirm(`Hapus perangkat ${device.deviceUid}?`)) return;
            try {
              await deleteIotDevice(device.id);
              onDeleted();
            } catch (reason) {
              onError(reason instanceof Error ? reason.message : 'Gagal menghapus perangkat.');
            }
          }}
          aria-label={`Hapus ${device.deviceUid}`}
        >
          <Trash2 size={15} />
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: '12px', alignItems: 'end', marginBottom: '18px' }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
          Nama perangkat
          <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} style={{ marginTop: '5px' }} />
        </label>
        <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', paddingBottom: '10px' }}>
          <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
          Aktif
        </label>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ color: 'var(--text-primary)', fontSize: '0.85rem' }}>Mapping pin</strong>
        <button type="button" className="btn btn-outline" onClick={() => setMappings((items) => [...items, { pin: 13, action: 'CALL_NEXT', enabled: true, label: '' }])}>
          <Plus size={14} /> Tambah pin
        </button>
      </div>

      {mappings.map((mapping, index) => (
        <div key={`${device.id}-${index}`} style={{ display: 'grid', gridTemplateColumns: '90px minmax(150px, 1fr) minmax(130px, 1fr) auto auto auto', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
          <input
            className="form-input"
            type="number"
            min="0"
            aria-label="Nomor pin"
            value={mapping.pin}
            onChange={(event) => updateMapping(index, { pin: Number(event.target.value) })}
          />
          <select className="form-input" value={mapping.action} onChange={(event) => updateMapping(index, { action: event.target.value })} aria-label="Aksi pin">
            {ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input
            className="form-input"
            placeholder="Label (opsional)"
            value={mapping.label}
            onChange={(event) => updateMapping(index, { label: event.target.value })}
          />
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
            <input type="checkbox" checked={mapping.enabled} onChange={(event) => updateMapping(index, { enabled: event.target.checked })} />
            Aktif
          </label>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!mapping.enabled || testingPin === mapping.pin}
            onClick={async () => {
              setTestingPin(mapping.pin);
              setTestMessage('');
              try {
                const result = await triggerIotDeviceAction(device.deviceUid, mapping.pin);
                setTestMessage(result.message);
                onSaved({ ...device, lastAction: `${result.action}: ${result.message}` });
              } catch (reason) {
                onError(reason instanceof Error ? reason.message : 'Gagal menjalankan aksi uji.');
              } finally {
                setTestingPin(null);
              }
            }}
            aria-label={`Uji aksi pin ${mapping.pin}`}
          >
            <Activity size={14} /> {testingPin === mapping.pin ? 'Uji...' : 'Uji'}
          </button>
          <button type="button" className="btn btn-outline" onClick={() => setMappings((items) => items.filter((_, current) => current !== index))} aria-label="Hapus mapping pin">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      {testMessage && <p role="status" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{testMessage}</p>}
      {mappings.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada mapping pin.</p>}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
        <span style={{ display: 'flex', gap: '6px', alignItems: 'center', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
          <Activity size={14} /> {device.lastAction || 'Belum ada aksi'}
        </span>
        <button
          type="button"
          className="btn btn-primary"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              onSaved(await updateIotDevice({
                id: device.id,
                name,
                deviceRole: device.deviceRole,
                pinMappings: mappings,
                isActive,
              }));
            } catch (reason) {
              onError(reason instanceof Error ? reason.message : 'Gagal menyimpan konfigurasi perangkat.');
            } finally {
              setSaving(false);
            }
          }}
        >
          <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan konfigurasi'}
        </button>
      </div>
    </article>
  );
}
