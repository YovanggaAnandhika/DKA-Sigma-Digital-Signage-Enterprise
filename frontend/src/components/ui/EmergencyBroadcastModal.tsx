'use client';

import React, { useState, useEffect } from 'react';
import { api, Device } from '@/lib/services';
import { pushDeviceCommand, ServerCommandType } from '@/lib/services/hardware/device.service';
import { AlertTriangle, Send, X, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface EmergencyBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function EmergencyBroadcastModal({ isOpen, onClose }: EmergencyBroadcastModalProps) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [targetScope, setTargetScope] = useState<'all' | 'specific'>('all');
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [alertType, setAlertType] = useState<'danger' | 'warning' | 'info'>('danger');
  const [message, setMessage] = useState<string>('PERHATIAN: Peringatan Darurat Gedung. Harap ikuti instruksi petugas dan segera menuju jalur evakuasi terdekat.');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getDevices({ limit: 100 }).then(res => {
        setDevices(res.data);
      }).catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return alert('Pesan siaran darurat tidak boleh kosong.');

    try {
      setSending(true);
      setFeedback(null);

      const payload = JSON.stringify({
        alertType,
        message: message.trim(),
        timestamp: Date.now(),
        broadcastBy: 'Admin Signage Enterprise',
      });

      const targets = targetScope === 'all' 
        ? devices 
        : devices.filter(d => d.id === selectedDeviceId);

      if (targets.length === 0) {
        alert('Tidak ada display tujuan yang dipilih.');
        return;
      }

      await Promise.all(
        targets.map(d => pushDeviceCommand(d.id, ServerCommandType.COMMAND_EMERGENCY_BROADCAST, payload))
      );

      setFeedback(`Siaran darurat berhasil dikirim ke ${targets.length} layar display!`);
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 2500);
    } catch (err: any) {
      alert(`Gagal mengirim siaran darurat: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  const handleClearAlert = async () => {
    if (!confirm('Batalkan siaran darurat di semua layar?')) return;
    try {
      setSending(true);
      const payload = JSON.stringify({ alertType: 'clear', message: '', timestamp: Date.now() });
      await Promise.all(
        devices.map(d => pushDeviceCommand(d.id, ServerCommandType.COMMAND_RELOAD_MANIFEST, payload))
      );
      alert('Siaran darurat telah dihentikan, layar kembali ke playlist normal.');
      onClose();
    } catch (err: any) {
      alert(`Gagal membatalkan: ${err.message}`);
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.75)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px',
    }}>
      <div style={{
        width: '100%',
        maxWidth: '560px',
        backgroundColor: 'var(--bg-surface)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid rgba(244, 63, 94, 0.35)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(244, 63, 94, 0.2)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{
          padding: '18px 24px',
          backgroundColor: 'rgba(244, 63, 94, 0.12)',
          borderBottom: '1px solid rgba(244, 63, 94, 0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-rose)' }}>
            <ShieldAlert size={22} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 800, color: 'var(--text-primary)', margin: 0 }}>
              Siaran Darurat Layar (Emergency Broadcast)
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleBroadcast} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {feedback && (
            <div style={{
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: 'rgba(16, 185, 129, 0.15)',
              color: 'var(--accent-emerald)',
              fontSize: '0.875rem',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <CheckCircle2 size={16} />
              <span>{feedback}</span>
            </div>
          )}

          {/* Level Alert */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Tingkat Peringatan
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setAlertType('danger')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: alertType === 'danger' ? '2px solid var(--accent-rose)' : '1px solid var(--border-subtle)',
                  backgroundColor: alertType === 'danger' ? 'rgba(244, 63, 94, 0.15)' : 'var(--bg-surface-elevated)',
                  color: alertType === 'danger' ? 'var(--accent-rose)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                🚨 Bahaya (Merah)
              </button>
              <button
                type="button"
                onClick={() => setAlertType('warning')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: alertType === 'warning' ? '2px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
                  backgroundColor: alertType === 'warning' ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface-elevated)',
                  color: alertType === 'warning' ? 'var(--accent-amber)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                ⚠️ Peringatan (Kuning)
              </button>
              <button
                type="button"
                onClick={() => setAlertType('info')}
                style={{
                  padding: '10px',
                  borderRadius: '8px',
                  border: alertType === 'info' ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                  backgroundColor: alertType === 'info' ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-elevated)',
                  color: alertType === 'info' ? 'var(--primary-400)' : 'var(--text-muted)',
                  fontWeight: 700,
                  fontSize: '0.8125rem',
                  cursor: 'pointer',
                }}
              >
                ℹ️ Informasi (Biru)
              </button>
            </div>
          </div>

          {/* Scope Target */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Target Layar Tujuan
            </label>
            <div style={{ display: 'flex', gap: '16px', marginBottom: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'all'}
                  onChange={() => setTargetScope('all')}
                />
                <span>Semua Layar Aktif ({devices.length} Display)</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.875rem', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="scope"
                  checked={targetScope === 'specific'}
                  onChange={() => setTargetScope('specific')}
                />
                <span>Layar Tertentu</span>
              </label>
            </div>

            {targetScope === 'specific' && (
              <select
                value={selectedDeviceId}
                onChange={e => setSelectedDeviceId(e.target.value)}
                className="form-select"
                required
              >
                <option value="">-- Pilih Layar Display --</option>
                {devices.map(d => (
                  <option key={d.id} value={d.id}>{d.name} ({d.isOnline ? 'Online' : 'Offline'})</option>
                ))}
              </select>
            )}
          </div>

          {/* Message Textarea */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Pesan Siaran Darurat (Teks Berjalan / Banner Atas Layar) *
            </label>
            <textarea
              required
              rows={3}
              value={message}
              onChange={e => setMessage(e.target.value)}
              className="form-input"
              placeholder="Ketik teks siaran darurat di sini..."
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '8px' }}>
            <button
              type="button"
              onClick={handleClearAlert}
              disabled={sending}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                fontSize: '0.8125rem',
                textDecoration: 'underline',
                cursor: 'pointer',
              }}
            >
              Hentikan Siaran di Layar
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" disabled={sending}>
                Tutup
              </button>
              <button
                type="submit"
                disabled={sending}
                className="btn btn-primary"
                style={{
                  backgroundColor: 'var(--accent-rose)',
                  borderColor: 'var(--accent-rose)',
                }}
              >
                <Send size={14} />
                <span>{sending ? 'Mengirim...' : 'Kirim Siaran Sekarang'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
