'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  RefreshCw,
  Camera,
  RotateCcw,
  Trash2,
  Edit,
  CheckCircle2,
  Zap,
  Unlink2,
  Moon,
  Sun,
  CircleX,
} from 'lucide-react';
import { ServerCommandType } from '@/lib/services/hardware/device.service';
import { api } from '@/lib/services';
import { useDisplayDetail } from '../context/DisplayDetailContext';

export default function DisplayCommandToolbar() {
  const router = useRouter();
  const [unbinding, setUnbinding] = React.useState(false);
  const [showPairModal, setShowPairModal] = React.useState(false);
  const [pairingCodeInput, setPairingCodeInput] = React.useState('');
  const [pairingError, setPairingError] = React.useState('');
  const {
    device,
    sendingCmd,
    cmdFeedback,
    approving,
    handleSendCommand,
    handleApprovePairing,
  } = useDisplayDetail();

  if (!device) return null;

  const handleUnbind = async () => {
    if (!device) return;
    if (!confirm(`Putus hubungan dan unbind player "${device.name}"?\n\nPerangkat akan dihapus dari sistem CMS dan kembali ke mode pairing awal.`)) {
      return;
    }
    try {
      setUnbinding(true);
      await api.deleteDevice(device.id);
      router.push('/hardware/displays/player');
    } catch (err: any) {
      alert(err.message || 'Gagal memutuskan hubungan perangkat');
      setUnbinding(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Link href={`/player/${device.id}`} target="_blank" className="btn btn-outline" title="Buka Kiosk Player Simulator di Browser">
            <Play size={14} />
            <span>Web Player</span>
          </Link>

          <button
            type="button"
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_RELOAD_MANIFEST, 'Sync Konten')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Kirim sinyal sinkronisasi manifest konten instan ke player"
          >
            <RefreshCw size={14} className={sendingCmd === 'Sync Konten' ? 'animate-spin' : ''} />
            <span>Sync Now</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Minta player mengambil tangkapan layar tampilan live"
          >
            <Camera size={14} />
            <span>Screenshot</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_REBOOT_PLAYER, 'Reboot Player')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Minta aplikasi display player restart"
          >
            <RotateCcw size={14} />
            <span>Reboot</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleSendCommand(
                ServerCommandType.COMMAND_EMERGENCY_BROADCAST,
                'Mode Tidur (Matikan Layar)',
                JSON.stringify({ type: 'SCREEN_SLEEP' })
              )
            }
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Matikan panel/backlight layar (HDMI-CEC Standby / Blackout) saat toko tutup namun player tetap aktif"
          >
            <Moon size={14} />
            <span>Matikan Layar</span>
          </button>

          <button
            type="button"
            onClick={() =>
              handleSendCommand(
                ServerCommandType.COMMAND_EMERGENCY_BROADCAST,
                'Bangunkan Layar',
                JSON.stringify({ type: 'SCREEN_WAKE' })
              )
            }
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Nyalakan kembali tampilan layar & audio dari mode tidur (HDMI-CEC Wake)"
          >
            <Sun size={14} />
            <span>Nyalakan Layar</span>
          </button>

          <button
            type="button"
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_CLEAR_CACHE, 'Bersihkan Cache')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Hapus cache media lokal player dan unduh ulang"
          >
            <Trash2 size={14} />
            <span>Clear Cache</span>
          </button>

          <Link href={`/hardware/displays/${device.id}/edit`} className="btn btn-primary">
            <Edit size={14} />
            <span>Edit</span>
          </Link>

          <button
            type="button"
            onClick={handleUnbind}
            disabled={unbinding}
            className="btn btn-danger"
            style={{ padding: '6px 12px', fontSize: '0.8125rem', gap: '6px' }}
            title="Putus hubungan dan hapus pairing layar ini"
          >
            <Unlink2 size={14} />
            <span>{unbinding ? 'Memutuskan...' : 'Unbind Layar'}</span>
          </button>
      </div>

      {cmdFeedback && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(16, 185, 129, 0.12)',
            color: 'var(--accent-emerald)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.875rem',
            fontWeight: 600,
          }}
        >
          <CheckCircle2 size={16} />
          <span>{cmdFeedback}</span>
        </div>
      )}

      {!device.isPaired && (
        <div
          className="card-elevated"
          style={{
            padding: '20px 24px',
            backgroundColor: 'rgba(234, 179, 8, 0.08)',
            border: '1px solid rgba(234, 179, 8, 0.28)',
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(234, 179, 8, 0.16)' }}>
              <Zap size={22} color="var(--accent-amber)" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Perangkat Menunggu Persetujuan Pairing
              </div>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Layar Android telah terdaftar. Setujui pairing untuk mulai menyiarkan konten signage.
              </p>
              <div style={{ marginTop: '6px', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                Status:{' '}
                <span
                  style={{
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    color: 'var(--accent-amber)',
                  }}
                >
                  Menunggu Verifikasi Kode Fisik TV
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                setShowPairModal(true);
                setPairingCodeInput('');
                setPairingError('');
              }}
              disabled={approving}
              className="btn btn-primary"
              style={{
                backgroundColor: 'var(--accent-emerald)',
                borderColor: 'var(--accent-emerald)',
                padding: '10px 20px',
                fontSize: '0.875rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle2 size={16} />
              <span>{approving ? 'Menyetujui...' : 'Setujui & Hubungkan Layar'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Physical Pairing Verification Modal */}
      {showPairModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '440px',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                  Verifikasi Kepemilikan Layar
                </h3>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                  Layar: <b>{device.name}</b>
                </p>
              </div>

              <button
                type="button"
                onClick={() => !approving && setShowPairModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                }}
                aria-label="Tutup"
              >
                <CircleX size={18} />
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const code = pairingCodeInput.trim().toUpperCase();
                if (!code) return;
                try {
                  setPairingError('');
                  await handleApprovePairing(code);
                  setShowPairModal(false);
                } catch (err: any) {
                  setPairingError(err.message || 'Kode pairing fisik salah atau telah kedaluwarsa');
                }
              }}
              style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}
            >
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
                Masukkan <b>6-digit Kode Pairing</b> yang sedang tampil di layar TV fisik untuk mengikat layar ini ke korporasi Anda:
              </p>

              <div>
                <input
                  type="text"
                  autoFocus
                  required
                  value={pairingCodeInput}
                  onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())}
                  placeholder="CONTOH: K8F2N9"
                  maxLength={10}
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

              {pairingError && (
                <div style={{ color: 'var(--accent-rose)', fontSize: '0.8125rem', fontWeight: 600 }}>
                  {pairingError}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', paddingTop: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowPairModal(false)}
                  className="btn btn-secondary"
                  disabled={approving}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={approving || !pairingCodeInput.trim()}
                >
                  {approving ? 'Memverifikasi...' : 'Verifikasi & Aktifkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
