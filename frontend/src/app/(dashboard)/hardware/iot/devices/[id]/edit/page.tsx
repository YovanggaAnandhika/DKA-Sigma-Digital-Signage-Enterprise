'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { Activity, ArrowLeft, Plus, Save, Trash2 } from 'lucide-react';
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

export default function EditIotDevicePage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<IotDevice | null>(null);
  const [name, setName] = useState('');
  const [isActive, setIsActive] = useState(false);
  const [mappings, setMappings] = useState<IotPinMapping[]>([]);
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
      })
      .catch((reason) => setError(reason instanceof Error ? reason.message : 'Gagal memuat perangkat IoT.'))
      .finally(() => setLoading(false));
  }, [id, router]);

  const updateMapping = (index: number, patch: Partial<IotPinMapping>) => {
    setMappings((items) => items.map((item, current) => current === index ? { ...item, ...patch } : item));
  };

  const save = async () => {
    if (!device) return;
    setSaving(true);
    setError('');
    try {
      setDevice(await updateIotDevice({
        id: device.id,
        name,
        deviceRole: device.deviceRole,
        pinMappings: mappings,
        isActive,
      }));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Gagal menyimpan konfigurasi perangkat.');
    } finally {
      setSaving(false);
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px' }}>
        <Link href="/hardware/iot/devices" className="btn btn-outline"><ArrowLeft size={15} /> Kembali ke perangkat</Link>
        <button type="button" className="btn btn-outline" style={{ color: 'var(--accent-rose)' }} onClick={() => void remove()}>
          <Trash2 size={15} /> Hapus perangkat
        </button>
      </div>
      {error && <p role="alert" style={{ color: 'var(--accent-rose)' }}>{error}</p>}
      <section className="card-elevated" style={{ padding: '18px' }}>
        <h2 style={{ margin: '0 0 4px', color: 'var(--text-primary)', fontSize: '1.1rem' }}>{device.deviceUid}</h2>
        <p style={{ margin: '0 0 18px', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
          {device.ipAddress || 'IP belum diketahui'} · {device.firmwareVersion || 'Versi firmware tidak diketahui'}
        </p>
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
            <input className="form-input" type="number" min="0" aria-label="Nomor pin" value={mapping.pin} onChange={(event) => updateMapping(index, { pin: Number(event.target.value) })} />
            <select className="form-input" value={mapping.action} onChange={(event) => updateMapping(index, { action: event.target.value })} aria-label="Aksi pin">
              {ACTIONS.map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
            <input className="form-input" placeholder="Label (opsional)" value={mapping.label} onChange={(event) => updateMapping(index, { label: event.target.value })} />
            <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'flex', gap: '5px', alignItems: 'center' }}>
              <input type="checkbox" checked={mapping.enabled} onChange={(event) => updateMapping(index, { enabled: event.target.checked })} />
              Aktif
            </label>
            <button type="button" className="btn btn-outline" disabled={!mapping.enabled || testingPin === mapping.pin} onClick={async () => {
              setTestingPin(mapping.pin);
              setTestMessage('');
              try {
                const result = await triggerIotDeviceAction(device.deviceUid, mapping.pin);
                setTestMessage(result.message);
              } catch (reason) {
                setError(reason instanceof Error ? reason.message : 'Gagal menjalankan aksi uji.');
              } finally {
                setTestingPin(null);
              }
            }} aria-label={`Uji aksi pin ${mapping.pin}`}>
              <Activity size={14} /> {testingPin === mapping.pin ? 'Uji...' : 'Uji'}
            </button>
            <button type="button" className="btn btn-outline" onClick={() => setMappings((items) => items.filter((_, current) => current !== index))} aria-label="Hapus mapping pin">
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {testMessage && <p role="status" style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>{testMessage}</p>}
        {mappings.length === 0 && <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Belum ada mapping pin.</p>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="button" className="btn btn-primary" disabled={saving} onClick={() => void save()}>
            <Save size={14} /> {saving ? 'Menyimpan...' : 'Simpan konfigurasi'}
          </button>
        </div>
      </section>
    </div>
  );
}
