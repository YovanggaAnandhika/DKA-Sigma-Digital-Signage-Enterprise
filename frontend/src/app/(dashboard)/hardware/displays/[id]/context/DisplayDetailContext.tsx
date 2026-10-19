'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  hoveredPoint: DeviceAnalyticsRecord | null;
  setHoveredPoint: (pt: DeviceAnalyticsRecord | null) => void;
  selectedScreenshot: string | null;
  setSelectedScreenshot: (url: string | null) => void;
  loading: boolean;
  sendingCmd: string | null;
  cmdFeedback: string | null;
  approving: boolean;
  fetchDevice: () => Promise<void>;
  fetchAnalytics: (range: string) => Promise<void>;
  handleApprovePairing: (codeToPair?: string) => Promise<void>;
  handleExportCSV: () => void;
  handleSendCommand: (cmdType: ServerCommandType, label: string) => Promise<void>;
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
  const router = useRouter();
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
  const [hoveredPoint, setHoveredPoint] = useState<DeviceAnalyticsRecord | null>(null);
  const [selectedScreenshot, setSelectedScreenshot] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendingCmd, setSendingCmd] = useState<string | null>(null);
  const [cmdFeedback, setCmdFeedback] = useState<string | null>(null);
  const [approving, setApproving] = useState(false);

  const fetchAnalytics = async (range: string) => {
    try {
      const records = await getDeviceAnalyticsHistory(deviceId, range, 60);
      setAnalyticsHistory(records);
      if (records.length > 0 && !realtimeMetrics) {
        const last = records[records.length - 1];
        const initialList =
          last.assetsStatsList && last.assetsStatsList.length > 0
            ? last.assetsStatsList
            : last.assetsStats
            ? [last.assetsStats]
            : [];
        setRealtimeMetrics({
          io: last.inputOutput || {},
          assetsList: initialList,
        });
      }
    } catch (_) {}
  };

  const fetchDevice = async () => {
    try {
      setLoading(true);
      const data = await api.getDevice(deviceId);
      setDevice(data);

      await Promise.allSettled([
        api.listPlaybackLogs({ deviceId, limit: 15 }).then((res) => setPlaybackLogs(res.items)),
        api.listDeviceScreenshots(deviceId, 10).then((res) => setScreenshots(res)),
        api.getLatestDeviceTelemetry(deviceId).then((res) => setTelemetry(res)),
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
  }, [deviceId]);

  useEffect(() => {
    fetchAnalytics(timeRange);
  }, [timeRange]);

  useEffect(() => {
    if (!deviceId) return;
    const sse = new EventSource(`/api/stream/device?deviceId=${deviceId}`);

    sse.onopen = () => setIsLiveConnected(true);
    sse.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'ANALYTICS_UPDATE' && data.snapshot) {
          setIsLiveConnected(true);
          let io: HardwareInputOutput = {};
          let assetsList: AssetStats[] = [];
          try {
            io =
              typeof data.snapshot.inputOutputJson === 'string'
                ? JSON.parse(data.snapshot.inputOutputJson)
                : data.snapshot.inputOutputJson || {};
          } catch (_) {}
          try {
            const raw =
              typeof data.snapshot.assetsStatsJson === 'string'
                ? JSON.parse(data.snapshot.assetsStatsJson)
                : data.snapshot.assetsStatsJson || {};
            if (Array.isArray(raw)) {
              assetsList = raw;
            } else if (raw && typeof raw === 'object') {
              if (Array.isArray(raw.items)) assetsList = raw.items;
              else if (Array.isArray(raw.activeAssets)) assetsList = raw.activeAssets;
              else assetsList = [raw];
            }
          } catch (_) {}

          setRealtimeMetrics({ io, assetsList });

          const newRecord: DeviceAnalyticsRecord = {
            id: data.snapshot.id || String(Date.now()),
            deviceId,
            inputOutputJson: JSON.stringify(io),
            assetsStatsJson: JSON.stringify(assetsList),
            recordedAt: data.snapshot.recordedAt || new Date().toISOString(),
            inputOutput: io,
            assetsStats: assetsList[0] || {},
            assetsStatsList: assetsList,
          };

          setAnalyticsHistory((prev) => {
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
  }, [deviceId]);

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

  const handleApprovePairing = async (codeToPair?: string) => {
    const code = codeToPair || device?.pairingCode;
    if (!code) {
      const manualCode = prompt('Masukkan kode pairing dari layar Android (misal: AU2-PZD):');
      if (!manualCode) return;
      return executePairing(manualCode);
    }
    await executePairing(code);
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
      `"${new Date(l.startedAt).toLocaleString('id-ID')}"`,
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

  const handleSendCommand = async (cmdType: ServerCommandType, label: string) => {
    try {
      setSendingCmd(label);
      setCmdFeedback(null);
      await pushDeviceCommand(deviceId, cmdType);
      setCmdFeedback(`Perintah "${label}" berhasil dikirim ke player.`);
      setTimeout(() => setCmdFeedback(null), 4000);

      if (cmdType === ServerCommandType.COMMAND_CAPTURE_SCREENSHOT) {
        setTimeout(() => {
          api
            .listDeviceScreenshots(deviceId, 10)
            .then((res) => {
              if (res && res.length > 0) setScreenshots(res);
            })
            .catch(() => {});
        }, 3500);
        setTimeout(() => {
          api
            .listDeviceScreenshots(deviceId, 10)
            .then((res) => {
              if (res && res.length > 0) setScreenshots(res);
            })
            .catch(() => {});
        }, 6500);
      }
    } catch (err: any) {
      alert(`Gagal mengirim perintah: ${err.message}`);
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
        hoveredPoint,
        setHoveredPoint,
        selectedScreenshot,
        setSelectedScreenshot,
        loading,
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
      {children}
    </DisplayDetailContext.Provider>
  );
}
