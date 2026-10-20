'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { api, Schedule, Device, DisplayGroup, MediaItem } from '@/lib/services';
import { invokeApi } from '@/lib/core/invokeApi';

export interface ChunkErrorItem {
  chunkIndex: number;
  error: string;
  timestamp: string;
}

export interface UploadLogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'chunk';
  message: string;
}

export interface DeviceDownloadProgressItem {
  progressPercent: number;
  assetIndex: number;
  totalAssets: number;
  downloadedBytes: number;
  totalBytes: number;
  fileName: string;
  isSync: boolean;
}

interface ScheduleDetailContextType {
  scheduleId: string;
  schedule: Schedule | null;
  layoutDetails: any | null;
  layoutMediaItems: MediaItem[];
  assignedDevices: Device[];
  assignedGroups: DisplayGroup[];
  loading: boolean;
  deleting: boolean;
  activeTab: 'data' | 'rollout';
  setActiveTab: (tab: 'data' | 'rollout') => void;
  copiedHash: string | null;
  handleCopyHash: (hash: string) => void;
  formatBytes: (bytes?: number) => string;
  dayNames: { num: number; label: string }[];
  primaryEvent: any | null;
  activeDays: number[];
  totalAssetBytes: number;
  fetchScheduleData: (silent?: boolean) => Promise<void>;
  handleDelete: () => Promise<void>;
  deviceDownloadProgress: Record<string, DeviceDownloadProgressItem>;
  syncingDevId: string | null;
  handlePushSyncToDevice: (deviceId: string, deviceName: string) => Promise<void>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  selectedUploadFile: File | null;
  setSelectedUploadFile: (file: File | null) => void;
  uploading: boolean;
  uploadProgress: number;
  chunkStatus: {
    currentChunk: number;
    totalChunks: number;
    chunkSize: number;
    speedBps: number;
    uploadedBytes: number;
    totalBytes: number;
  } | null;
  uploadLogs: UploadLogItem[];
  setUploadLogs: React.Dispatch<React.SetStateAction<UploadLogItem[]>>;
  uploadErrors: ChunkErrorItem[];
  handleStartChunkUpload: () => Promise<void>;
  handleCancelUpload: () => void;
}

const ScheduleDetailContext = createContext<ScheduleDetailContextType | undefined>(undefined);

export function useScheduleDetail() {
  const ctx = useContext(ScheduleDetailContext);
  if (!ctx) {
    throw new Error('useScheduleDetail must be used within ScheduleDetailProvider');
  }
  return ctx;
}

export function ScheduleDetailProvider({
  scheduleId,
  children,
}: {
  scheduleId: string;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'data' | 'rollout'>('data');
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [layoutDetails, setLayoutDetails] = useState<any | null>(null);
  const [layoutMediaItems, setLayoutMediaItems] = useState<MediaItem[]>([]);
  const [assignedDevices, setAssignedDevices] = useState<Device[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<DisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const isUploadingRef = useRef(false);
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [chunkStatus, setChunkStatus] = useState<{
    currentChunk: number;
    totalChunks: number;
    chunkSize: number;
    speedBps: number;
    uploadedBytes: number;
    totalBytes: number;
  } | null>(null);
  const [uploadLogs, setUploadLogs] = useState<UploadLogItem[]>([]);
  const [uploadErrors, setUploadErrors] = useState<ChunkErrorItem[]>([]);

  const [deviceDownloadProgress, setDeviceDownloadProgress] = useState<
    Record<string, DeviceDownloadProgressItem>
  >({});
  const [syncingDevId, setSyncingDevId] = useState<string | null>(null);

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const fetchScheduleData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [sched, devRes, grpRes, allMediaRes] = await Promise.all([
        api.getSchedule(scheduleId),
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
        api.getMedia({ limit: 1000 }).catch(() => ({ data: [], total: 0 })),
      ]);
      setSchedule(sched);

      const allDevices = devRes.data || [];
      const devMatches = allDevices.filter(
        (d: any) => d.scheduleId === scheduleId || d.schedule_id === scheduleId
      );
      setAssignedDevices(devMatches);

      const allGroups = grpRes.data || [];
      const grpMatches = allGroups.filter(
        (g: any) => g.scheduleId === scheduleId || g.schedule_id === scheduleId
      );
      setAssignedGroups(grpMatches);

      const primaryLayoutId = sched.eventsList?.[0]?.layoutId;
      if (primaryLayoutId) {
        const [layoutRes, playlistsRes] = await Promise.all([
          api.getLayout(primaryLayoutId).catch(() => null),
          api.getPlaylists({ limit: 1000 }).catch(() => ({ data: [], total: 0 })),
        ]);
        setLayoutDetails(layoutRes);

        if (layoutRes?.layersList) {
          const mediaIdsInLayout = new Set<string>();
          const playlistMap = new Map<string, any>();
          (playlistsRes.data || []).forEach((p: any) => playlistMap.set(p.id, p));

          layoutRes.layersList.forEach((layer: any) => {
            (layer.blocksList || []).forEach((block: any) => {
              if (block.mediaItemId) mediaIdsInLayout.add(block.mediaItemId);
              if (block.playlistId) {
                const pl = playlistMap.get(block.playlistId);
                if (pl?.items) {
                  pl.items.forEach((item: any) => {
                    const mid = item.mediaItemId || item.media_item_id;
                    if (mid) mediaIdsInLayout.add(mid);
                  });
                }
              }
            });
          });

          const matchedMedia = (allMediaRes.data || []).filter((m: any) =>
            mediaIdsInLayout.has(m.id)
          );
          setLayoutMediaItems(matchedMedia);
        }
      }
    } catch (err: any) {
      if (!silent) {
        alert(err.message || 'Gagal memuat jadwal tayang');
        router.push('/studio/schedules');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchScheduleData();
  }, [scheduleId]);

  useEffect(() => {
    if (assignedDevices.length === 0) return;

    const eventSources: EventSource[] = [];

    assignedDevices.forEach((dev) => {
      try {
        const es = new EventSource(`/api/stream/device?deviceId=${dev.id}`);
        es.onmessage = (event) => {
          if (!event.data) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'ASSET_DOWNLOAD_PROGRESS') {
              setDeviceDownloadProgress((prev) => ({
                ...prev,
                [dev.id]: {
                  progressPercent: data.progressPercent || 0,
                  assetIndex: data.assetIndex || 0,
                  totalAssets: data.totalAssets || 0,
                  downloadedBytes: data.downloadedBytes || 0,
                  totalBytes: data.totalBytes || 0,
                  fileName: data.fileName || '',
                  isSync: false,
                },
              }));
            } else if (data.type === 'ASSET_DOWNLOAD_COMPLETE') {
              setDeviceDownloadProgress((prev) => ({
                ...prev,
                [dev.id]: {
                  progressPercent: 100,
                  assetIndex: prev[dev.id]?.totalAssets || layoutMediaItems.length,
                  totalAssets: prev[dev.id]?.totalAssets || layoutMediaItems.length,
                  downloadedBytes: prev[dev.id]?.totalBytes || 0,
                  totalBytes: prev[dev.id]?.totalBytes || 0,
                  fileName: 'Semua berkas terverifikasi',
                  isSync: true,
                },
              }));
            }
          } catch (_) {}
        };
        eventSources.push(es);
      } catch (_) {}
    });

    return () => {
      eventSources.forEach((es) => es.close());
    };
  }, [assignedDevices, layoutMediaItems.length]);

  const handleDelete = async () => {
    if (!schedule) return;
    if (!confirm(`Hapus jadwal tayang "${schedule.name}"?`)) return;

    try {
      setDeleting(true);
      await api.deleteSchedule(schedule.id);
      router.push('/studio/schedules');
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus jadwal');
      setDeleting(false);
    }
  };

  const handlePushSyncToDevice = async (deviceId: string, deviceName: string) => {
    try {
      setSyncingDevId(deviceId);
      setUploadLogs((prev) => [
        {
          id: `manual-push-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'info',
          message: `Mengirim sinyal gRPC (COMMAND_RELOAD_MANIFEST) ke layar "${deviceName}"...`,
        },
        ...prev,
      ]);

      await api.pushDeviceCommand(deviceId, 1);

      setUploadLogs((prev) => [
        {
          id: `manual-push-success-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'success',
          message: `Sinyal gRPC terkirim ke "${deviceName}"! Player Android segera merequest manifest dan memverifikasi chunk media.`,
        },
        ...prev,
      ]);
      await fetchScheduleData(true);
    } catch (err: any) {
      setUploadLogs((prev) => [
        {
          id: `manual-push-err-${Date.now()}`,
          time: new Date().toLocaleTimeString(),
          type: 'error',
          message: `Gagal mengirim sinyal ke "${deviceName}": ${err.message || 'Galat gRPC'}`,
        },
        ...prev,
      ]);
      alert(`Gagal mengirim sinyal ke layar: ${err.message || 'Galat'}`);
    } finally {
      setSyncingDevId(null);
    }
  };

  const handleStartChunkUpload = async () => {
    if (!selectedUploadFile || !schedule || isUploadingRef.current) return;
    isUploadingRef.current = true;

    const file = selectedUploadFile;
    const CHUNK_SIZE = 1024 * 1024;
    const totalBytes = file.size;
    const totalChunks = Math.max(1, Math.ceil(totalBytes / CHUNK_SIZE));
    const uploadId =
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `up_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    setUploading(true);
    setUploadProgress(0);
    setUploadErrors([]);
    setUploadLogs([
      {
        id: `init-${Date.now()}`,
        time: new Date().toLocaleTimeString(),
        type: 'info',
        message: `Memulai inisialisasi upload: "${file.name}" (${formatBytes(totalBytes)}, total ${totalChunks} chunk @ 1 MB, upload_id: ${uploadId.substring(0, 8)}...)`,
      },
    ]);

    let completedChunks = 0;
    let totalUploadedBytes = 0;
    let lastStreamPushTime = 0;
    const startTime = Date.now();
    const MAX_CONCURRENCY = 4;

    const chunkIndices = Array.from({ length: totalChunks }, (_, i) => i);
    const failedChunks: number[] = [];

    const processChunk = async (chunkIndex: number) => {
      if (abortController.signal.aborted) {
        throw new Error('Upload dibatalkan oleh pengguna');
      }

      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, totalBytes);
      const currentChunkSize = end - start;
      const slice = file.slice(start, end);
      const arrayBuffer = await slice.arrayBuffer();
      const chunkData = new Uint8Array(arrayBuffer);

      try {
        const res = await api.uploadMediaChunk({
          upload_id: uploadId,
          originalFilename: file.name,
          mimeType: file.type || 'application/octet-stream',
          chunk_index: chunkIndex,
          total_chunks: totalChunks,
          chunk_data: chunkData,
          total_file_size: totalBytes,
          chunk_offset: start,
        });

        if (!res.success) {
          throw new Error(res.error_message || 'Galat respons gRPC dari server');
        }

        completedChunks++;
        totalUploadedBytes += currentChunkSize;
        const progress = Math.min(99, Math.round((completedChunks / totalChunks) * 100));
        setUploadProgress(progress);

        const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
        const speedBps = totalUploadedBytes / elapsedSec;

        setChunkStatus({
          currentChunk: completedChunks,
          totalChunks,
          chunkSize: CHUNK_SIZE,
          speedBps,
          uploadedBytes: totalUploadedBytes,
          totalBytes,
        });

        if (assignedDevices.length > 0) {
          const now = Date.now();
          if (now - lastStreamPushTime > 150 || completedChunks === totalChunks || completedChunks === 1) {
            lastStreamPushTime = now;
            for (const dev of assignedDevices) {
              invokeApi('/api/stream/device', {
                deviceId: dev.id,
                type: 'CHUNK_PROGRESS',
                fileName: file.name,
                chunkIndex,
                completedChunks,
                totalChunks,
                percent: progress,
                uploadedBytes: totalUploadedBytes,
                totalBytes,
                speedBps,
              }).catch(() => null);
            }
          }
        }

        if (chunkIndex % 10 === 0 || completedChunks === totalChunks) {
          setUploadLogs((prev) => [
            {
              id: `chunk-${chunkIndex}-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              type: 'chunk',
              message: `Chunk #${chunkIndex + 1}/${totalChunks} terunggah (${formatBytes(currentChunkSize)}) — ${progress}%`,
            },
            ...prev.slice(0, 100),
          ]);
        }
      } catch (err: any) {
        failedChunks.push(chunkIndex);
        const errMsg = err.message || 'Galat saat transmisi chunk';
        setUploadErrors((prev) => [
          ...prev,
          {
            chunkIndex,
            error: errMsg,
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
        setUploadLogs((prev) => [
          {
            id: `err-${chunkIndex}-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            type: 'error',
            message: `GALAT pada Chunk #${chunkIndex + 1}/${totalChunks} (offset: ${start} B): ${errMsg}`,
          },
          ...prev.slice(0, 100),
        ]);
        throw err;
      }
    };

    try {
      const executing = new Set<Promise<void>>();
      for (const index of chunkIndices) {
        if (abortController.signal.aborted) break;
        const p = processChunk(index);
        executing.add(p);
        p.finally(() => executing.delete(p));

        if (executing.size >= MAX_CONCURRENCY) {
          await Promise.race(executing);
        }
      }
      await Promise.all(executing);

      if (failedChunks.length === 0) {
        setUploadProgress(100);
        setUploadLogs((prev) => [
          {
            id: `finalize-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            type: 'info',
            message: 'Seluruh chunk berhasil diunggah! Memulai penggabungan file & SHA-256 hashing di server...',
          },
          ...prev,
        ]);

        const finalResult = await api.finalizeUpload(uploadId, file.name, totalChunks);
        if (!finalResult || !finalResult.is_completed) {
          throw new Error('Finalisasi berkas di server backend gagal.');
        }

        setUploadLogs((prev) => [
          {
            id: `success-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            type: 'success',
            message: `1. Uji transmisi chunk selesai! File "${file.name}" (${formatBytes(finalResult.fileSizeBytes)}) berhasil digabung di server (SHA-256: ${finalResult.sha256Hash?.substring(0, 16)}...).`,
          },
          ...prev,
        ]);

        if (assignedDevices.length > 0) {
          for (const dev of assignedDevices) {
            invokeApi('/api/stream/device', {
              deviceId: dev.id,
              type: 'COMPLETE',
              fileName: file.name,
              totalChunks,
              totalBytes,
              sha256Hash: finalResult.sha256Hash,
            }).catch(() => null);
          }

          setUploadLogs((prev) => [
            {
              id: `test-done-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              type: 'success',
              message: `2. Uji transmisi chunk real-time selesai! Sinyal COMPLETE terkirim ke player (${assignedDevices.map((d) => d.name).join(', ')}). Tidak ada reload manifest paksa.`,
            },
            ...prev,
          ]);
        } else {
          setUploadLogs((prev) => [
            {
              id: `test-warn-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              type: 'info',
              message: `Catatan: Saat ini 0 Layar Aktif terikat. Tugaskan layar jika ingin menguji transmisi langsung ke device Android.`,
            },
            ...prev,
          ]);
        }

        setSelectedUploadFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await fetchScheduleData(true);
      }
    } catch (err: any) {
      if (err.message?.includes('dibatalkan')) {
        setUploadLogs((prev) => [
          {
            id: `abort-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            type: 'info',
            message: 'Upload berkas dibatalkan oleh pengguna.',
          },
          ...prev,
        ]);
        if (assignedDevices.length > 0) {
          for (const dev of assignedDevices) {
            invokeApi('/api/stream/device', {
              deviceId: dev.id,
              type: 'CANCELLED',
              fileName: file.name,
            }).catch(() => null);
          }
        }
      }
    } finally {
      isUploadingRef.current = false;
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    isUploadingRef.current = false;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
    if (assignedDevices.length > 0) {
      for (const dev of assignedDevices) {
        invokeApi('/api/stream/device', {
          deviceId: dev.id,
          type: 'CANCELLED',
          fileName: selectedUploadFile?.name || '',
        }).catch(() => null);
      }
    }
  };

  const dayNames = [
    { num: 1, label: 'Senin' },
    { num: 2, label: 'Selasa' },
    { num: 3, label: 'Rabu' },
    { num: 4, label: 'Kamis' },
    { num: 5, label: 'Jumat' },
    { num: 6, label: 'Sabtu' },
    { num: 7, label: 'Minggu' },
  ];

  const primaryEvent =
    schedule?.eventsList && schedule.eventsList.length > 0 ? schedule.eventsList[0] : null;
  const activeDays = primaryEvent?.daysOfWeek
    ? primaryEvent.daysOfWeek.split(',').map((d: string) => Number(d.trim()))
    : [1, 2, 3, 4, 5, 6, 7];

  const totalAssetBytes = layoutMediaItems.reduce(
    (acc, m) => acc + (m.fileSizeBytes || 0),
    0
  );

  return (
    <ScheduleDetailContext.Provider
      value={{
        scheduleId,
        schedule,
        layoutDetails,
        layoutMediaItems,
        assignedDevices,
        assignedGroups,
        loading,
        deleting,
        activeTab,
        setActiveTab,
        copiedHash,
        handleCopyHash,
        formatBytes,
        dayNames,
        primaryEvent,
        activeDays,
        totalAssetBytes,
        fetchScheduleData,
        handleDelete,
        deviceDownloadProgress,
        syncingDevId,
        handlePushSyncToDevice,
        fileInputRef,
        selectedUploadFile,
        setSelectedUploadFile,
        uploading,
        uploadProgress,
        chunkStatus,
        uploadLogs,
        setUploadLogs,
        uploadErrors,
        handleStartChunkUpload,
        handleCancelUpload,
      }}
    >
      {children}
    </ScheduleDetailContext.Provider>
  );
}
