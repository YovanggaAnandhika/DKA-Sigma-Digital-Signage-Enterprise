'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Activity, ArrowLeft, Cpu, Plus, Radio, Save, Trash2, Wifi } from 'lucide-react';
import {
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

const PIN_METADATA: Record<number, string> = {
  12: 'Input tombol eksternal',
  13: 'Input tombol · BOOT onboard memicu aksi ini',
  14: 'Input tombol eksternal',
  25: 'Input tombol eksternal',
  26: 'Input tombol eksternal',
  27: 'Input tombol eksternal',
  33: 'Input tombol eksternal',
};
const SUPPORTED_PINS = Object.keys(PIN_METADATA).map(Number);

function formatLastSeen(value: string) {
  if (!value) return 'Belum pernah terlihat';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString('id-ID');
}

export default function EditIotDevicePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<IotDevice | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [mappings, setMappings] = useState<IotPinMapping[]>([]);
  const [savedMappings, setSavedMappings] = useState<IotPinMapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingPin, setTestingPin] = useState<number | null>(null);
  const [testMessage, setTestMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    listIotDevices()
      .then((devices) => {
        const found = devices.find((item) => item.id === id && item.isApproved);
        if (!found) {
          router.replace('/hardware/iot/devices');
          return;
        }
        setDevice(found);
        setName(found.name);
        setIsActive(found.isActive);
        setMappings(found.pinMappingsList);
        setSavedMappings(found.pinMappingsList);
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Gagal memuat perangkat IoT.'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateMapping = (index: number, patch: Partial<IotPinMapping>) => {
    setMappings((items) => items.map((item, current) => current === index ? { ...item, ...patch } : item));
    setTestMessage('');
  };

  const save = async () => {
    if (!device) return;
    if (new Set(mappings.map((mapping) => mapping.pin)).size !== mappings.length) {
      setError('Setiap pin hanya boleh digunakan pada satu mapping.');
      return;
    }
    setSaving(true);
    setError('');
    setTestMessage('');
    try {
      const updated = await updateIotDevice({
        id: device.id,
        name,
        deviceRole: device.deviceRole,
        pinMappings: mappings,
        isActive,
      });
      setDevice(updated);
      setMappings(updated.pinMappingsList);
      setSavedMappings(updated.pinMappingsList);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal menyimpan konfigurasi perangkat.');
    } finally {
      setSaving(false);
    }
  };

  const testMapping = async (pin: number, action: string) => {
    if (!device) return;
    if (JSON.stringify(mappings) !== JSON.stringify(savedMappings)) {
      setTestMessage('Simpan perubahan mapping sebelum menjalankan uji.');
      return;
    }
    if (!window.confirm(`Aksi "${ACTIONS.find(([value]) => value === action)?.[1] || action}" akan dijalankan pada queue yang terikat. Ini bukan simulasi. Lanjutkan?`)) return;
    setTestingPin(pin);
    setTestMessage('');
    setError('');
    try {
      const result = await triggerIotDeviceAction(device.deviceUid, pin);
      setTestMessage(result.message);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal menjalankan aksi uji.');
    } finally {
      setTestingPin(null);
    }
  };

  const remove = async () => {
    if (!device || !window.confirm(`Hapus perangkat ${device.deviceUid}?`)) return;
    try {
      await deleteIotDevice(device.id);
      router.push('/hardware/iot/devices');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal menghapus perangkat.');
    }
  };

  if (loading) return <p style={{ color: 'var(--text-muted)' }}>Memuat perangkat...</p>;
  if (!device) return error ? <p role="alert" style={{ color: 'var(--accent-rose)' }}>{error}</p> : null;

  const usedPins = new Set(mappings.map((mapping) => mapping.pin));
  const canAddPin = SUPPORTED_PINS.some((pin) => !usedPins.has(pin));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
        <Link href="/hardware/iot/devices" className="btn btn-outline"><ArrowLeft size={15} /> Kembali ke perangkat</Link>
        <button type="button" className="btn btn-outline" style={{ color: 'var(--accent-rose)' }} onClick={() => void remove()}>
          <Trash2 size={15} /> Hapus perangkat
        </button>
      </div>

      <section className="card-elevated" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'grid', placeItems: 'center', width: '48px', height: '48px', borderRadius: 'var(--radius-lg)', color: 'var(--primary-500)', background: 'var(--bg-surface-elevated)' }}>
              <Cpu size={23} />
            </div>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1.15rem' }}>{device.name || device.deviceUid}</h2>
              <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.82rem', fontFamily: 'monospace' }}>{device.deviceUid}</p>
            </div>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '6px 10px', borderRadius: 'var(--radius-full)', color: isActive ? 'var(--accent-emerald)' : 'var(--text-muted)', background: isActive ? 'color-mix(in srgb, var(--accent-emerald) 12%, transparent)' : 'var(--bg-surface-elevated)', fontSize: '0.75rem', fontWeight: 700 }}>
            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: 'currentColor' }} />
            {isActive ? 'Perangkat aktif' : 'Perangkat nonaktif'}
          </span>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          {[
            { icon: <Wifi size={15} />, label: 'Alamat IP', value: device.ipAddress || 'Belum tersedia' },
            { icon: <Radio size={15} />, label: 'Firmware', value: device.firmwareVersion || 'Belum diketahui' },
            { icon: <Activity size={15} />, label: 'Aktivitas terakhir', value: device.lastAction || 'Belum ada aksi' },
          ].map((item) => (
            <div key={item.label} style={{ padding: '12px 14px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-md)', background: 'var(--bg-surface)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-muted)', fontSize: '0.72rem' }}>{item.icon}{item.label}</div>
              <strong style={{ display: 'block', marginTop: '6px', color: 'var(--text-primary)', fontSize: '0.85rem', overflowWrap: 'anywhere' }}>{item.value}</strong>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(180px, 1fr) auto', gap: '14px', alignItems: 'end' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', fontWeight: 600 }}>
            Nama perangkat
            <input className="form-input" value={name} onChange={(event) => setName(event.target.value)} style={{ marginTop: '7px' }} />
          </label>
          <label style={{ display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-secondary)', fontSize: '0.82rem', padding: '0 4px 11px' }}>
            <input type="checkbox" checked={isActive} onChange={(event) => setIsActive(event.target.checked)} />
            Aktif
          </label>
        </div>
      </section>

      <section className="card-elevated" style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '1rem' }}>Mapping tombol dan pin</h3>
            <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
              Pin yang tersedia untuk firmware ESP32 saat ini. BOOT onboard (GPIO 0) menjalankan mapping GPIO 13.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline"
            disabled={!canAddPin}
            onClick={() => {
              const pin = SUPPORTED_PINS.find((candidate) => !usedPins.has(candidate));
              if (pin !== undefined) setMappings((items) => [...items, { pin, action: 'CALL_NEXT', enabled: true, label: '' }]);
            }}
          >
            <Plus size={14} /> Tambah pin
          </button>
        </header>

        {error && <p role="alert" style={{ margin: 0, padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--accent-rose)', background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', fontSize: '0.82rem' }}>{error}</p>}

        {mappings.length === 0 ? (
          <div style={{ padding: '28px 16px', textAlign: 'center', border: '1px dashed var(--border-strong)', borderRadius: 'var(--radius-lg)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Belum ada mapping. Tambahkan pin untuk mengatur aksi tombol.
          </div>
        ) : mappings.map((mapping, index) => {
          const pinOptions = SUPPORTED_PINS.includes(mapping.pin) ? SUPPORTED_PINS : [mapping.pin, ...SUPPORTED_PINS];
          return (
            <article key={`${device.id}-${index}`} style={{ padding: '16px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)', background: 'var(--bg-surface)', transition: 'border-color 180ms ease, transform 180ms ease' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(165px, 1fr))', gap: '12px', alignItems: 'end' }}>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 600 }}>
                  PIN GPIO
                  <select
                    className="form-input"
                    value={mapping.pin}
                    onChange={(event) => updateMapping(index, { pin: Number(event.target.value) })}
                    style={{ marginTop: '6px' }}
                    aria-label={`Pilih pin mapping ${index + 1}`}
                  >
                    {pinOptions.map((pin) => (
                      <option key={pin} value={pin} disabled={pin !== mapping.pin && usedPins.has(pin)}>
                        GPIO {pin}{PIN_METADATA[pin] ? ` · ${PIN_METADATA[pin]}` : ' · tidak dikenal firmware saat ini'}
                      </option>
                    ))}
                  </select>
                </label>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 600 }}>
                  AKSI
                  <select
                    className="form-input"
                    value={mapping.action}
                    onChange={(event) => updateMapping(index, { action: event.target.value })}
                    style={{ marginTop: '6px' }}
                    aria-label={`Aksi pin ${mapping.pin}`}
                  >
                    {ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                  </select>
                </label>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.74rem', fontWeight: 600 }}>
                  LABEL TOMBOL
                  <input className="form-input" placeholder="Contoh: Tombol loket 1" value={mapping.label} onChange={(event) => updateMapping(index, { label: event.target.value })} style={{ marginTop: '6px' }} />
                </label>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingBottom: '1px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '7px', color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                    <input type="checkbox" checked={mapping.enabled} onChange={(event) => updateMapping(index, { enabled: event.target.checked })} />
                    Aktif
                  </label>
                  <div style={{ display: 'flex', gap: '7px' }}>
                    <button
                      type="button"
                      className="btn btn-outline"
                      disabled={!mapping.enabled || testingPin === mapping.pin}
                      onClick={() => void testMapping(mapping.pin, mapping.action)}
                      aria-label={`Uji aksi pin ${mapping.pin}`}
                      title="Menjalankan aksi nyata pada queue yang terikat"
                    >
                      <Activity size={14} /> {testingPin === mapping.pin ? 'Menjalankan...' : 'Uji aksi'}
                    </button>
                    <button type="button" className="btn btn-outline" onClick={() => setMappings((items) => items.filter((_, current) => current !== index))} aria-label={`Hapus mapping pin ${mapping.pin}`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              <p style={{ margin: '10px 0 0', paddingTop: '9px', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '0.74rem' }}>
                GPIO {mapping.pin} · {PIN_METADATA[mapping.pin] || 'Pin tidak dikenali firmware saat ini'} · {ACTIONS.find(([value]) => value === mapping.action)?.[1] || mapping.action}
              </p>
            </article>
          );
        })}

        {testMessage && <p role="status" style={{ margin: 0, padding: '10px 12px', borderRadius: 'var(--radius-md)', color: 'var(--text-secondary)', background: 'var(--bg-surface-elevated)', fontSize: '0.82rem' }}>{testMessage}</p>}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap', paddingTop: '4px' }}>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>
            Terakhir terdeteksi: {formatLastSeen(device.lastSeenAt)}
          </span>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan konfigurasi'}
          </button>
        </div>
      </section>
    </div>
  );
}
