'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Play,
  RefreshCw,
  Camera,
  RotateCcw,
  Trash2,
  Edit,
  CheckCircle2,
  Zap,
} from 'lucide-react';
import { ServerCommandType } from '@/lib/services/hardware/device.service';
import { useDisplayDetail } from '../context/DisplayDetailContext';

export default function DisplayCommandToolbar() {
  const {
    device,
    sendingCmd,
    cmdFeedback,
    approving,
    handleSendCommand,
    handleApprovePairing,
  } = useDisplayDetail();

  if (!device) return null;

  return (
    <>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/hardware/displays" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                {device.name}
              </h1>
              <span
                title={device.isOnline ? 'Online' : 'Offline'}
                aria-label={device.isOnline ? 'Online' : 'Offline'}
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: device.isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  boxShadow: device.isOnline ? '0 0 6px rgba(16, 185, 129, 0.5)' : 'none',
                  display: 'inline-block',
                }}
              />
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
              ID: {device.id}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                Kode Pairing:{' '}
                <span
                  style={{
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    fontSize: '1.1rem',
                    color: 'var(--accent-amber)',
                    letterSpacing: '0.05em',
                  }}
                >
                  {device.pairingCode || 'AU2-PZD'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => handleApprovePairing()}
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

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
        <div className="card-elevated" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kode Pairing</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '4px' }}>
            {device.pairingCode}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            {device.isPaired ? 'Terhubung' : 'Menunggu input'}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Resolusi</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {device.screenWidth && device.screenHeight ? `${device.screenWidth} × ${device.screenHeight}` : '1920 × 1080'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px', textTransform: 'capitalize' }}>
            {device.orientation}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Alamat IP</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '4px' }}>
            {device.ipAddress || '127.0.0.1'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Stream Aktif
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontWeight: 600 }}>Heartbeat</div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '4px' }}>
            {device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt).toLocaleTimeString('id-ID') : 'Baru saja'}
          </div>
          <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Sinkron
          </div>
        </div>
      </div>
    </>
  );
}
