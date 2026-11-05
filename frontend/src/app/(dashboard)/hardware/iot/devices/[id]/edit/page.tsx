'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Activity, ArrowLeft, Cpu, LoaderCircle, Plus, Radio, Save, Trash2, Wifi } from 'lucide-react';
import SearchSelect from '@/components/ui/SearchSelect';
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
        ) : (
          <div style={{ width: '100%', overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
            <table style={{ width: '100%', minWidth: '850px', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <thead>
                <tr style={{ background: 'var(--bg-surface)' }}>
                  {[
                    ['Pin GPIO', '23%'],
                    ['Aksi', '22%'],
                    ['Label tombol', '25%'],
                    ['Status', '14%'],
                    ['Kontrol', '16%'],
                  ].map(([label, width], index) => (
                    <th key={`${label}-${index}`} style={{ width, padding: '11px 12px', borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: index > 2 ? 'center' : 'left', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {mappings.map((mapping, index) => {
                  const pinOptions = [...SUPPORTED_PINS, ...(!SUPPORTED_PINS.includes(mapping.pin) ? [mapping.pin] : [])]
                    .filter((pin) => pin === mapping.pin || !usedPins.has(pin))
                    .map((pin) => ({
                      value: String(pin),
                      label: `GPIO ${pin} · ${PIN_METADATA[pin] || 'Tidak dikenal firmware saat ini'}`,
                      hint: pin === 13 ? 'BOOT onboard' : undefined,
                    }));
                  const isTesting = testingPin === mapping.pin;
                  return (
                    <tr key={`${device.id}-${index}`} style={{ background: 'var(--bg-surface)', transition: 'background-color 160ms ease' }}>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                        <SearchSelect
                          value={String(mapping.pin)}
                          options={pinOptions}
                          onChange={(value) => updateMapping(index, { pin: Number(value) })}
                          placeholder="Cari GPIO..."
                        />
                        <span style={{ display: 'block', marginTop: '5px', color: 'var(--text-muted)', fontSize: '0.68rem', lineHeight: 1.4 }}>
                          {PIN_METADATA[mapping.pin] || 'Pin tidak dikenal firmware saat ini'}
                        </span>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                        <select
                          className="form-input"
                          value={mapping.action}
                          onChange={(event) => updateMapping(index, { action: event.target.value })}
                          aria-label={`Aksi pin ${mapping.pin}`}
                        >
                          {ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                        </select>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', verticalAlign: 'middle' }}>
                        <input
                          className="form-input"
                          placeholder="Contoh: Tombol loket 1"
                          value={mapping.label}
                          onChange={(event) => updateMapping(index, { label: event.target.value })}
                          aria-label={`Label tombol pin ${mapping.pin}`}
                        />
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center', verticalAlign: 'middle' }}>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={mapping.enabled}
                          aria-label={`${mapping.enabled ? 'Nonaktifkan' : 'Aktifkan'} mapping GPIO ${mapping.pin}`}
                          onClick={() => updateMapping(index, { enabled: !mapping.enabled })}
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '4px 0', border: 0, background: 'transparent', color: mapping.enabled ? 'var(--accent-emerald)' : 'var(--text-muted)', cursor: 'pointer', font: 'inherit', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          <span style={{ display: 'inline-flex', alignItems: 'center', width: '34px', height: '19px', padding: '2px', borderRadius: 'var(--radius-full)', background: mapping.enabled ? 'var(--accent-emerald)' : 'var(--bg-surface-elevated)', border: `1px solid ${mapping.enabled ? 'var(--accent-emerald)' : 'var(--border-strong)'}`, transition: 'background-color 180ms ease, border-color 180ms ease' }}>
                            <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'var(--bg-primary)', boxShadow: 'var(--card-shadow)', transform: mapping.enabled ? 'translateX(15px)' : 'translateX(0)', transition: 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)' }} />
                          </span>
                          {mapping.enabled ? 'Aktif' : 'Nonaktif'}
                        </button>
                      </td>
                      <td style={{ padding: '10px 12px', borderBottom: '1px solid var(--border-subtle)', textAlign: 'center', verticalAlign: 'middle' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ width: '34px', height: '34px', padding: 0, justifyContent: 'center' }}
                            disabled={!mapping.enabled || isTesting}
                            onClick={() => void testMapping(mapping.pin, mapping.action)}
                            aria-label={`Uji aksi pin ${mapping.pin}`}
                            title="Uji aksi nyata"
                          >
                            {isTesting ? <LoaderCircle size={15} className="animate-spin" /> : <Activity size={15} />}
                          </button>
                          <button
                            type="button"
                            className="btn btn-outline"
                            style={{ width: '34px', height: '34px', padding: 0, justifyContent: 'center', color: 'var(--accent-rose)' }}
                            onClick={() => setMappings((items) => items.filter((_, current) => current !== index))}
                            aria-label={`Hapus mapping pin ${mapping.pin}`}
                            title="Hapus mapping"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

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
