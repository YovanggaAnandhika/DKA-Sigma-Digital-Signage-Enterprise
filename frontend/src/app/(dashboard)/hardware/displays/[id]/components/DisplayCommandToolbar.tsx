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
import { ServerCommandType, pushDeviceCommand } from '@/lib/services/hardware/device.service';
import { api } from '@/lib/services';
import { useDisplayDetail } from '../context/DisplayDetailContext';

type DeviceDiagnosticsEvent = {
  diagnostics?: {
    screenSleeping?: boolean;
  };
};

const commandTileStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  minHeight: 52,
  padding: '10px 12px',
  border: '1px solid var(--border-subtle)',
  borderRadius: 12,
  backgroundColor: 'var(--bg-surface-elevated)',
  color: 'var(--text-primary)',
  fontFamily: 'inherit',
  fontSize: '0.8rem',
  fontWeight: 600,
  textAlign: 'left',
  textDecoration: 'none',
  cursor: 'pointer',
};

export default function DisplayCommandToolbar() {
  const router = useRouter();
  const [unbinding, setUnbinding] = React.useState(false);
  const [showPairModal, setShowPairModal] = React.useState(false);
  const [pairingCodeInput, setPairingCodeInput] = React.useState('');
  const [pairingError, setPairingError] = React.useState('');
  const [screenSleeping, setScreenSleeping] = React.useState<boolean | null>(null);
  const [pendingScreenTarget, setPendingScreenTarget] = React.useState<boolean | null>(null);
  const [screenCommandPending, setScreenCommandPending] = React.useState(false);
  const [screenStatusUnavailable, setScreenStatusUnavailable] = React.useState(false);
  const screenStateRef = React.useRef<boolean | null>(null);
  const pendingScreenTargetRef = React.useRef<boolean | null>(null);
  const pendingScreenTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    deviceId,
    device,
    sendingCmd,
    cmdFeedback,
    approving,
    handleSendCommand,
    handleApprovePairing,
  } = useDisplayDetail();

  const clearPendingScreenTarget = React.useCallback(() => {
    if (pendingScreenTimerRef.current) clearTimeout(pendingScreenTimerRef.current);
    pendingScreenTimerRef.current = null;
    pendingScreenTargetRef.current = null;
    setPendingScreenTarget(null);
    setScreenCommandPending(false);
  }, []);

  React.useEffect(() => {
    const controller = new AbortController();
    let active = true;
    screenStateRef.current = null;
    setScreenSleeping(null);
    setScreenStatusUnavailable(false);
    clearPendingScreenTarget();

    const readDiagnostics = async () => {
      while (active) {
        try {
          let token = '';
          try {
            token = JSON.parse(localStorage.getItem('dkasigma_session') || '{}').token || '';
          } catch {
            token = '';
          }
          const response = await fetch(
            `/api/grpc/distribution/stream/WatchDeviceDiagnostics?deviceId=${encodeURIComponent(deviceId)}`,
            {
              headers: token ? { authorization: `Bearer ${token}` } : {},
              signal: controller.signal,
            }
          );
          if (!response.ok || !response.body) throw new Error('Status player tidak tersedia');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          while (active) {
            const { done, value } = await reader.read();
            buffer += decoder.decode(value, { stream: !done });
            let boundary = buffer.indexOf('\n\n');
            while (boundary >= 0) {
              const record = buffer.slice(0, boundary);
              buffer = buffer.slice(boundary + 2);
              if (/^event:\s*error$/m.test(record)) throw new Error('Status player tidak tersedia');
              const data = record.split(/\r?\n/).find((line) => line.startsWith('data:'))?.slice(5).trim();
              if (data) {
                const event = JSON.parse(data) as DeviceDiagnosticsEvent;
                const reportedState = event.diagnostics?.screenSleeping;
                if (typeof reportedState === 'boolean') {
                  screenStateRef.current = reportedState;
                  setScreenSleeping(reportedState);
                  setScreenStatusUnavailable(false);
                  if (pendingScreenTargetRef.current === reportedState) clearPendingScreenTarget();
                }
              }
              boundary = buffer.indexOf('\n\n');
            }
            if (done) break;
          }
          if (active) throw new Error('Aliran status player terputus');
        } catch {
          if (!active) break;
          screenStateRef.current = null;
          setScreenSleeping(null);
          setScreenStatusUnavailable(true);
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    };

    void readDiagnostics();
    return () => {
      active = false;
      controller.abort();
      if (pendingScreenTimerRef.current) clearTimeout(pendingScreenTimerRef.current);
    };
  }, [clearPendingScreenTarget, deviceId]);

  if (!device) return null;

  const handleUnbind = async () => {
    if (!device) return;
    if (!confirm(`Putus hubungan dan unbind player "${device.name}"?\n\nPerangkat akan dihapus dari sistem CMS dan kembali ke mode pairing awal.`)) {
      return;
    }
    try {
      setUnbinding(true);
      // Kirim perintah real-time UNPAIR jika player sedang online agar langsung kembali ke pairing mode
      await pushDeviceCommand(device.id, ServerCommandType.COMMAND_EMERGENCY_BROADCAST, JSON.stringify({ type: 'UNPAIR' })).catch(() => {});
      await api.deleteDevice(device.id);
      router.push('/hardware/displays/player');
    } catch (err: any) {
      alert(err.message || 'Gagal memutuskan hubungan perangkat');
      setUnbinding(false);
    }
  };

  const currentScreenState = pendingScreenTarget ?? screenSleeping;
  const screenStatusLabel = screenCommandPending
    ? sendingCmd ? 'Mengirim perintah ke player' : 'Menunggu konfirmasi player'
    : currentScreenState === null
      ? screenStatusUnavailable ? 'Status player tidak tersedia' : 'Memeriksa status player'
      : currentScreenState ? 'Mode tidur aktif' : 'Layar menyala';
  const screenActionLabel = currentScreenState === null
    ? 'Memeriksa status layar...'
    : screenCommandPending
      ? currentScreenState ? 'Mematikan layar...' : 'Menyalakan layar...'
      : currentScreenState ? 'Menyalakan layar' : 'Matikan layar';
  const screenTone = currentScreenState === null
    ? 'var(--text-muted)'
    : currentScreenState ? 'var(--accent-amber)' : 'var(--accent-emerald)';
  const toggleScreenPower = async () => {
    if (currentScreenState === null || screenCommandPending || sendingCmd) return;
    const targetSleeping = !currentScreenState;
    pendingScreenTargetRef.current = targetSleeping;
    setPendingScreenTarget(targetSleeping);
    setScreenCommandPending(true);
    const sent = await handleSendCommand(
      ServerCommandType.COMMAND_EMERGENCY_BROADCAST,
      targetSleeping ? 'Matikan Layar' : 'Nyalakan Layar',
      JSON.stringify({ type: targetSleeping ? 'SCREEN_SLEEP' : 'SCREEN_WAKE' })
    );
    if (!sent) {
      clearPendingScreenTarget();
      return;
    }
    if (screenStateRef.current === targetSleeping) {
      clearPendingScreenTarget();
      return;
    }
    pendingScreenTimerRef.current = setTimeout(clearPendingScreenTarget, 10_000);
  };

  const commandActions = [
    {
      label: 'Web Player',
      title: 'Buka pratinjau player di tab baru',
      icon: <Play size={16} />,
      href: `/player/${device.id}`,
      target: '_blank',
    },
    {
      label: 'Sinkronkan konten',
      title: 'Kirim perintah sinkronisasi konten',
      icon: <RefreshCw size={16} className={sendingCmd === 'Sinkronkan Konten' ? 'animate-spin' : ''} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_RELOAD_MANIFEST, 'Sinkronkan Konten'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Ambil tangkapan layar',
      title: 'Minta player mengambil tangkapan layar',
      icon: <Camera size={16} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Mulai ulang player',
      title: 'Minta aplikasi player dimulai ulang',
      icon: <RotateCcw size={16} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_REBOOT_PLAYER, 'Mulai Ulang Player'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Bersihkan cache',
      title: 'Hapus cache media lokal dan unduh ulang',
      icon: <Trash2 size={16} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_CLEAR_CACHE, 'Bersihkan Cache'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Ubah pengaturan',
      title: 'Ubah pengaturan layar',
      icon: <Edit size={16} />,
      href: `/hardware/displays/${device.id}/edit`,
    },
    {
      label: unbinding ? 'Memutuskan perangkat...' : 'Putuskan perangkat',
      title: 'Putuskan hubungan dan hapus pairing layar ini',
      icon: <Unlink2 size={16} />,
      onClick: handleUnbind,
      disabled: unbinding,
      danger: true,
    },
  ];

  return (
    <>
      <div className="card-elevated" style={{ padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 700 }}>Kontrol Perangkat</h2>
            <p style={{ margin: '3px 0 0', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Perintah cepat untuk layar digital</p>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 10px', borderRadius: 999, background: 'var(--bg-surface-elevated)', color: screenTone, fontSize: '0.72rem', fontWeight: 700 }}>
            <span aria-hidden="true" style={{ width: 7, height: 7, borderRadius: '50%', background: screenTone }} />
            {screenStatusLabel}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
          <button
            type="button"
            role="switch"
            aria-checked={currentScreenState === false}
            aria-label={`${screenStatusLabel}. ${screenActionLabel}`}
            onClick={toggleScreenPower}
            disabled={currentScreenState === null || screenCommandPending || !!sendingCmd}
            title={screenStatusUnavailable ? 'Status tidur player belum dapat dibaca' : screenActionLabel}
            style={{
              ...commandTileStyle,
              gridColumn: '1 / -1',
              justifyContent: 'space-between',
              minHeight: 76,
              padding: '14px 16px',
              backgroundColor: 'var(--bg-surface)',
              borderColor: screenTone,
              opacity: currentScreenState === null || screenCommandPending || !!sendingCmd ? 0.65 : 1,
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ display: 'grid', placeItems: 'center', width: 42, height: 42, flexShrink: 0, borderRadius: 13, background: 'var(--bg-surface-elevated)', color: screenTone }}>
                {currentScreenState ? <Moon size={19} /> : <Sun size={19} />}
              </span>
              <span style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <strong style={{ color: 'var(--text-primary)', fontSize: '0.88rem' }}>{screenActionLabel}</strong>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.73rem', fontWeight: 400 }}>{screenStatusLabel}</span>
              </span>
            </span>
            <span aria-hidden="true" style={{ display: 'flex', alignItems: 'center', width: 46, height: 26, padding: 3, borderRadius: 999, background: currentScreenState === null ? 'var(--bg-surface-elevated)' : currentScreenState ? 'var(--accent-amber)' : 'var(--accent-emerald)', transition: 'background 0.2s ease' }}>
              <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'var(--bg-primary)', transform: currentScreenState === false ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s ease' }} />
            </span>
          </button>

          {commandActions.map((action) => {
            const tileStyle = {
              ...commandTileStyle,
              color: action.danger ? 'var(--accent-rose)' : commandTileStyle.color,
              opacity: action.disabled ? 0.6 : 1,
              cursor: action.disabled ? 'not-allowed' : 'pointer',
            };
            const contents = (
              <>
                <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, flexShrink: 0, borderRadius: 10, background: 'var(--bg-primary)', color: action.danger ? 'var(--accent-rose)' : 'var(--primary-500)' }}>
                  {action.icon}
                </span>
                <span>{action.label}</span>
              </>
            );
            return action.href ? (
              <Link key={action.label} href={action.href} target={action.target} title={action.title} style={tileStyle}>
                {contents}
              </Link>
            ) : (
              <button key={action.label} type="button" onClick={action.onClick} disabled={action.disabled} title={action.title} style={tileStyle}>
                {contents}
              </button>
            );
          })}
        </div>
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
