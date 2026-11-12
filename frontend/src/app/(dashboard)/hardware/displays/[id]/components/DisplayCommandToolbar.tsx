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
  const screenStateTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
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

    const markStatusUnavailable = () => {
      screenStateRef.current = null;
      setScreenSleeping(null);
      setScreenStatusUnavailable(true);
    };
    const resetScreenStateTimer = () => {
      if (screenStateTimerRef.current) clearTimeout(screenStateTimerRef.current);
      screenStateTimerRef.current = setTimeout(markStatusUnavailable, 10_000);
    };
    resetScreenStateTimer();

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
                  resetScreenStateTimer();
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
          if (screenStateTimerRef.current) clearTimeout(screenStateTimerRef.current);
          markStatusUnavailable();
          await new Promise((resolve) => setTimeout(resolve, 3000));
        }
      }
    };

    void readDiagnostics();
    return () => {
      active = false;
      controller.abort();
      if (pendingScreenTimerRef.current) clearTimeout(pendingScreenTimerRef.current);
      if (screenStateTimerRef.current) clearTimeout(screenStateTimerRef.current);
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
    ? 'Mengirim...'
    : currentScreenState === null
      ? screenStatusUnavailable ? 'Offline' : 'Memeriksa...'
      : currentScreenState ? 'Sleep' : 'Aktif';
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
      label: 'Player',
      icon: <Play size={18} />,
      href: `/player/${device.id}`,
      target: '_blank',
    },
    {
      label: 'Sinkron',
      icon: <RefreshCw size={18} className={sendingCmd === 'Sinkronkan Konten' ? 'animate-spin' : ''} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_RELOAD_MANIFEST, 'Sinkronkan Konten'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Capture',
      icon: <Camera size={18} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Restart',
      icon: <RotateCcw size={18} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_REBOOT_PLAYER, 'Mulai Ulang Player'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Cache',
      icon: <Trash2 size={18} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_CLEAR_CACHE, 'Bersihkan Cache'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Atur',
      icon: <Edit size={18} />,
      href: `/hardware/displays/${device.id}/edit`,
    },
    {
      label: unbinding ? 'Putus...' : 'Unbind',
      icon: <Unlink2 size={18} />,
      onClick: handleUnbind,
      disabled: unbinding,
      danger: true,
    },
  ];

  return (
    <>
      <div className="card-elevated" style={{ padding: 16, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.9rem', fontWeight: 700 }}>Kontrol Perangkat</h2>
          </div>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-surface-elevated)', color: screenTone, fontSize: '0.7rem', fontWeight: 700 }}>
            <span aria-hidden="true" style={{ width: 6, height: 6, borderRadius: '50%', background: screenTone }} />
            {screenStatusLabel}
          </span>
        </div>

        {/* Smart Home Style Control Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(76px, 1fr))', gap: 8 }}>
          {/* Power Toggle Button */}
          <button
            type="button"
            role="switch"
            aria-checked={currentScreenState === false}
            onClick={toggleScreenPower}
            disabled={currentScreenState === null || screenCommandPending || !!sendingCmd}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              height: 72,
              padding: 6,
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              backgroundColor: currentScreenState === false ? 'var(--bg-surface-elevated)' : 'rgba(255, 255, 255, 0.02)',
              color: screenTone,
              cursor: currentScreenState === null ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
            }}
          >
            <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 10, background: screenTone, color: '#fff' }}>
              {currentScreenState ? <Moon size={16} /> : <Sun size={16} />}
            </span>
            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {currentScreenState ? 'Sleep' : 'Display'}
            </span>
          </button>

          {/* Action Buttons */}
          {commandActions.map((action) => {
            const tileStyle: React.CSSProperties = {
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              height: 72,
              padding: 6,
              border: '1px solid var(--border-subtle)',
              borderRadius: 14,
              backgroundColor: 'var(--bg-surface-elevated)',
              color: action.danger ? 'var(--accent-rose)' : 'var(--text-primary)',
              textDecoration: 'none',
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              opacity: action.disabled ? 0.5 : 1,
              transition: 'all 0.2s ease',
            };

            const contents = (
              <>
                <span style={{ display: 'grid', placeItems: 'center', width: 32, height: 32, borderRadius: 10, background: 'var(--bg-primary)', color: action.danger ? 'var(--accent-rose)' : 'var(--primary-500)' }}>
                  {action.icon}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>
                  {action.label}
                </span>
              </>
            );

            return action.href ? (
              <Link key={action.label} href={action.href} target={action.target} style={tileStyle}>
                {contents}
              </Link>
            ) : (
              <button key={action.label} type="button" onClick={action.onClick} disabled={action.disabled} style={tileStyle}>
                {contents}
              </button>
            );
          })}
        </div>
      </div>

      {cmdFeedback && (
        <div style={{ padding: '10px 14px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', fontWeight: 600 }}>
          <CheckCircle2 size={16} />
          <span>{cmdFeedback}</span>
        </div>
      )}

      {!device.isPaired && (
        <div className="card-elevated" style={{ padding: '16px 20px', backgroundColor: 'rgba(234, 179, 8, 0.08)', border: '1px solid rgba(234, 179, 8, 0.28)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', borderRadius: '8px', backgroundColor: 'rgba(234, 179, 8, 0.16)' }}>
              <Zap size={20} color="var(--accent-amber)" />
            </div>
            <div>
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>Menunggu Persetujuan Pairing</div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: '2px 0 0' }}>Setujui pairing untuk mulai menyiarkan konten.</p>
            </div>
          </div>
          <button type="button" onClick={() => { setShowPairModal(true); setPairingCodeInput(''); setPairingError(''); }} disabled={approving} className="btn btn-primary" style={{ backgroundColor: 'var(--accent-emerald)', borderColor: 'var(--accent-emerald)', padding: '8px 16px', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <CheckCircle2 size={14} />
            <span>{approving ? 'Memproses...' : 'Setujui Layar'}</span>
          </button>
        </div>
      )}

      {/* Modal Pairing */}
      {showPairModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0, 0, 0, 0.65)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: '16px' }}>
          <div className="card-elevated" style={{ width: '100%', maxWidth: '400px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 20px 40px rgba(0,0,0,0.4)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Verifikasi Kode Layar</h3>
              <button type="button" onClick={() => !approving && setShowPairModal(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px' }}>
                <CircleX size={18} />
              </button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const code = pairingCodeInput.trim().toUpperCase();
              if (!code) return;
              try {
                setPairingError('');
                await handleApprovePairing(code);
                setShowPairModal(false);
              } catch (err: any) {
                setPairingError(err.message || 'Kode pairing salah');
              }
            }} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: 0 }}>Masukkan 6-digit kode yang tampil di layar TV fisik:</p>
              <input type="text" autoFocus required value={pairingCodeInput} onChange={(e) => setPairingCodeInput(e.target.value.toUpperCase())} placeholder="K8F2N9" maxLength={10} className="form-input" style={{ fontSize: '1.1rem', fontWeight: 800, fontFamily: 'monospace', letterSpacing: '0.2em', textAlign: 'center', textTransform: 'uppercase', padding: '10px' }} disabled={approving} />
              {pairingError && <div style={{ color: 'var(--accent-rose)', fontSize: '0.75rem', fontWeight: 600 }}>{pairingError}</div>}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                <button type="button" onClick={() => setShowPairModal(false)} className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} disabled={approving}>Batal</button>
                <button type="submit" className="btn btn-primary" style={{ fontSize: '0.8rem', padding: '6px 12px' }} disabled={approving || !pairingCodeInput.trim()}>{approving ? 'Memverifikasi...' : 'Verifikasi'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}