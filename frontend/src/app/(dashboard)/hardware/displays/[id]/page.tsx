'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Device } from '@/lib/services';
import {
  pushDeviceCommand, ServerCommandType, PlaybackRecord, DeviceScreenshot, LatestTelemetry,
  getDeviceAnalyticsHistory, DeviceAnalyticsRecord, HardwareInputOutput, AssetStats
} from '@/lib/services/hardware/device.service';
import { getMediaStreamUrl } from '@/lib/services/studio/media.service';
import {
  ArrowLeft, Edit, Tv, Radio, Clock, HardDrive, Cpu, RefreshCw, Zap, Play, Camera,
  RotateCcw, Trash2, CheckCircle2, ShieldCheck, Download, Eye, Image as ImageIcon, X,
  Activity, Thermometer, Wifi, Film, AlertTriangle, TrendingUp, BarChart2
} from 'lucide-react';

export default function ViewDisplayPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackRecord[]>([]);
  const [screenshots, setScreenshots] = useState<DeviceScreenshot[]>([]);
  const [telemetry, setTelemetry] = useState<LatestTelemetry | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<{
    io: HardwareInputOutput;
    assets: AssetStats;
  } | null>(null);
  const [analyticsHistory, setAnalyticsHistory] = useState<DeviceAnalyticsRecord[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [hoveredPoint, setHoveredPoint] = useState<DeviceAnalyticsRecord | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingCmd, setSendingCmd] = useState<string | null>(null);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchAnalytics = async (range: string) => {
    try {
      const records = await getDeviceAnalyticsHistory(params.id, range, 60);
      setAnalyticsHistory(records);
      if (records.length > 0 && !realtimeMetrics) {
        const last = records[records.length - 1];
        setRealtimeMetrics({
          io: last.inputOutput || {},
          assets: last.assetsStats || {},
        });
      }
    } catch (_) {}
  };

  const fetchDevice = async () => {
    try {
      setLoading(true);
      const data = await api.getDevice(params.id);
      setDevice(data);
      
      // Concurrent non-blocking telemetry, logs, screenshots, analytics
      await Promise.allSettled([
        api.listPlaybackLogs({ deviceId: params.id, limit: 15 }).then(res => setPlaybackLogs(res.items)),
        api.listDeviceScreenshots(params.id, 10).then(res => setScreenshots(res)),
        api.getLatestDeviceTelemetry(params.id).then(res => setTelemetry(res)),
        fetchAnalytics(timeRange),
      ]);
    } catch (err: any) {
      alert(err.message || 'Gagal memuat detail display');
      router.push('/hardware/displays');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
  }, [params.id, router]);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  // Realtime SSE Stream Listener
  useEffect(() => {
    if (!params.id) return;
    const sse = new EventSource(`/api/stream/device?deviceId=${params.id}`);

    sse.onopen = () => setIsLiveConnected(true);
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ANALYTICS_UPDATE' && data.snapshot) {
          setIsLiveConnected(true);
          let io: HardwareInputOutput = {};
          let assets: AssetStats = {};
          try {
            io = typeof data.snapshot.inputOutputJson === 'string'
              ? JSON.parse(data.snapshot.inputOutputJson)
              : (data.snapshot.inputOutputJson || {});
          } catch (_) {}
          try {
            assets = typeof data.snapshot.assetsStatsJson === 'string'
              ? JSON.parse(data.snapshot.assetsStatsJson)
              : (data.snapshot.assetsStatsJson || {});
          } catch (_) {}

          setRealtimeMetrics({ io, assets });

          const newRecord: DeviceAnalyticsRecord = {
            id: data.snapshot.id || String(Date.now()),
            deviceId: params.id,
            inputOutputJson: JSON.stringify(io),
            assetsStatsJson: JSON.stringify(assets),
            recordedAt: data.snapshot.recordedAt || new Date().toISOString(),
            inputOutput: io,
            assetsStats: assets,
          };

          setAnalyticsHistory(prev => {
            const next = [...prev, newRecord];
            return next.slice(-60);
          });
        }
      } catch (_) {}
    };

    sse.onerror = () => {
      setIsLiveConnected(false);
    };

    return () => {
      sse.close();
    };
  }, [params.id]);

  const handleApprovePairing = async (codeToPair?: string) => {
    const code = codeToPair || device?.pairingCode;
    if (!code) {
      const manualCode = prompt('Masukkan kode pairing dari layar Android (misal: AU2-PZD):');
      if (!manualCode) return;
      return executePairing(manualCode);
    }
    await executePairing(code);
  };

  const executePairing = async (code: string) => {
    try {
      setApproving(true);
      await api.pairDevice({
        pairingCode: code.toUpperCase(),
        deviceName: device?.name || 'Display Android',
      });
      setCmdFeedback('Layar berhasil dipairing dan disetujui! Membuka streaming player...');
      await fetchDevice();
    } catch (err: any) {
      alert(err.message || 'Gagal menyetujui pairing perangkat');
    } finally {
      setApproving(false);
    }
  };

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

      if (cmdType === ServerCommandType.COMMAND_CAPTURE_SCREENSHOT) {
        setTimeout(() => {
          api.listDeviceScreenshots(params.id, 10).then(res => {
            if (res && res.length > 0) setScreenshots(res);
          }).catch(() => {});
        }, 3500);
        setTimeout(() => {
          api.listDeviceScreenshots(params.id, 10).then(res => {
            if (res && res.length > 0) setScreenshots(res);
          }).catch(() => {});
        }, 6500);
      }
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

          <button
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
                Kode Pairing: <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: '1.1rem', color: 'var(--accent-amber)', letterSpacing: '0.05em' }}>{device.pairingCode || 'AU2-PZD'}</span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
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

      {/* Fleet Observability: Real-time Telemetry & Live Screenshot Preview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Hardware & Resource Gauge */}
        <div className="card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Cpu size={18} style={{ color: 'var(--accent-cyan)' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Metrik Hardware & Penyimpanan Player
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: isLiveConnected ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                  boxShadow: isLiveConnected ? '0 0 8px var(--accent-emerald)' : 'none',
                }}
              />
              <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: isLiveConnected ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                {isLiveConnected ? 'REALTIME ONLINE' : 'OFFLINE BUFFER'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* CPU Bar */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-cyan)' }}>
                  <Activity size={15} />
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Beban CPU Sistem</span>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5}%
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 500 }}>
                    ({realtimeMetrics?.io?.cpu_cores ?? realtimeMetrics?.io?.cpuCores ?? 8} Cores)
                  </span>
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(5, realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5))}%`,
                    height: '100%',
                    backgroundColor: (realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5) > 80
                      ? 'var(--accent-rose)'
                      : (realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 24.5) > 60
                      ? 'var(--accent-amber)'
                      : 'var(--accent-cyan)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* RAM Bar */}
            <div style={{ padding: '12px 14px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-emerald)' }}>
                  <Cpu size={15} />
                  <span style={{ fontWeight: 600, fontSize: '0.8125rem' }}>Penggunaan Memori RAM</span>
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent ?? 30}%
                  {realtimeMetrics?.io?.ram_used_bytes && realtimeMetrics?.io?.ram_total_bytes ? (
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '4px', fontWeight: 500 }}>
                      ({(realtimeMetrics.io.ram_used_bytes / (1024 * 1024 * 1024)).toFixed(1)} / {(realtimeMetrics.io.ram_total_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB)
                    </span>
                  ) : null}
                </span>
              </div>
              <div style={{ width: '100%', height: '8px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${Math.min(100, Math.max(5, realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent ?? 30))}%`,
                    height: '100%',
                    backgroundColor: (realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? telemetry?.memoryPercent ?? 30) > 85 ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>

            {/* Storage & Suhu Tiles */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-amber)', marginBottom: '4px' }}>
                  <HardDrive size={13} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Penyimpanan Sisa</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {realtimeMetrics?.io?.storage_free_bytes
                    ? `${(realtimeMetrics.io.storage_free_bytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free`
                    : telemetry?.storageFreeBytes
                    ? `${(telemetry.storageFreeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free`
                    : device.storageFreeBytes > 0
                    ? `${(device.storageFreeBytes / (1024 * 1024 * 1024)).toFixed(1)} GB Free`
                    : '53.4 GB Free'}
                </div>
              </div>

              <div style={{ padding: '10px 12px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-rose)', marginBottom: '4px' }}>
                  <Thermometer size={13} />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600 }}>Suhu & Koneksi</span>
                </div>
                <div style={{ fontSize: '0.875rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                  {realtimeMetrics?.io?.battery_temp_celsius ?? realtimeMetrics?.io?.batteryTempCelsius ?? 34.2}°C
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 600 }}>
                    {realtimeMetrics?.io?.network_type ?? realtimeMetrics?.io?.networkType ?? 'WIFI'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Live Visual Screenshot Audit */}
        <div className="card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ImageIcon size={16} style={{ color: 'var(--accent-indigo)' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Tangkapan Layar Live (Audit Visual)
              </h3>
            </div>
            {screenshots.length > 0 && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {new Date(screenshots[0].capturedAt).toLocaleTimeString('id-ID')}
              </span>
            )}
          </div>

          {screenshots.length === 0 ? (
            <div style={{
              height: '140px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px dashed var(--border-subtle)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              color: 'var(--text-muted)',
              fontSize: '0.75rem',
            }}>
              <Camera size={24} style={{ opacity: 0.5 }} />
              <span>Belum ada screenshot yang diunggah player.</span>
              <button
                onClick={() => handleSendCommand(ServerCommandType.COMMAND_CAPTURE_SCREENSHOT, 'Ambil Screenshot')}
                className="btn btn-outline"
                style={{ fontSize: '0.6875rem', padding: '4px 8px', marginTop: '4px' }}
              >
                Minta Screenshot Sekarang
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div
                onClick={() => setSelectedScreenshot(`${getMediaStreamUrl(screenshots[0].fileUrl)}&t=${new Date(screenshots[0].capturedAt).getTime()}`)}
                style={{
                  position: 'relative',
                  width: '100%',
                  height: '140px',
                  borderRadius: '10px',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  border: '1px solid var(--border-subtle)',
                  backgroundColor: 'var(--bg-surface-elevated)',
                }}
              >
                <img
                  src={`${getMediaStreamUrl(screenshots[0].fileUrl)}&t=${new Date(screenshots[0].capturedAt).getTime()}`}
                  alt="Live Screen Capture"
                  style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                />
                <div style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(0,0,0,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: 0,
                  transition: 'opacity 0.2s ease',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '0')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#fff', fontSize: '0.75rem', fontWeight: 600 }}>
                    <Eye size={16} />
                    <span>Perbesar Layar</span>
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                <span>Klik gambar untuk melihat resolusi penuh</span>
                <span>Tersedia {screenshots.length} arsip</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Proof-of-Play (Audit & Impression Logs) */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Bukti Tayang / Proof of Play
              </h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Laporan verifikasi kepatuhan impresi iklan dan penayangan konten di layar.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={handleExportCSV}
              disabled={playbackLogs.length === 0}
              className="btn btn-outline"
              title="Unduh data bukti tayang ke berkas CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <Download size={14} />
              <span>Ekspor Laporan CSV</span>
            </button>
          </div>
        </div>

        {/* Airtime & Delivery KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL PENAYANGAN (IMPRESI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {playbackLogs.length}
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL AIRTIME (DURASI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {(playbackLogs.reduce((acc, cur) => acc + (cur.durationSeconds || 0), 0) / 60).toFixed(1)} Menit
            </div>
          </div>
          <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>RASIO TAYANG SUKSES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              {playbackLogs.length
                ? `${Math.round((playbackLogs.filter(l => l.isCompleted).length / playbackLogs.length) * 100)}%`
                : '100%'}
            </div>
          </div>
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

      {/* Lightbox Modal for Full Screenshot View */}
      {selectedScreenshot && (
        <div
          onClick={() => setSelectedScreenshot(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderBottom: '1px solid var(--border-subtle)',
            }}>
              <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Tangkapan Layar Langsung (Live Screen Capture)
              </span>
              <button
                onClick={() => setSelectedScreenshot(null)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <X size={18} />
              </button>
            </div>
            <div style={{ padding: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-primary)' }}>
              <img
                src={selectedScreenshot}
                alt="Enlarged screenshot"
                style={{ maxWidth: '85vw', maxHeight: '75vh', objectFit: 'contain', borderRadius: '4px' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
