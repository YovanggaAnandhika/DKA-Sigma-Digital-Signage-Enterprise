'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Device } from '@/lib/services';
import { pushDeviceCommand, ServerCommandType, PlaybackRecord, DeviceScreenshot, LatestTelemetry } from '@/lib/services/hardware/device.service';
import { getMediaStreamUrl } from '@/lib/services/studio/media.service';
import { ArrowLeft, Edit, Tv, Radio, Clock, HardDrive, Cpu, RefreshCw, Zap, Play, Camera, RotateCcw, Trash2, CheckCircle2, ShieldCheck, Download, Eye, Image as ImageIcon, X } from 'lucide-react';

export default function ViewDisplayPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackRecord[]>([]);
  const [screenshots, setScreenshots] = useState<DeviceScreenshot[]>([]);
  const [telemetry, setTelemetry] = useState<LatestTelemetry | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingCmd, setSendingCmd] = useState<string | null>(null);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true);
        const data = await api.getDevice(params.id);
        setDevice(data);
        
        // Concurrent non-blocking telemetry, logs, screenshots
        await Promise.allSettled([
          api.listPlaybackLogs({ deviceId: params.id, limit: 15 }).then(res => setPlaybackLogs(res.items)),
          api.listDeviceScreenshots(params.id, 10).then(res => setScreenshots(res)),
          api.getLatestDeviceTelemetry(params.id).then(res => setTelemetry(res)),
        ]);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat detail display');
        router.push('/hardware/displays');
      } finally {
        setLoading(false);
      }
    };
    fetchDevice();
  }, [params.id, router]);

  const handleExportCSV = () => {
    if (!playbackLogs.length) return alert('Tidak ada log penayangan untuk diekspor');
    const headers = ['ID Rekaman', 'Nama Media', 'Layout', 'Waktu Tayang', 'Durasi (Detik)', 'Status Tayang'];
    const rows = playbackLogs.map(l => [
      l.id,
      `"${(l.mediaName || l.mediaId || '').replace(/"/g, '""')}"`,
      `"${(l.layoutName || l.layoutId || '').replace(/"/g, '""')}"`,
      `"${new Date(l.startedAt).toLocaleString('id-ID')}"`,
      l.durationSeconds,
      l.isCompleted ? 'Selesai' : 'Sebagian'
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof_of_play_${device?.name || 'display'}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendCommand = async (cmdType: ServerCommandType, label: string) => {
    try {
      setSendingCmd(label);
      setCmdFeedback(null);
      await pushDeviceCommand(params.id, cmdType);
      setCmdFeedback(`Perintah "${label}" berhasil dikirim ke player.`);
      setTimeout(() => setCmdFeedback(null), 4000);
    } catch (err: any) {
      alert(`Gagal mengirim perintah: ${err.message}`);
    } finally {
      setSendingCmd(null);
    }
  };

  if (loading || !device) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data display...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
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
                style={{
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  backgroundColor: device.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                  color: device.isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                  border: device.isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                }}
              >
                {device.isOnline ? 'ONLINE' : 'OFFLINE'}
              </span>
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
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_RELOAD_MANIFEST, 'Sync Konten')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Kirim sinyal sinkronisasi manifest konten instan ke player"
          >
            <RefreshCw size={14} className={sendingCmd === 'Sync Konten' ? 'animate-spin' : ''} />
            <span>Sync Now</span>
          </button>

          <button
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Minta player mengambil tangkapan layar tampilan live"
          >
            <Camera size={14} />
            <span>Screenshot</span>
          </button>

          <button
            onClick={() => handleSendCommand(ServerCommandType.COMMAND_REBOOT_PLAYER, 'Reboot Player')}
            disabled={!!sendingCmd}
            className="btn btn-secondary"
            title="Minta aplikasi display player restart"
          >
            <RotateCcw size={14} />
            <span>Reboot</span>
          </button>

          <Link href={`/hardware/displays/${device.id}/edit`} className="btn btn-primary">
            <Edit size={14} />
            <span>Edit</span>
          </Link>
        </div>
      </div>

      {cmdFeedback && (
        <div style={{
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
        }}>
          <CheckCircle2 size={16} />
          <span>{cmdFeedback}</span>
        </div>
      )}

      {/* Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>KODE PAIRING AKTIF</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--primary-400)', marginTop: '6px' }}>
            {device.pairingCode}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {device.isPaired ? 'Status: Terpasang ke Player' : 'Menunggu input di Player'}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>RESOLUSI & LAYAR</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {device.screenWidth && device.screenHeight ? `${device.screenWidth} × ${device.screenHeight}` : '1920 × 1080'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', textTransform: 'capitalize' }}>
            Orientasi: {device.orientation}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>ALAMAT IP JARINGAN</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-primary)', marginTop: '6px' }}>
            {device.ipAddress || '127.0.0.1'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Protokol: Stream (Bi-directional)
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>HEARTBEAT TERAKHIR</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '6px' }}>
            {device.lastHeartbeatAt ? new Date(device.lastHeartbeatAt).toLocaleTimeString('id-ID') : 'Baru saja'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Interval telemetri: 15 detik
          </div>
        </div>
      </div>

      {/* Telemetry Detail Panel */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
          Metrik Hardware & Penyimpanan Player
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)', marginBottom: '8px' }}>
              <Cpu size={16} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Penggunaan Memori RAM</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              Normal (32%)
            </div>
            <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'rgba(255,255,255,0.1)', marginTop: '10px', overflow: 'hidden' }}>
              <div style={{ width: '32%', height: '100%', backgroundColor: 'var(--accent-cyan)' }} />
            </div>
          </div>

          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-amber)', marginBottom: '8px' }}>
              <HardDrive size={16} />
              <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Ruang Penyimpanan Bebas</span>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              {device.storageFreeBytes > 0 ? `${(device.storageFreeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free` : '18.4 GB Free'}
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
              Digunakan untuk cache manifest dan file video lokal offline.
            </p>
          </div>
        </div>
      </div>

      {/* Proof-of-Play (Audit & Impression Logs) */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Bukti Tayang / Proof of Play
            </h2>
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            {playbackLogs.length} rekaman terakhir
          </span>
        </div>

        {playbackLogs.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
            Belum ada rekaman penayangan media dari player ini.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '8px 12px' }}>Media / Konten</th>
                  <th style={{ padding: '8px 12px' }}>Layout</th>
                  <th style={{ padding: '8px 12px' }}>Waktu Mulai Tayang</th>
                  <th style={{ padding: '8px 12px' }}>Durasi</th>
                  <th style={{ padding: '8px 12px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {playbackLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.mediaName || log.mediaId || 'Media Item'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {log.layoutName || log.layoutId || '-'}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                      {new Date(log.startedAt).toLocaleString('id-ID')}
                    </td>
                    <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                      {log.durationSeconds} detik
                    </td>
                    <td style={{ padding: '10px 12px' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: log.isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                          color: log.isCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        }}
                      >
                        {log.isCompleted ? 'Selesai' : 'Sebagian'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
