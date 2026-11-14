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
  CheckCircle2,
  Zap,
  Unlink2,
  Moon,
  Sun,
  CircleX,
  SlidersHorizontal,
  ArrowUpRight,
} from 'lucide-react';
import { ServerCommandType, pushDeviceCommand } from '@/lib/services/hardware/device.service';
import { api } from '@/lib/services';
import { useDisplayDetail } from '../context/DisplayDetailContext';

export default function DisplayCommandToolbar() {
  const router = useRouter();
  const [unbinding, setUnbinding] = React.useState(false);
  const [showPairModal, setShowPairModal] = React.useState(false);
  const [pairingCodeInput, setPairingCodeInput] = React.useState('');
  const [pairingError, setPairingError] = React.useState('');
  const [pendingScreenTarget, setPendingScreenTarget] = React.useState<boolean | null>(null);
  const [screenCommandPending, setScreenCommandPending] = React.useState(false);
  const pendingScreenTargetRef = React.useRef<boolean | null>(null);
  const pendingScreenTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const {
    device,
    liveDiagnostics,
    diagnosticsFresh,
    sendingCmd,
    cmdFeedback,
    approving,
    handleSendCommand,
    handleApprovePairing,
  } = useDisplayDetail();
  const screenSleeping = diagnosticsFresh && typeof liveDiagnostics?.screenSleeping === 'boolean'
    ? liveDiagnostics.screenSleeping
    : null;
  const screenStatusUnavailable = !diagnosticsFresh || screenSleeping === null;
  const screenStateRef = React.useRef<boolean | null>(screenSleeping);

  const clearPendingScreenTarget = React.useCallback(() => {
    if (pendingScreenTimerRef.current) clearTimeout(pendingScreenTimerRef.current);
    pendingScreenTimerRef.current = null;
    pendingScreenTargetRef.current = null;
    setPendingScreenTarget(null);
    setScreenCommandPending(false);
  }, []);

  React.useEffect(() => {
    screenStateRef.current = screenSleeping;
    if (pendingScreenTargetRef.current === screenSleeping) clearPendingScreenTarget();
  }, [clearPendingScreenTarget, screenSleeping]);

  React.useEffect(() => () => {
    if (pendingScreenTimerRef.current) clearTimeout(pendingScreenTimerRef.current);
  }, []);

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
      label: 'Simulator Player',
      subtitle: 'Buka pratinjau siaran',
      badge: 'Web',
      accent: 'var(--primary-500)',
      icon: <Play size={18} />,
      href: `/player/${device.id}`,
      target: '_blank',
    },
    {
      label: 'Sinkron Konten',
      subtitle: sendingCmd === 'Sinkronkan Konten' ? 'Menyinkronkan...' : 'Tarik manifest terbaru',
      badge: 'Jadwal',
      accent: 'var(--accent-cyan)',
      icon: <RefreshCw size={18} className={sendingCmd === 'Sinkronkan Konten' ? 'animate-spin' : ''} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_RELOAD_MANIFEST, 'Sinkronkan Konten'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Tangkap Layar',
      subtitle: sendingCmd === 'Ambil Screenshot' ? 'Memotret...' : 'Ambil visual saat ini',
      badge: 'Visual',
      accent: 'var(--accent-emerald)',
      icon: <Camera size={18} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Muat Ulang',
      subtitle: sendingCmd === 'Mulai Ulang Player' ? 'Memulai ulang...' : 'Restart mesin player',
      badge: 'Sistem',
      accent: 'var(--accent-amber)',
      icon: <RotateCcw size={18} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_REBOOT_PLAYER, 'Mulai Ulang Player'); },
      disabled: !!sendingCmd,
    },
    {
      label: 'Bersihkan Cache',
      subtitle: sendingCmd === 'Bersihkan Cache' ? 'Membersihkan...' : 'Kosongkan penyimpanan',
      badge: 'Memori',
      accent: 'var(--primary-400)',
      icon: <Trash2 size={18} />,
      onClick: () => { void handleSendCommand(ServerCommandType.COMMAND_CLEAR_CACHE, 'Bersihkan Cache'); },
      disabled: !!sendingCmd,
    },
    {
      label: unbinding ? 'Memutus...' : 'Putus Perangkat',
      subtitle: 'Unbind & reset pairing',
      badge: 'Bahaya',
      accent: 'var(--accent-rose)',
      icon: <Unlink2 size={18} />,
      onClick: handleUnbind,
      disabled: unbinding,
      danger: true,
    },
  ];

  const isDisplayAwake = currentScreenState === false;
  const isDisplaySleeping = currentScreenState === true;

  return (
    <>
      <div className="card-elevated" style={{ padding: '20px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '11px',
                display: 'grid',
                placeItems: 'center',
                background: 'color-mix(in srgb, var(--primary-500) 14%, transparent)',
                color: 'var(--primary-500)',
                border: '1px solid color-mix(in srgb, var(--primary-500) 24%, transparent)',
              }}
            >
              <SlidersHorizontal size={16} />
            </span>
            <div>
              <h2 style={{ margin: 0, color: 'var(--text-primary)', fontSize: '0.95rem', fontWeight: 750, letterSpacing: '-0.01em' }}>
                Smart Control Hub
              </h2>
              <p style={{ margin: '1px 0 0', color: 'var(--text-muted)', fontSize: '0.73rem' }}>
                Panel kendali jarak jauh real-time & manajemen perangkat keras
              </p>
            </div>
          </div>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              padding: '5px 12px',
              borderRadius: 999,
              background: `color-mix(in srgb, ${screenTone} 12%, var(--bg-surface-elevated))`,
              border: `1px solid color-mix(in srgb, ${screenTone} 28%, var(--border-subtle))`,
              color: screenTone,
              fontSize: '0.72rem',
              fontWeight: 700,
            }}
          >
            <span
              aria-hidden="true"
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: screenTone,
                boxShadow: isDisplayAwake ? `0 0 8px ${screenTone}` : 'none',
              }}
            />
            {screenStatusLabel}
          </span>
        </div>

        {/* Smart Home Bento Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '12px',
          }}
        >
          {/* Master Display Power Scene Tile */}
          <button
            type="button"
            role="switch"
            aria-checked={isDisplayAwake}
            onClick={toggleScreenPower}
            disabled={currentScreenState === null || screenCommandPending || !!sendingCmd}
            style={{
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              minHeight: '116px',
              padding: '16px',
              borderRadius: '18px',
              border: isDisplayAwake
                ? '1px solid color-mix(in srgb, var(--accent-emerald) 45%, var(--border-subtle))'
                : isDisplaySleeping
                  ? '1px solid color-mix(in srgb, var(--accent-amber) 45%, var(--border-subtle))'
                  : '1px solid var(--border-subtle)',
              background: isDisplayAwake
                ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent-emerald) 18%, var(--bg-surface)) 0%, var(--bg-surface-elevated) 100%)'
                : isDisplaySleeping
                  ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent-amber) 16%, var(--bg-surface)) 0%, var(--bg-surface-elevated) 100%)'
                  : 'var(--bg-surface-elevated)',
              boxShadow: isDisplayAwake
                ? '0 10px 26px -10px color-mix(in srgb, var(--accent-emerald) 35%, transparent)'
                : '0 2px 10px rgba(0, 0, 0, 0.04)',
              color: 'var(--text-primary)',
              textAlign: 'left',
              cursor: currentScreenState === null ? 'not-allowed' : 'pointer',
              opacity: currentScreenState === null ? 0.65 : 1,
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <span
                style={{
                  display: 'grid',
                  placeItems: 'center',
                  width: 40,
                  height: 40,
                  borderRadius: 13,
                  background: isDisplayAwake
                    ? 'var(--accent-emerald)'
                    : isDisplaySleeping
                      ? 'var(--accent-amber)'
                      : 'var(--bg-surface)',
                  color: currentScreenState === null ? 'var(--text-muted)' : '#fff',
                  boxShadow: isDisplayAwake
                    ? '0 4px 14px color-mix(in srgb, var(--accent-emerald) 45%, transparent)'
                    : isDisplaySleeping
                      ? '0 4px 14px color-mix(in srgb, var(--accent-amber) 40%, transparent)'
                      : 'none',
                  border: currentScreenState === null ? '1px solid var(--border-subtle)' : 'none',
                }}
              >
                {isDisplaySleeping ? <Moon size={19} /> : <Sun size={19} />}
              </span>

              {/* Tactile Smart Home Pill Switch */}
              <span
                aria-hidden="true"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: 44,
                  height: 24,
                  padding: 3,
                  borderRadius: 999,
                  background: isDisplayAwake
                    ? 'var(--accent-emerald)'
                    : isDisplaySleeping
                      ? 'color-mix(in srgb, var(--accent-amber) 35%, var(--bg-surface))'
                      : 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: '#fff',
                    boxShadow: '0 1px 4px rgba(0, 0, 0, 0.25)',
                    transform: isDisplayAwake ? 'translateX(20px)' : 'translateX(0)',
                    transition: 'transform 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </span>
            </div>

            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 750, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                Daya Panel Layar
              </div>
              <div style={{ fontSize: '0.73rem', fontWeight: 600, color: screenTone, marginTop: 2 }}>
                {screenCommandPending
                  ? 'Mengirim sinyal daya...'
                  : currentScreenState === null
                    ? 'Menunggu telemetri perangkat'
                    : isDisplaySleeping
                      ? 'Mode Standby (Hemat Daya)'
                      : 'Menyala · Siaran Aktif'}
              </div>
            </div>
          </button>

          {/* Smart Home Action Tiles */}
          {commandActions.map((action) => {
            const tileStyle: React.CSSProperties = {
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '16px',
              minHeight: '116px',
              padding: '16px',
              border: action.danger
                ? '1px solid color-mix(in srgb, var(--accent-rose) 28%, var(--border-subtle))'
                : '1px solid var(--border-subtle)',
              borderRadius: '18px',
              background: action.danger
                ? 'linear-gradient(135deg, color-mix(in srgb, var(--accent-rose) 8%, var(--bg-surface-elevated)) 0%, var(--bg-surface-elevated) 100%)'
                : 'var(--bg-surface-elevated)',
              color: action.danger ? 'var(--accent-rose)' : 'var(--text-primary)',
              textDecoration: 'none',
              textAlign: 'left',
              cursor: action.disabled ? 'not-allowed' : 'pointer',
              opacity: action.disabled ? 0.55 : 1,
              boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            };

            const contents = (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                  <span
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 13,
                      background: `color-mix(in srgb, ${action.accent} 14%, var(--bg-surface))`,
                      border: `1px solid color-mix(in srgb, ${action.accent} 26%, transparent)`,
                      color: action.accent,
                    }}
                  >
                    {action.icon}
                  </span>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4,
                      padding: '3px 9px',
                      borderRadius: 999,
                      fontSize: '0.66rem',
                      fontWeight: 700,
                      letterSpacing: '0.02em',
                      background: `color-mix(in srgb, ${action.accent} 10%, var(--bg-surface))`,
                      color: action.accent,
                    }}
                  >
                    {action.badge}
                    {action.href && <ArrowUpRight size={11} />}
                  </span>
                </div>

                <div>
                  <div
                    style={{
                      fontSize: '0.86rem',
                      fontWeight: 750,
                      color: action.danger ? 'var(--accent-rose)' : 'var(--text-primary)',
                      letterSpacing: '-0.01em',
                    }}
                  >
                    {action.label}
                  </div>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 500,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {action.subtitle}
                  </div>
                </div>
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