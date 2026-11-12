'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, Device } from '@/lib/services';
import {
  pushDeviceCommand,
  ServerCommandType,
  PlaybackRecord,
  DeviceScreenshot,
  LatestTelemetry,
  getDeviceAnalyticsHistory,
  DeviceAnalyticsRecord,
  HardwareInputOutput,
  AssetStats,
} from '@/lib/services/hardware/device.service';
import { Film, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { formatIndonesianDateTime } from '../components/formatIndonesianDateTime';

export function cleanMediaTitle(raw?: string): string {
  if (!raw) return 'Tidak ada video aktif (Standby)';
  return raw.replace(/^[0-9a-fA-F-]{36}_/, '');
}

export interface AssetVerdict {
  type: 'idle' | 'danger' | 'warning' | 'success';
  color: string;
  bg: string;
  border: string;
  icon: React.ReactNode;
  title: string;
  desc: string;
}

export interface DeviceLiveDiagnostics {
  timestampMs?: number;
  cpuPercent?: number;
  memoryPercent?: number;
  heapUsedMb?: number;
  heapMaxMb?: number;
  screenSleeping?: boolean;
  lastCrashTimestampMs?: number;
  lastCrashSummary?: string;
  zonesList?: Array<{
    zoneId?: string;
    kind?: string;
    mediaId?: string;
    mediaName?: string;
    state?: string;
    resolution?: string;
    droppedFrames?: number;
    lastError?: string;
    bufferedDurationMs?: number;
    playbackState?: string;
  }>;
}

interface DisplayDetailContextType {
  deviceId: string;
  device: Device | null;
  playbackLogs: PlaybackRecord[];
  screenshots: DeviceScreenshot[];
  telemetry: LatestTelemetry | null;
  realtimeMetrics: {
    io: HardwareInputOutput;
    assetsList: AssetStats[];
  } | null;
  analyticsHistory: DeviceAnalyticsRecord[];
  timeRange: string;
  setTimeRange: (range: string) => void;
  isLiveConnected: boolean;
  liveDiagnostics: DeviceLiveDiagnostics | null;
  diagnosticsFresh: boolean;
  diagnosticsError: string;
  hoveredPoint: DeviceAnalyticsRecord | null;
  setHoveredPoint: (pt: DeviceAnalyticsRecord | null) => void;
  selectedScreenshot: string | null;
  setSelectedScreenshot: (url: string | null) => void;
  loading: boolean;
  deviceLoadError: boolean;
  sendingCmd: string | null;
  cmdFeedback: string | null;
  approving: boolean;
  fetchDevice: () => Promise<void>;
  fetchAnalytics: (range: string) => Promise<void>;
  handleApprovePairing: (codeToPair?: string) => Promise<void>;
  handleExportCSV: () => void;
  handleSendCommand: (cmdType: ServerCommandType, label: string, payloadJson?: string) => Promise<boolean>;
  sortedHistory: DeviceAnalyticsRecord[];
  activeAssetsList: AssetStats[];
  currentCpu: number;
  currentRam: number;
  getAssetVerdict: (asset: AssetStats) => AssetVerdict;
}

const DisplayDetailContext = createContext<DisplayDetailContextType | undefined>(undefined);

export function useDisplayDetail() {
  const ctx = useContext(DisplayDetailContext);
  if (!ctx) {
    throw new Error('useDisplayDetail must be used within DisplayDetailProvider');
  }
  return ctx;
}

export function DisplayDetailProvider({
  deviceId,
  children,
}: {
  deviceId: string;
  children: React.ReactNode;
}) {
  const [device, setDevice] = useState<Device | null>(null);
  const [playbackLogs, setPlaybackLogs] = useState<PlaybackRecord[]>([]);
  const [screenshots, setScreenshots] = useState<DeviceScreenshot[]>([]);
  const [telemetry, setTelemetry] = useState<LatestTelemetry | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<{
    io: HardwareInputOutput;
    assetsList: AssetStats[];
  } | null>(null);
  const [analyticsHistory, setAnalyticsHistory] = useState<DeviceAnalyticsRecord[]>([]);
  const [timeRange, setTimeRange] = useState<string>('1h');
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [liveDiagnostics, setLiveDiagnostics] = useState<DeviceLiveDiagnostics | null>(null);
  const [diagnosticsFresh, setDiagnosticsFresh] = useState(false);
  const [diagnosticsError, setDiagnosticsError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<DeviceAnalyticsRecord | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deviceLoadError, setDeviceLoadError] = useState(false);
  const [sendingCmd, setSendingCmd] = useState<string | null>(null);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);
  const isLiveConnectedRef = useRef(false);

  const fetchAnalytics = async (range: string) => {
    try {
      const records = await getDeviceAnalyticsHistory(deviceId, range, 60);
      setAnalyticsHistory(records);
    } catch (_) {}
  };

  const checkTrulyOnline = (dev: Device | null): boolean => {
    if (!dev || !dev.isOnline) return false;
    if (!dev.lastHeartbeatAt) return false;
    const elapsed = Date.now() - new Date(dev.lastHeartbeatAt).getTime();
    return elapsed >= 0 && elapsed <= 10000;
  };

  const fetchDevice = async () => {
    try {
      setLoading(true);
      setDeviceLoadError(false);
      const data = await api.getDevice(deviceId);
      setDevice(data);
      const online = checkTrulyOnline(data);
      isLiveConnectedRef.current = online;
      setIsLiveConnected(online);

      await Promise.allSettled([
        api.listPlaybackLogs({ deviceId, limit: 15 }).then((res) => setPlaybackLogs(res.items)),
        api.listDeviceScreenshots(deviceId, 10).then((res) => setScreenshots(res)),
        api.getLatestDeviceTelemetry(deviceId).then((res) => setTelemetry(res)),
      ]);
    } catch (err: any) {
      console.error('Failed to load display details:', err);
      setDeviceLoadError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
  }, [deviceId]);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!deviceId) return;

    let active = true;
    const controller = new AbortController();
    let staleTimer: ReturnType<typeof setTimeout> | null = null;
    let retryDelayMs = 1000;
    setDiagnosticsFresh(false);
    setDiagnosticsError('');

    const markStale = () => {
      setDiagnosticsFresh(false);
      isLiveConnectedRef.current = false;
      setIsLiveConnected(false);
    };
    const resetStaleTimer = () => {
      if (staleTimer) clearTimeout(staleTimer);
      staleTimer = setTimeout(markStale, 10_000);
    };
    const handleStatusEvent = (event: {
      isOnline?: boolean;
      timestampMs?: number;
      diagnostics?: DeviceLiveDiagnostics;
    }) => {
      const wasOnline = isLiveConnectedRef.current;
      const online = Boolean(event.isOnline || event.diagnostics);
      isLiveConnectedRef.current = online;
      setIsLiveConnected(online);
      setDevice((current) =>
        current
          ? {
              ...current,
              isOnline: online,
              lastHeartbeatAt: online
                ? new Date(event.timestampMs || Date.now()).toISOString()
                : current.lastHeartbeatAt,
            }
          : current,
      );

      if (!online) {
        if (staleTimer) clearTimeout(staleTimer);
        setDiagnosticsFresh(false);
        return;
      }

      setDeviceLoadError(false);
      resetStaleTimer();
      if (!wasOnline) void fetchDevice();

      if (event.diagnostics) {
        const diagnostics = event.diagnostics;
        setLiveDiagnostics(diagnostics);
        setDiagnosticsFresh(true);
        setRealtimeMetrics((current) => ({
          io: {
            ...current?.io,
            cpu_percent: diagnostics.cpuPercent,
            ram_percent: diagnostics.memoryPercent,
          },
          assetsList: diagnostics.zonesList?.map((zone) => ({
            zone_name: zone.kind || zone.zoneId,
            media_id: zone.mediaId,
            media_name: zone.mediaName,
            playback_status: zone.playbackState || zone.state,
            resolution: zone.resolution,
            dropped_frames: zone.droppedFrames,
            diagnostic_note: zone.lastError,
          })) || current?.assetsList || [],
        }));
      }
    };

    const readStatusStream = async () => {
      while (active) {
        try {
          let token = '';
          try {
            token = JSON.parse(localStorage.getItem('dkasigma_session') || '{}').token || '';
          } catch {
            token = '';
          }
          const response = await fetch(
            `/api/grpc/distribution/stream/WatchDeviceStatus?deviceId=${encodeURIComponent(deviceId)}`,
            {
              headers: token ? { authorization: `Bearer ${token}` } : {},
              signal: controller.signal,
            },
          );
          if (!response.ok || !response.body) throw new Error(`HTTP ${response.status}`);

          setDiagnosticsError('');
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
                retryDelayMs = 1000;
                handleStatusEvent(JSON.parse(data));
              }
              boundary = buffer.indexOf('\n\n');
            }
            if (done) break;
          }
          if (active) throw new Error('Aliran status player terputus');
        } catch (error) {
          if (!active) break;
          setDiagnosticsError(error instanceof Error ? error.message : 'Koneksi status gagal');
          await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
          retryDelayMs = Math.min(retryDelayMs * 2, 30_000);
        }
      }
    };

    resetStaleTimer();
    void readStatusStream();
    return () => {
      active = false;
      controller.abort();
      if (staleTimer) clearTimeout(staleTimer);
    };
  }, [deviceId]);

  const executePairing = async (code: string) => {
    try {
      setApproving(true);
      await api.pairDevice({
        deviceId: device?.id || deviceId,
        pairingCode: code.toUpperCase().trim(),
        deviceName: device?.name || 'Display Android',
      });
      setCmdFeedback('Layar berhasil disetujui! Membuka streaming player...');
      await fetchDevice();
    } catch (err: any) {
      throw err;
    } finally {
      setApproving(false);
    }
  };

  const handleApprovePairing = async (codeToPair?: string) => {
    if (!codeToPair) throw new Error('Kode pairing wajib diisi');
    await executePairing(codeToPair);
  };

  const handleExportCSV = () => {
    if (!playbackLogs.length) return alert('Tidak ada log penayangan untuk diekspor');
    const headers = [
      'ID Rekaman',
      'Nama Media',
      'Layout',
      'Waktu Tayang',
      'Durasi (Detik)',
      'Status Tayang',
    ];
    const rows = playbackLogs.map((l) => [
      l.id,
      `"${(l.mediaName || l.mediaId || '').replace(/"/g, '""')}"`,
      `"${(l.layoutName || l.layoutId || '').replace(/"/g, '""')}"`,
      `"${formatIndonesianDateTime(l.startedAt)}"`,
      l.durationSeconds,
      l.isCompleted ? 'Selesai' : 'Sebagian',
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `proof_of_play_${device?.name || 'display'}_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSendCommand = async (cmdType: ServerCommandType, label: string, payloadJson?: string): Promise<boolean> => {
    try {
      setSendingCmd(label);
      setCmdFeedback(null);
      await pushDeviceCommand(deviceId, cmdType, payloadJson);
      setCmdFeedback(`Perintah "${label}" berhasil dikirim ke player.`);
      setTimeout(() => setCmdFeedback(null), 4000);

      setTimeout(() => void fetchDevice(), 3000);
      return true;
    } catch (err: any) {
      alert(`Gagal mengirim perintah: ${err.message}`);
      return false;
    } finally {
      setSendingCmd(null);
    }
  };

  const sortedHistory = [...analyticsHistory].sort(
    (a, b) => new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime()
  );

  const activeAssetsList =
    realtimeMetrics?.assetsList && realtimeMetrics.assetsList.length > 0
      ? realtimeMetrics.assetsList
      : [];

  const currentCpu = realtimeMetrics?.io?.cpu_percent ?? realtimeMetrics?.io?.cpuPercent ?? 0;
  const currentRam = realtimeMetrics?.io?.ram_percent ?? realtimeMetrics?.io?.ramPercent ?? 0;

  const getAssetVerdict = (asset: AssetStats): AssetVerdict => {
    const rawTitle = asset.media_name || asset.mediaName;
    const droppedFrames = asset.dropped_frames ?? asset.droppedFrames ?? 0;
    const bitrateKbps = asset.bitrate_kbps ?? asset.bitrateKbps ?? 0;
    const isHw = asset.is_hardware_accelerated ?? asset.isHardwareAccelerated ?? true;

    if (!rawTitle) {
      return {
        type: 'idle',
        color: 'var(--text-muted)',
        bg: 'var(--bg-surface-elevated)',
        border: 'var(--border-subtle)',
        icon: <Film size={15} style={{ color: 'var(--text-muted)' }} />,
        title: 'Siaga',
        desc: 'Tidak ada video aktif.',
      };
    }
    if (droppedFrames > 10) {
      if (currentCpu > 80) {
        return {
          type: 'danger',
          color: 'var(--accent-rose)',
          bg: 'rgba(244, 63, 94, 0.08)',
          border: 'rgba(244, 63, 94, 0.25)',
          icon: <AlertTriangle size={15} color="var(--accent-rose)" />,
          title: 'Beban Komputasi Tinggi',
          desc: `Terjadi ${droppedFrames} frame drop (CPU ${currentCpu.toFixed(0)}%).`,
        };
      } else {
        return {
          type: 'warning',
          color: 'var(--accent-amber)',
          bg: 'rgba(234, 179, 8, 0.08)',
          border: 'rgba(234, 179, 8, 0.25)',
          icon: <AlertTriangle size={15} color="var(--accent-amber)" />,
          title: 'Bitrate Tinggi',
          desc: `Terjadi ${droppedFrames} frame drop (${(bitrateKbps / 1000).toFixed(1)} Mbps).`,
        };
      }
    }
    if (droppedFrames > 0) {
      return {
        type: 'warning',
        color: 'var(--accent-amber)',
        bg: 'rgba(234, 179, 8, 0.08)',
        border: 'rgba(234, 179, 8, 0.25)',
        icon: <AlertTriangle size={15} color="var(--accent-amber)" />,
        title: 'Jeda Buffering',
        desc: `Terjadi ${droppedFrames} frame drop saat inisialisasi awal.`,
      };
    }
    if (!isHw) {
      return {
        type: 'warning',
        color: 'var(--accent-amber)',
        bg: 'rgba(234, 179, 8, 0.08)',
        border: 'rgba(234, 179, 8, 0.25)',
        icon: <AlertTriangle size={15} color="var(--accent-amber)" />,
        title: 'Software Decoding',
        desc: 'Akselerasi hardware tidak aktif untuk format ini.',
      };
    }
    return {
      type: 'success',
      color: 'var(--text-muted)',
      bg: 'var(--bg-surface)',
      border: 'var(--border-subtle)',
      icon: <CheckCircle2 size={15} style={{ opacity: 0.6 }} />,
      title: 'Optimal',
      desc: 'Pemutaran stabil tanpa kendala.',
    };
  };

  return (
    <DisplayDetailContext.Provider
      value={{
        deviceId,
        device,
        playbackLogs,
        screenshots,
        telemetry,
        realtimeMetrics,
        analyticsHistory,
        timeRange,
        setTimeRange,
        isLiveConnected,
        liveDiagnostics,
        diagnosticsFresh,
        diagnosticsError,
        hoveredPoint,
        setHoveredPoint,
        selectedScreenshot,
        setSelectedScreenshot,
        loading,
        deviceLoadError,
        sendingCmd,
        cmdFeedback,
        approving,
        fetchDevice,
        fetchAnalytics,
        handleApprovePairing,
        handleExportCSV,
        handleSendCommand,
        sortedHistory,
        activeAssetsList,
        currentCpu,
        currentRam,
        getAssetVerdict,
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {children}
      </div>
    </DisplayDetailContext.Provider>
  );
}