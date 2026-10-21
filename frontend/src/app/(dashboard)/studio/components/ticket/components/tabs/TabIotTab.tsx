'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Cpu,
  Plus,
  Trash2,
  Edit3,
  Power,
  Play,
  CheckCircle2,
  AlertTriangle,
  Wifi,
  Settings2,
  RefreshCw,
  Radio,
  Sliders,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Hash,
  Activity,
  Layers,
  Terminal,
} from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import {
  listQueueDevices,
  registerQueueDevice,
  updateQueueDevice,
  deleteQueueDevice,
  triggerQueueDeviceAction,
  listDiscoveredDevices,
  QueueIotDeviceData,
  PinMappingData,
  DiscoveredDeviceData,
} from '@/lib/services/studio/queue_device.service';

const ACTION_OPTIONS = [
  { value: 'CALL_NEXT', label: 'Panggil Berikutnya (Next Call)', badge: 'primary', icon: '▶' },
  { value: 'RECALL', label: 'Panggil Ulang (Recall)', badge: 'info', icon: '↺' },
  { value: 'CALL_PREV', label: 'Panggil Sebelumnya (Prev)', badge: 'secondary', icon: '◀' },
  { value: 'TOGGLE_BREAK', label: 'Toggle Istirahat Loket (Break)', badge: 'warning', icon: '☕' },
  { value: 'TOGGLE_CLOSE', label: 'Toggle Tutup / Kunci Loket (Close)', badge: 'danger', icon: '🔒' },
  { value: 'ISSUE_TICKET', label: 'Ambil / Cetak Karcis (Ticket)', badge: 'success', icon: '🎟' },
];

const PRESETS: Record<string, { role: string; mappings: PinMappingData[] }> = {
  remote3: {
    role: 'COUNTER_REMOTE',
    mappings: [
      { pin: 13, action: 'CALL_NEXT', enabled: true, label: 'Panggil Berikutnya' },
      { pin: 12, action: 'RECALL', enabled: true, label: 'Panggil Ulang' },
      { pin: 14, action: 'TOGGLE_BREAK', enabled: true, label: 'Istirahat Loket' },
    ],
  },
  remote5: {
    role: 'COUNTER_REMOTE',
    mappings: [
      { pin: 13, action: 'CALL_NEXT', enabled: true, label: 'Panggil Berikutnya' },
      { pin: 12, action: 'RECALL', enabled: true, label: 'Panggil Ulang' },
      { pin: 14, action: 'TOGGLE_BREAK', enabled: true, label: 'Istirahat Loket' },
      { pin: 27, action: 'TOGGLE_CLOSE', enabled: true, label: 'Tutup Loket' },
      { pin: 26, action: 'CALL_PREV', enabled: true, label: 'Panggilan Sebelumnya' },
    ],
  },
  kiosk: {
    role: 'TICKET_DISPENSER',
    mappings: [
      { pin: 13, action: 'ISSUE_TICKET', enabled: true, label: 'Ambil Karcis Masuk' },
    ],
  },
};

export default function TabIotTab() {
  const { queue } = useQueueEditor();
  const [devices, setDevices] = useState<QueueIotDeviceData[]>([]);
  const [discoveredDevices, setDiscoveredDevices] = useState<DiscoveredDeviceData[]>([]);
  const [manualUidInput, setManualUidInput] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [editingDevice, setEditingDevice] = useState<QueueIotDeviceData | null>(null);
  const [guideOpen, setGuideOpen] = useState<boolean>(false);

  // Modal form state
  const [name, setName] = useState('');
  const [deviceUid, setDeviceUid] = useState('');
  const [deviceRole, setDeviceRole] = useState('COUNTER_REMOTE');
  const [counterId, setCounterId] = useState('');
  const [ticketPrefix, setTicketPrefix] = useState('A');
  const [isActive, setIsActive] = useState(true);
  const [pinMappings, setPinMappings] = useState<PinMappingData[]>([]);
  const [saving, setSaving] = useState(false);

  // Test simulation state
  const [testingPinKey, setTestingPinKey] = useState<string | null>(null);
  const [testNotice, setTestNotice] = useState<{ uid: string; pin: number; text: string; ok: boolean } | null>(null);

  const fetchDevices = useCallback(async () => {
    if (!queue?.id) return;
    setLoading(true);
    try {
      const [devList, discList] = await Promise.all([
        listQueueDevices(queue.id).catch(() => []),
        listDiscoveredDevices().catch(() => []),
      ]);
      setDevices(devList);
      setDiscoveredDevices(discList);
    } catch (e) {
      console.error('Failed to load IoT devices:', e);
    } finally {
      setLoading(false);
    }
  }, [queue?.id]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  const unpairedDevices = discoveredDevices.filter((d) => !d.isPaired);

  const openCreateModal = (defaultUid?: string) => {
    setEditingDevice(null);
    setName(`Tombol Loket ${queue.counters?.[0]?.counterName || '1'}`);
    const chosenUid = defaultUid || (unpairedDevices.length > 0 ? unpairedDevices[0].deviceUid : '');
    setDeviceUid(chosenUid);
    setManualUidInput(!chosenUid);
    setDeviceRole('COUNTER_REMOTE');
    setCounterId(queue.counters?.[0]?.id || '');
    setTicketPrefix(queue.prefix || 'A');
    setIsActive(true);
    setPinMappings(PRESETS.remote3.mappings);
    setModalOpen(true);
  };

  const handleApproveDiscovered = (disc: DiscoveredDeviceData) => {
    openCreateModal(disc.deviceUid);
  };

  const openEditModal = (dev: QueueIotDeviceData) => {
    setEditingDevice(dev);
    setName(dev.name);
    setDeviceUid(dev.deviceUid);
    setManualUidInput(false);
    setDeviceRole(dev.deviceRole);
    setCounterId(dev.counterId || '');
    setTicketPrefix(dev.ticketPrefix || queue.prefix || 'A');
    setIsActive(dev.isActive);
    setPinMappings(dev.pinMappings && dev.pinMappings.length > 0 ? dev.pinMappings : PRESETS.remote3.mappings);
    setModalOpen(true);
  };

  const applyPreset = (key: string) => {
    const preset = PRESETS[key];
    if (!preset) return;
    setDeviceRole(preset.role);
    setPinMappings(preset.mappings);
  };

  const handleAddPin = () => {
    const usedPins = new Set(pinMappings.map((p) => p.pin));
    const candidatePins = [13, 12, 14, 27, 26, 25, 33, 32, 15, 4, 5];
    const nextPin = candidatePins.find((p) => !usedPins.has(p)) || 16;
    setPinMappings([
      ...pinMappings,
      { pin: nextPin, action: 'CALL_NEXT', enabled: true, label: `Tombol GPIO ${nextPin}` },
    ]);
  };

  const handleRemovePin = (idx: number) => {
    setPinMappings(pinMappings.filter((_, i) => i !== idx));
  };

  const handlePinFieldChange = (idx: number, field: keyof PinMappingData, value: any) => {
    const next = [...pinMappings];
    next[idx] = { ...next[idx], [field]: value };
    setPinMappings(next);
  };

  const handleSaveModal = async () => {
    if (!deviceUid.trim()) {
      alert('Mohon isi Device UID / MAC Address perangkat ESP32');
      return;
    }
    setSaving(true);
    try {
      if (editingDevice) {
        await updateQueueDevice({
          id: editingDevice.id,
          name,
          deviceRole,
          counterId: counterId || undefined,
          ticketPrefix,
          pinMappings,
          isActive,
        });
      } else {
        await registerQueueDevice({
          queueDisplayId: queue.id,
          deviceUid: deviceUid.trim(),
          name,
          deviceRole,
          counterId: counterId || undefined,
          ticketPrefix,
          pinMappings,
          isActive,
        });
      }
      setModalOpen(false);
      fetchDevices();
    } catch (e: any) {
      alert(`Gagal menyimpan: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteDevice = async (id: string, devName: string) => {
    if (!confirm(`Hapus konfigurasi perangkat "${devName}"?`)) return;
    try {
      await deleteQueueDevice(id);
      fetchDevices();
    } catch (e: any) {
      alert(`Gagal menghapus: ${e.message}`);
    }
  };

  const handleToggleMasterActive = async (dev: QueueIotDeviceData) => {
    try {
      await updateQueueDevice({
        id: dev.id,
        name: dev.name,
        deviceRole: dev.deviceRole,
        counterId: dev.counterId,
        ticketPrefix: dev.ticketPrefix,
        pinMappings: dev.pinMappings,
        isActive: !dev.isActive,
      });
      fetchDevices();
    } catch (e: any) {
      alert(`Gagal mengubah status: ${e.message}`);
    }
  };

  const handleTogglePinActive = async (dev: QueueIotDeviceData, pinIdx: number) => {
    const updated = [...dev.pinMappings];
    updated[pinIdx].enabled = !updated[pinIdx].enabled;
    try {
      await updateQueueDevice({
        id: dev.id,
        name: dev.name,
        deviceRole: dev.deviceRole,
        counterId: dev.counterId,
        ticketPrefix: dev.ticketPrefix,
        pinMappings: updated,
        isActive: dev.isActive,
      });
      fetchDevices();
    } catch (e: any) {
      alert(`Gagal mengubah status pin: ${e.message}`);
    }
  };

  const handleTestPin = async (dev: QueueIotDeviceData, pin: number) => {
    const key = `${dev.id}-${pin}`;
    setTestingPinKey(key);
    try {
      const res = await triggerQueueDeviceAction(queue.id, dev.deviceUid, pin);
      setTestNotice({
        uid: dev.deviceUid,
        pin,
        text: res.message || `Aksi ${res.action} dieksekusi`,
        ok: res.success,
      });
      fetchDevices();
    } catch (e: any) {
      setTestNotice({
        uid: dev.deviceUid,
        pin,
        text: `Error: ${e.message}`,
        ok: false,
      });
    } finally {
      setTestingPinKey(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1200px', margin: '0 auto', width: '100%' }}>
      {/* Header Bar */}
      <div
        className="card-elevated"
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--primary-500)',
            }}
          >
            <Cpu size={24} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Perangkat IoT & Tombol Antrean (NodeMCU ESP32)
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', margin: '3px 0 0 0' }}>
              Kontrol antrean fisik melalui protokol MQTT. Atur pin tombol karcis atau remote pemanggil loket secara dinamis.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => setGuideOpen(!guideOpen)}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 12px' }}
          >
            <Terminal size={14} />
            <span>Panduan Wiring & Flashing</span>
            {guideOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <button
            type="button"
            onClick={fetchDevices}
            disabled={loading}
            className="btn btn-outline"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', padding: '7px 12px' }}
            title="Muat ulang data perangkat"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>

          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', padding: '7px 14px' }}
          >
            <Plus size={15} />
            <span>+ Pasangkan NodeMCU ESP32</span>
          </button>
        </div>
      </div>

      {/* Test Notice Toast Banner */}
      {testNotice && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '10px',
            backgroundColor: testNotice.ok ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
            border: `1px solid ${testNotice.ok ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.8125rem',
            color: testNotice.ok ? 'var(--accent-emerald, #10b981)' : 'var(--accent-rose, #ef4444)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {testNotice.ok ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
            <span>
              <strong>Simulasi Pin {testNotice.pin} ({testNotice.uid}):</strong> {testNotice.text}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTestNotice(null)}
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'inherit' }}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* Guide Box */}
      {guideOpen && (
        <div
          className="card-elevated"
          style={{
            padding: '20px 24px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-strong)',
            borderRadius: '12px',
            fontSize: '0.8125rem',
            lineHeight: 1.6,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', color: 'var(--primary-500)', fontWeight: 700 }}>
            <Terminal size={16} />
            <span>Panduan Teknis NodeMCU ESP32 & MQTT (DKASigma)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>1. Info Broker MQTT</div>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                <li>Host: <code>dka-product-sigma-mqtt</code> (Docker) / IP Host Mesin / Domain Nginx</li>
                <li>Port TCP: <code>1883</code></li>
                <li>Topic Action: <code>dka/iot/&#123;device_uid&#125;/action</code></li>
                <li>Topic ACK: <code>dka/iot/&#123;device_uid&#125;/ack</code></li>
                <li>Topic Telemetri: <code>dka/iot/&#123;device_uid&#125;/telemetry</code></li>
              </ul>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>2. Skema Wiring Pushbutton</div>
              <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)' }}>
                Menggunakan mode <code>INPUT_PULLUP</code> internal ESP32 (tidak perlu resistor eksternal):
              </p>
              <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)' }}>
                <li>Kaki 1 Pushbutton ➔ Pin GPIO (13, 12, 14, dst.)</li>
                <li>Kaki 2 Pushbutton ➔ Pin GND ESP32</li>
                <li>LED Indikator Status ➔ GPIO 2 (Onboard Blue LED)</li>
              </ul>
            </div>

            <div style={{ backgroundColor: 'var(--bg-surface)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
              <div style={{ fontWeight: 600, marginBottom: '6px', color: 'var(--text-primary)' }}>3. Lokasi Source Code Arduino</div>
              <p style={{ margin: '0 0 6px 0', color: 'var(--text-secondary)' }}>
                Buka file <code>iot/esp32_queue_button/esp32_queue_button.ino</code> di Arduino IDE, sesuaikan Wi-Fi SSID & Password, lalu tekan Upload!
              </p>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                *MAC address ESP32 akan otomatis dideteksi dan ditampilkan di Serial Monitor (baud 115200).
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Discovery Pending Approval Card */}
      {unpairedDevices.length > 0 && (
        <div
          className="card-elevated"
          style={{
            padding: '16px 20px',
            backgroundColor: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.35)',
            borderRadius: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            boxShadow: '0 4px 15px rgba(59, 130, 246, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary-500)', fontWeight: 700, fontSize: '0.875rem' }}>
              <Radio size={16} />
              <span>{unpairedDevices.length} Perangkat NodeMCU ESP32 Terdeteksi di Jaringan (Siap Disetujui)</span>
            </div>
            <span style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)' }}>
              ESP32 otomatis terdeteksi via MQTT. Klik "Setujui" untuk menghubungkan langsung ke antrean ini tanpa input manual.
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '10px' }}>
            {unpairedDevices.map((disc) => (
              <div
                key={disc.deviceUid}
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981' }} />
                    <strong style={{ fontSize: '0.84rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {disc.deviceUid}
                    </strong>
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-secondary)', marginTop: '3px' }}>
                    IP: <code>{disc.ipAddress || 'Lokal'}</code> • FW: <code>{disc.firmwareVersion || '1.0.0'}</code>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleApproveDiscovered(disc)}
                  className="btn btn-primary"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                >
                  <Check size={13} />
                  <span>Setujui & Hubungkan</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Devices List */}
      {loading ? (
        <div className="card-elevated" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
          <span>Memuat data perangkat IoT antrean...</span>
        </div>
      ) : devices.length === 0 ? (
        <div
          className="card-elevated"
          style={{
            padding: '50px 30px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            border: '1px dashed var(--border-strong)',
            borderRadius: '12px',
          }}
        >
          <Cpu size={40} style={{ color: 'var(--text-muted)', margin: '0 auto 16px auto', opacity: 0.6 }} />
          <h3 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 8px 0', color: 'var(--text-primary)' }}>
            Belum Ada Perangkat NodeMCU ESP32 Terpasang
          </h3>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 20px auto' }}>
            Hubungkan modul ESP32 Anda sebagai tombol pencetak tiket karcis fisik atau tombol remote loket untuk memanggil antrean tanpa keyboard.
          </p>
          <button
            type="button"
            onClick={() => openCreateModal()}
            className="btn btn-primary"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
          >
            <Plus size={15} />
            <span>Pasangkan Perangkat Pertama</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {devices.map((dev) => {
            const isOnline = dev.lastSeenAt && new Date().getTime() - new Date(dev.lastSeenAt).getTime() < 120000;
            const boundCounter = queue.counters?.find((c) => c.id === dev.counterId);

            return (
              <div
                key={dev.id}
                className="card-elevated"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  border: `1px solid ${dev.isActive ? 'var(--border-subtle)' : 'rgba(239, 68, 68, 0.25)'}`,
                  borderRadius: '12px',
                  overflow: 'hidden',
                  opacity: dev.isActive ? 1 : 0.85,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Device Card Header */}
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '12px',
                    backgroundColor: dev.isActive ? 'var(--bg-surface-elevated)' : 'rgba(239, 68, 68, 0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '8px',
                        backgroundColor: dev.isActive ? 'rgba(59, 130, 246, 0.12)' : 'rgba(156, 163, 175, 0.12)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: dev.isActive ? 'var(--primary-500)' : 'var(--text-muted)',
                      }}
                    >
                      <Cpu size={20} />
                    </div>

                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: '0.98rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                          {dev.name}
                        </h3>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            backgroundColor: dev.deviceRole === 'TICKET_DISPENSER' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(59, 130, 246, 0.15)',
                            color: dev.deviceRole === 'TICKET_DISPENSER' ? '#10b981' : '#3b82f6',
                          }}
                        >
                          {dev.deviceRole === 'TICKET_DISPENSER' ? '🎟️ Tombol Karcis' : dev.deviceRole === 'HYBRID' ? '⚡ Hybrid' : '📟 Remote Loket'}
                        </span>

                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.7rem',
                            fontWeight: 500,
                            color: isOnline ? '#10b981' : 'var(--text-muted)',
                          }}
                        >
                          <span
                            style={{
                              width: '7px',
                              height: '7px',
                              borderRadius: '50%',
                              backgroundColor: isOnline ? '#10b981' : 'var(--text-muted)',
                            }}
                          />
                          {isOnline ? 'Online' : 'Offline'}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <span>UID: <code>{dev.deviceUid}</code></span>
                        {dev.counterId && (
                          <span>Loket: <strong>{boundCounter ? boundCounter.counterName : dev.counterId.slice(0, 8)}</strong></span>
                        )}
                        {dev.deviceRole === 'TICKET_DISPENSER' && (
                          <span>Prefix Tiket: <strong>{dev.ticketPrefix || 'A'}</strong></span>
                        )}
                        {dev.ipAddress && <span>IP: {dev.ipAddress}</span>}
                        {dev.lastAction && (
                          <span style={{ color: 'var(--text-muted)' }}>Aksi Terakhir: {dev.lastAction}</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {/* Master Switch */}
                    <button
                      type="button"
                      onClick={() => handleToggleMasterActive(dev)}
                      className="btn btn-outline"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        fontSize: '0.75rem',
                        padding: '5px 10px',
                        color: dev.isActive ? '#10b981' : 'var(--accent-rose, #ef4444)',
                        borderColor: dev.isActive ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.4)',
                        backgroundColor: dev.isActive ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                      }}
                      title={dev.isActive ? 'Klik untuk menonaktifkan seluruh tombol ESP32 ini' : 'Klik untuk mengaktifkan kembali'}
                    >
                      <Power size={13} />
                      <span>{dev.isActive ? 'Aktif (Master On)' : 'Dinonaktifkan (Disabled)'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(dev)}
                      className="btn btn-outline"
                      style={{ padding: '5px 8px', fontSize: '0.75rem' }}
                      title="Edit Konfigurasi & Pin"
                    >
                      <Edit3 size={13} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteDevice(dev.id, dev.name)}
                      className="btn btn-outline"
                      style={{ padding: '5px 8px', fontSize: '0.75rem', color: 'var(--accent-rose, #ef4444)' }}
                      title="Hapus Perangkat"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Disabled Banner Warning */}
                {!dev.isActive && (
                  <div
                    style={{
                      padding: '8px 20px',
                      backgroundColor: 'rgba(239, 68, 68, 0.08)',
                      borderBottom: '1px solid rgba(239, 68, 68, 0.15)',
                      fontSize: '0.75rem',
                      color: 'var(--accent-rose, #ef4444)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <AlertTriangle size={14} />
                    <span>Perangkat ini dinonaktifkan. Semua event tombol fisik dari NodeMCU ini akan diabaikan oleh backend.</span>
                  </div>
                )}

                {/* Pin Mappings Table */}
                <div style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                      Pemetaan Pin GPIO & Tombol Fisik
                    </div>
                    <span style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                      Tekan tombol "Tes Trigger" untuk mensimulasikan penekanan tombol fisik secara instan.
                    </span>
                  </div>

                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
                      <thead>
                        <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', textAlign: 'left' }}>
                          <th style={{ padding: '8px 10px', width: '90px' }}>Pin GPIO</th>
                          <th style={{ padding: '8px 10px' }}>Label Tombol</th>
                          <th style={{ padding: '8px 10px' }}>Aksi Sistem Antrean</th>
                          <th style={{ padding: '8px 10px', width: '140px', textAlign: 'center' }}>Status Pin</th>
                          <th style={{ padding: '8px 10px', width: '130px', textAlign: 'right' }}>Uji Simulasi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dev.pinMappings.map((pm, pidx) => {
                          const actionMeta = ACTION_OPTIONS.find((a) => a.value === pm.action) || ACTION_OPTIONS[0];
                          const isPinTesting = testingPinKey === `${dev.id}-${pm.pin}`;

                          return (
                            <tr
                              key={pidx}
                              style={{
                                borderBottom: '1px solid var(--border-subtle)',
                                opacity: pm.enabled && dev.isActive ? 1 : 0.5,
                              }}
                            >
                              <td style={{ padding: '10px 10px' }}>
                                <span
                                  style={{
                                    fontFamily: 'monospace',
                                    fontWeight: 700,
                                    fontSize: '0.78rem',
                                    padding: '2px 8px',
                                    borderRadius: '6px',
                                    backgroundColor: 'var(--bg-surface-elevated)',
                                    border: '1px solid var(--border-subtle)',
                                  }}
                                >
                                  GPIO {pm.pin}
                                </span>
                              </td>

                              <td style={{ padding: '10px 10px', fontWeight: 500, color: 'var(--text-primary)' }}>
                                {pm.label || `Tombol Pin ${pm.pin}`}
                              </td>

                              <td style={{ padding: '10px 10px' }}>
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    fontSize: '0.78rem',
                                    color: 'var(--text-primary)',
                                  }}
                                >
                                  <span>{actionMeta.icon}</span>
                                  <span>{actionMeta.label}</span>
                                </span>
                              </td>

                              <td style={{ padding: '10px 10px', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePinActive(dev, pidx)}
                                  disabled={!dev.isActive}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: dev.isActive ? 'pointer' : 'not-allowed',
                                    fontSize: '0.75rem',
                                    padding: '3px 8px',
                                    borderRadius: '6px',
                                    fontWeight: 600,
                                    color: pm.enabled ? '#10b981' : 'var(--text-muted)',
                                    backgroundColor: pm.enabled ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-surface-elevated)',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                  }}
                                >
                                  {pm.enabled ? <Check size={12} /> : <X size={12} />}
                                  <span>{pm.enabled ? 'Aktif' : 'Disabled'}</span>
                                </button>
                              </td>

                              <td style={{ padding: '10px 10px', textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => handleTestPin(dev, pm.pin)}
                                  disabled={!dev.isActive || !pm.enabled || isPinTesting}
                                  className="btn btn-outline"
                                  style={{
                                    padding: '4px 10px',
                                    fontSize: '0.71875rem',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                  }}
                                  title="Kirim event simulasi penekanan tombol fisik ini"
                                >
                                  <Play size={11} className={isPinTesting ? 'animate-spin' : ''} />
                                  <span>{isPinTesting ? 'Mengirim...' : 'Tes Trigger'}</span>
                                </button>
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
          })}
        </div>
      )}

      {/* Modal Add / Edit Device */}
      {modalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-strong)',
              borderRadius: '14px',
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: '18px 24px',
                borderBottom: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Cpu size={20} style={{ color: 'var(--primary-500)' }} />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  {editingDevice ? 'Edit Konfigurasi Perangkat IoT' : 'Pasangkan Modul NodeMCU ESP32 Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Presets Quick Pick */}
              {!editingDevice && (
                <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    TEMPLATE / PRESET CEPAT:
                  </div>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => applyPreset('remote3')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      📟 Remote 3 Tombol (Next, Recall, Break)
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('remote5')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      📟 Remote 5 Tombol Lengkap
                    </button>
                    <button
                      type="button"
                      onClick={() => applyPreset('kiosk')}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                    >
                      🎟️ Tombol Karcis Masuk (Kiosk)
                    </button>
                  </div>
                </div>
              )}

              {/* Basic Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Nama Perangkat:
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Remote Loket 01"
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '5px' }}>
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Device UID / MAC Address:
                    </label>
                    {!editingDevice && (
                      <button
                        type="button"
                        onClick={() => setManualUidInput(!manualUidInput)}
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: 'var(--primary-500)',
                          fontSize: '0.72rem',
                          cursor: 'pointer',
                          textDecoration: 'underline',
                          padding: 0,
                        }}
                      >
                        {manualUidInput ? '← Pilih dari Terdeteksi' : '✍️ Input Manual'}
                      </button>
                    )}
                  </div>

                  {editingDevice ? (
                    <input
                      type="text"
                      value={deviceUid}
                      disabled
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem', fontFamily: 'monospace', opacity: 0.7 }}
                    />
                  ) : !manualUidInput && unpairedDevices.length > 0 ? (
                    <div>
                      <select
                        value={deviceUid}
                        onChange={(e) => {
                          if (e.target.value === '__MANUAL__') {
                            setManualUidInput(true);
                            setDeviceUid('');
                          } else {
                            setDeviceUid(e.target.value);
                          }
                        }}
                        className="input-field"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                      >
                        <option value="">-- Pilih dari Perangkat Terdeteksi ({unpairedDevices.length} Siap) --</option>
                        {unpairedDevices.map((d) => (
                          <option key={d.deviceUid} value={d.deviceUid}>
                            🟢 {d.deviceUid} {d.ipAddress ? `(IP: ${d.ipAddress})` : ''} - Terdeteksi
                          </option>
                        ))}
                        <option value="__MANUAL__">✍️ Input MAC Manual...</option>
                      </select>
                      <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'block', marginTop: '3px' }}>
                        ✓ Otomatis terdeteksi dari koneksi broker MQTT.
                      </span>
                    </div>
                  ) : (
                    <div>
                      <input
                        type="text"
                        value={deviceUid}
                        onChange={(e) => setDeviceUid(e.target.value)}
                        placeholder="Contoh: ESP32_3C61054A2B1C"
                        className="input-field"
                        style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem', fontFamily: 'monospace' }}
                      />
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '3px' }}>
                        *Nyalakan modul ESP32 Anda agar terdeteksi secara otomatis tanpa perlu input manual.
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Role & Target Binding */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                    Peran Utama (Device Role):
                  </label>
                  <select
                    value={deviceRole}
                    onChange={(e) => setDeviceRole(e.target.value)}
                    className="input-field"
                    style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem' }}
                  >
                    <option value="COUNTER_REMOTE">📟 Remote Pemanggil Loket (Counter Remote)</option>
                    <option value="TICKET_DISPENSER">🎟️ Tombol Karcis Masuk (Ticket Dispenser)</option>
                    <option value="HYBRID">⚡ Multi-Fungsi / Hybrid</option>
                  </select>
                </div>

                {deviceRole !== 'TICKET_DISPENSER' ? (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Loket Terkait:
                    </label>
                    <select
                      value={counterId}
                      onChange={(e) => setCounterId(e.target.value)}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem' }}
                    >
                      <option value="">-- Pilih Loket Sasaran --</option>
                      {queue.counters?.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.counterName} ({c.operatorName || 'Tanpa Operator'})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, marginBottom: '5px', color: 'var(--text-secondary)' }}>
                      Prefix Tiket Karcis:
                    </label>
                    <input
                      type="text"
                      value={ticketPrefix}
                      onChange={(e) => setTicketPrefix(e.target.value.toUpperCase())}
                      placeholder="Contoh: A"
                      maxLength={5}
                      className="input-field"
                      style={{ width: '100%', padding: '8px 12px', fontSize: '0.8125rem' }}
                    />
                  </div>
                )}
              </div>

              {/* Master Active Toggle */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Status Aktif Perangkat (Master Enable)
                  </div>
                  <div style={{ fontSize: '0.71875rem', color: 'var(--text-muted)' }}>
                    Jika dimatikan, semua tombol fisik dari ESP32 ini akan diabaikan oleh server.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsActive(!isActive)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    backgroundColor: isActive ? 'var(--primary-600)' : 'var(--bg-secondary)',
                    color: isActive ? '#fff' : 'var(--text-muted)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {isActive ? 'AKTIF (ON)' : 'DISABLED (OFF)'}
                </button>
              </div>

              {/* Dynamic Pin Mappings Table */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Konfigurasi Pin GPIO & Aksi Tombol
                  </div>
                  <button
                    type="button"
                    onClick={handleAddPin}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <Plus size={13} />
                    <span>+ Tambah Pin GPIO</span>
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {pinMappings.map((pm, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '90px 1fr 1fr 70px 36px',
                        gap: '8px',
                        alignItems: 'center',
                        padding: '8px 12px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {/* Pin Selection */}
                      <div>
                        <select
                          value={pm.pin}
                          onChange={(e) => handlePinFieldChange(idx, 'pin', Number(e.target.value))}
                          className="input-field"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem', fontFamily: 'monospace' }}
                        >
                          {[13, 12, 14, 27, 26, 25, 33, 32, 15, 4, 5, 16, 17, 18, 19, 21, 22, 23].map((p) => (
                            <option key={p} value={p}>
                              GPIO {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Label Input */}
                      <div>
                        <input
                          type="text"
                          value={pm.label || ''}
                          onChange={(e) => handlePinFieldChange(idx, 'label', e.target.value)}
                          placeholder="Label Tombol"
                          className="input-field"
                          style={{ width: '100%', padding: '6px 10px', fontSize: '0.75rem' }}
                        />
                      </div>

                      {/* Action Selection */}
                      <div>
                        <select
                          value={pm.action}
                          onChange={(e) => handlePinFieldChange(idx, 'action', e.target.value)}
                          className="input-field"
                          style={{ width: '100%', padding: '6px 8px', fontSize: '0.75rem' }}
                        >
                          {ACTION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.icon} {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Enable Switch */}
                      <div style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handlePinFieldChange(idx, 'enabled', !pm.enabled)}
                          style={{
                            padding: '4px 8px',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            backgroundColor: pm.enabled ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: pm.enabled ? '#10b981' : '#ef4444',
                          }}
                        >
                          {pm.enabled ? 'Aktif' : 'Off'}
                        </button>
                      </div>

                      {/* Delete Pin Row */}
                      <div>
                        <button
                          type="button"
                          onClick={() => handleRemovePin(idx)}
                          disabled={pinMappings.length <= 1}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: pinMappings.length <= 1 ? 'not-allowed' : 'pointer',
                            color: 'var(--accent-rose, #ef4444)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                          title="Hapus pin ini"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: '10px',
              }}
            >
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="btn btn-outline"
                style={{ fontSize: '0.8125rem' }}
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveModal}
                disabled={saving}
                className="btn btn-primary"
                style={{ fontSize: '0.8125rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Check size={14} />
                    <span>Simpan Perangkat</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
