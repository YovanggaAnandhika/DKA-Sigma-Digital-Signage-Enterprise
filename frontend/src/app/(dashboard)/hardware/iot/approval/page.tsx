'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, LoaderCircle, RefreshCw, Cpu, X } from 'lucide-react';
import { approveIotDevice, IotDevice, listIotDevices } from '@/lib/services/studio/iot.service';

export default function IotApprovalPage() {
  const [devices, setDevices] = useState<IotDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Verification Modal State
  const [selectedDevice, setSelectedDevice] = useState<IotDevice | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [approving, setApproving] = useState(false);
  const [modalError, setModalError] = useState('');

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

  const handleOpenModal = (device: IotDevice) => {
    setSelectedDevice(device);
    setVerificationCode('');
    setModalError('');
  };

  const handleConfirmApproval = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedDevice) return;
    const cleanCode = verificationCode.trim().toUpperCase();
    if (!cleanCode) {
      setModalError('Silakan masukkan 6-karakter terakhir MAC Address perangkat.');
      return;
    }
    setApproving(true);
    setModalError('');
    try {
      await approveIotDevice(selectedDevice.id, cleanCode);
      setDevices((items) => items.filter((device) => device.id !== selectedDevice.id));
      setSelectedDevice(null);
    } catch (reason: any) {
      setModalError(reason instanceof Error ? reason.message : 'Persetujuan perangkat gagal.');
    } finally {
      setApproving(false);
    }
  };

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
              UID: <span style={{ fontFamily: 'monospace' }}>●●●●●●{device.deviceUid.slice(-6)}</span> · {device.ipAddress || 'IP belum diketahui'} · Terakhir terlihat {device.lastSeenAt || '-'}
            </div>
          </div>
          <button
            type="button"
            className="btn btn-primary iot-icon-button"
            onClick={() => handleOpenModal(device)}
            aria-label={`Setujui dan Verifikasi ${device.name}`}
            title="Setujui dan Verifikasi Perangkat IoT"
          >
            <Check size={19} />
          </button>
        </article>
      ))}

      {/* Modal Verifikasi Fisik Modul IoT */}
      {selectedDevice && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(3px)',
          }}
          onClick={() => !approving && setSelectedDevice(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: 'rgba(16, 185, 129, 0.15)',
                  color: 'var(--accent-emerald)',
                }}
              >
                <Cpu size={22} />
              </div>

              <div style={{ flex: 1, minWidth: 0, paddingTop: '2px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Verifikasi Modul Fisik IoT
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px', margin: 0 }}>
                  Perangkat: <b>{selectedDevice.name}</b>
                </p>
              </div>

              <button
                type="button"
                onClick={() => !approving && setSelectedDevice(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Tutup"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleConfirmApproval} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Masukkan <b>6 karakter terakhir MAC Address / UID</b> yang tertera pada stiker fisik modul untuk mengikat perangkat ini ke korporasi Anda:
              </p>

              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  placeholder="CONTOH: 84F3EB"
                  maxLength={12}
                  className="form-input"
                  style={{
                    fontSize: '1.15rem',
                    fontWeight: 800,
                    fontFamily: 'monospace',
                    letterSpacing: '0.2em',
                    textAlign: 'center',
                    textTransform: 'uppercase',
                    padding: '12px',
                  }}
                  disabled={approving}
                />
              </div>

              {modalError && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {modalError}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedDevice(null)}
                  className="btn btn-secondary"
                  disabled={approving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={approving || !verificationCode.trim()}
                >
                  {approving ? 'Memverifikasi...' : 'Verifikasi & Setujui'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
