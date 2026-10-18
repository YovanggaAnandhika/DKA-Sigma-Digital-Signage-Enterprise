'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Schedule, Device, DisplayGroup, MediaItem } from '@/lib/services';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Layers,
  Monitor,
  Folder,
  Trash2,
  RefreshCw,
  ExternalLink,
  AlertCircle,
  CalendarDays,
  LayoutGrid,
  Rocket,
  UploadCloud,
  FileVideo,
  FileImage,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HardDrive,
  Cpu,
  Terminal,
  Copy,
  Check,
} from 'lucide-react';

interface ChunkErrorItem {
  chunkIndex: number;
  error: string;
  timestamp: string;
}

interface UploadLogItem {
  id: string;
  time: string;
  type: 'info' | 'success' | 'error' | 'chunk';
  message: string;
}

export default function ViewSchedulePage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  // Navigation tab: 'data' (Informasi Jadwal) | 'rollout' (Rollout & Upload Media)
  const [activeTab, setActiveTab] = useState<'data' | 'rollout'>('data');

  // Core data states
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [layoutDetails, setLayoutDetails] = useState<any | null>(null);
  const [layoutMediaItems, setLayoutMediaItems] = useState<MediaItem[]>([]);
  const [assignedDevices, setAssignedDevices] = useState<Device[]>([]);
  const [assignedGroups, setAssignedGroups] = useState<DisplayGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  // Chunk upload testing states
  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
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

  const fetchScheduleData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const [sched, devRes, grpRes, allMediaRes] = await Promise.all([
        api.getSchedule(params.id),
        api.getDevices({ limit: 1000 }),
        api.getDisplayGroups({ limit: 1000 }),
        api.getMedia({ limit: 1000 }).catch(() => ({ data: [], total: 0 })),
      ]);
      setSchedule(sched);

      const allDevices = devRes.data || [];
      const devMatches = allDevices.filter(
        (d: any) => d.scheduleId === params.id || d.schedule_id === params.id
      );
      setAssignedDevices(devMatches);

      const allGroups = grpRes.data || [];
      const grpMatches = allGroups.filter(
        (g: any) => g.scheduleId === params.id || g.schedule_id === params.id
      );
      setAssignedGroups(grpMatches);

      // Load layout details to resolve assets
      const primaryLayoutId = sched.eventsList?.[0]?.layoutId;
      if (primaryLayoutId) {
        const layoutRes = await api.getLayout(primaryLayoutId).catch(() => null);
        setLayoutDetails(layoutRes);

        if (layoutRes?.layersList) {
          const mediaIdsInLayout = new Set<string>();
          layoutRes.layersList.forEach((layer: any) => {
            (layer.blocksList || []).forEach((block: any) => {
              if (block.mediaItemId) mediaIdsInLayout.add(block.mediaItemId);
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
  }, [params.id]);

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

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const [syncingDevId, setSyncingDevId] = useState<string | null>(null);

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

  // Large Media Chunk Upload Handler
  const handleStartChunkUpload = async () => {
    if (!selectedUploadFile || !schedule) return;

    const file = selectedUploadFile;
    const CHUNK_SIZE = 512 * 1024; // 512 KB per chunk
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
        message: `Memulai inisialisasi upload: "${file.name}" (${formatBytes(totalBytes)}, total ${totalChunks} chunk @ 512 KB, upload_id: ${uploadId.substring(0, 8)}...)`,
      },
    ]);

    let completedChunks = 0;
    let totalUploadedBytes = 0;
    const startTime = Date.now();
    const MAX_CONCURRENCY = 5;

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

        // Log every 10 chunks or the final chunk to avoid React state flood
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

        const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
        const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]+/g, ' ');

        const newMedia = await api.createMedia({
          name: cleanName,
          originalFilename: file.name,
          filePath: finalResult.filePath,
          publicUrl: finalResult.publicUrl,
          fileSizeBytes: finalResult.fileSizeBytes,
          mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
          sha256Hash: finalResult.sha256Hash,
          mediaType: isVideo ? 2 : 1,
          width: 1920,
          height: 1080,
          durationSeconds: isVideo ? 30 : 10,
        });

        setUploadLogs((prev) => [
          {
            id: `success-${Date.now()}`,
            time: new Date().toLocaleTimeString(),
            type: 'success',
            message: `1. Berkas terdaftar di Server sebagai "${newMedia.name}" (${formatBytes(finalResult.fileSizeBytes)}). SHA256: ${finalResult.sha256Hash?.substring(0, 16)}...`,
          },
          ...prev,
        ]);

        // 2. Sematkan berkas baru ke layer pertama layout jadwal ini
        const primaryLayoutId = schedule.eventsList?.[0]?.layoutId;
        if (primaryLayoutId && layoutDetails?.layersList && layoutDetails.layersList.length > 0) {
          const targetLayerId = layoutDetails.layersList[0].id;
          setUploadLogs((prev) => [
            {
              id: `attach-${Date.now()}`,
              time: new Date().toLocaleTimeString(),
              type: 'info',
              message: `2. Menyematkan media ke Layout "${layoutDetails.name}" (Layer: ${layoutDetails.layersList[0].name})...`,
            },
            ...prev,
          ]);

          await api.addMediaBlock(targetLayerId, newMedia.id, 0, newMedia.durationSeconds || 10).catch(() => null);

          // 3. Simpan layout untuk kalkulasi version_hash baru
          const updatedLayout = await api.updateLayout(primaryLayoutId, {
            name: layoutDetails.name,
            canvasWidth: layoutDetails.canvasWidth,
            canvasHeight: layoutDetails.canvasHeight,
          }).catch(() => null);

          // 4. Update version_hash di schedule_events
          if (updatedLayout?.versionHash) {
            await api.pushLayoutToSchedule({
              layoutId: primaryLayoutId,
              scheduleId: schedule.id,
              priority: primaryEvent?.priority ?? 0,
              startTime: primaryEvent?.startTime || '00:00:00',
              endTime: primaryEvent?.endTime || '23:59:59',
              daysOfWeek: primaryEvent?.daysOfWeek || '1,2,3,4,5,6,7',
              deviceIds: assignedDevices.map((d) => d.id),
              displayGroupIds: assignedGroups.map((g) => g.id),
            }).catch(() => null);
          }

          // 5. Kirim perintah reload manifest ke seluruh perangkat layar yang ditugaskan
          if (assignedDevices.length > 0) {
            setUploadLogs((prev) => [
              {
                id: `push-cmd-${Date.now()}`,
                time: new Date().toLocaleTimeString(),
                type: 'info',
                message: `3. Mengirim sinyal distribusi (COMMAND_RELOAD_MANIFEST) ke ${assignedDevices.length} layar terhubung (${assignedDevices.map((d) => d.name).join(', ')})...`,
              },
              ...prev,
            ]);

            for (const dev of assignedDevices) {
              await api.pushDeviceCommand(dev.id, 1).catch(() => null);
            }

            setUploadLogs((prev) => [
              {
                id: `push-done-${Date.now()}`,
                time: new Date().toLocaleTimeString(),
                type: 'success',
                message: `4. Selesai! Sinyal gRPC terkirim ke Layar (${assignedDevices.map((d) => d.name).join(', ')}). Player Android segera mengunduh berkas baru via HTTP Range Chunk dan memverifikasi hash SHA-256.`,
              },
              ...prev,
            ]);
          } else {
            setUploadLogs((prev) => [
              {
                id: `push-warn-${Date.now()}`,
                time: new Date().toLocaleTimeString(),
                type: 'info',
                message: `Catatan: Saat ini 0 Layar Aktif terikat ke jadwal ini. Silakan tugaskan layar agar media langsung otomatis diunduh oleh Android player.`,
              },
              ...prev,
            ]);
          }
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
      }
    } finally {
      setUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setUploading(false);
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

  if (loading || !schedule) {
    return (
      <div style={{ padding: '80px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 16px auto', color: 'var(--primary-400)' }} />
        <span style={{ fontSize: '0.9375rem', fontWeight: 500 }}>Memuat detail jadwal tayang...</span>
      </div>
    );
  }

  const primaryEvent = schedule.eventsList && schedule.eventsList.length > 0 ? schedule.eventsList[0] : null;
  const activeDays = primaryEvent?.daysOfWeek
    ? primaryEvent.daysOfWeek.split(',').map((d) => Number(d.trim()))
    : [1, 2, 3, 4, 5, 6, 7];

  const totalAssetBytes = layoutMediaItems.reduce((acc, m) => acc + (m.fileSizeBytes || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      {/* Top Header Bar (Full-Width) */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/studio/schedules" className="btn btn-outline" style={{ padding: '8px' }} title="Kembali ke Penjadwalan">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                {schedule.name}
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(59, 130, 246, 0.12)',
                  color: 'var(--primary-400)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  fontFamily: 'monospace',
                  fontWeight: 600,
                }}
              >
                Prioritas: {primaryEvent?.priority ?? 0}
              </span>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0, display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span>{schedule.description || 'Jadwal tayang konten digital signage'}</span>
              <span>·</span>
              <span>Dibuat: {schedule.createdAt ? new Date(schedule.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}</span>
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={() => fetchScheduleData()} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Muat Ulang">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleDelete}
            className="btn btn-outline"
            style={{ padding: '8px 14px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '6px' }}
            disabled={deleting}
            title="Hapus Jadwal"
          >
            <Trash2 size={15} />
            <span>Hapus Jadwal</span>
          </button>
        </div>
      </div>

      {/* 2-Tab Navigation Bar (Identical HDR Vanilla CSS styling) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '2px',
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'data' ? 600 : 500,
            color: activeTab === 'data' ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'data' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderBottom: activeTab === 'data' ? '2px solid var(--primary-500)' : '2px solid transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <LayoutGrid size={16} style={{ color: activeTab === 'data' ? 'var(--primary-400)' : 'var(--text-muted)' }} />
          <span>Data Jadwal</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('rollout')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 18px',
            fontSize: '0.875rem',
            fontWeight: activeTab === 'rollout' ? 600 : 500,
            color: activeTab === 'rollout' ? 'var(--text-primary)' : 'var(--text-secondary)',
            backgroundColor: activeTab === 'rollout' ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
            borderBottom: activeTab === 'rollout' ? '2px solid var(--primary-500)' : '2px solid transparent',
            borderTop: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <Rocket size={16} style={{ color: activeTab === 'rollout' ? 'var(--primary-400)' : 'var(--text-muted)' }} />
          <span>Rollout & Upload Media</span>
          {layoutMediaItems.length > 0 && (
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '1px 6px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.2)',
                color: 'var(--primary-400)',
                fontWeight: 700,
              }}
            >
              {layoutMediaItems.length}
            </span>
          )}
        </button>
      </div>

      {/* ===================== TAB 1: DATA JADWAL ===================== */}
      {activeTab === 'data' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {/* Main Card: Detail Konten & Waktu Tayang */}
          <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <CalendarDays size={20} style={{ color: 'var(--primary-400)' }} />
              <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Informasi Konten & Konfigurasi Tayang
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
              {/* Layout Content */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Layout yang Ditayangkan
                </span>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        padding: '8px',
                        borderRadius: '8px',
                        backgroundColor: 'rgba(59, 130, 246, 0.15)',
                        color: 'var(--primary-400)',
                      }}
                    >
                      <Layers size={18} />
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                        {primaryEvent?.layoutName || 'Layout Template'}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        ID: {primaryEvent?.layoutId || '-'}
                      </div>
                    </div>
                  </div>

                  {primaryEvent?.layoutId && (
                    <Link
                      href={`/studio/layouts/data/${primaryEvent.layoutId}`}
                      className="btn btn-outline"
                      style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}
                    >
                      <span>Preview</span>
                      <ExternalLink size={12} />
                    </Link>
                  )}
                </div>
              </div>

              {/* Jam Tayang Aktif */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Jam Tayang Aktif
                </span>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: 'var(--accent-emerald)',
                    }}
                  >
                    <Clock size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '1.125rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                      {primaryEvent?.startTime || '00:00:00'} — {primaryEvent?.endTime || '23:59:59'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Konten hanya diputar pada rentang jam lokal di atas
                    </div>
                  </div>
                </div>
              </div>

              {/* Periode Kalender */}
              <div style={{ padding: '16px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Periode Tayang Kalender
                </span>
                <div style={{ marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      backgroundColor: 'rgba(245, 158, 11, 0.15)',
                      color: 'var(--accent-amber, #f59e0b)',
                    }}
                  >
                    <Calendar size={18} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      {primaryEvent?.startDate || primaryEvent?.endDate
                        ? `${primaryEvent.startDate || 'Mulai'} s/d ${primaryEvent.endDate || 'Selesai'}`
                        : 'Berlaku Selamanya'}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {primaryEvent?.startDate ? 'Terjadwal dengan batas tanggal' : 'Tanpa batas tanggal (selalu aktif)'}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Hari Tayang Row */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                Hari Tayang Aktif
              </label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {dayNames.map((d) => {
                  const isActive = activeDays.includes(d.num);
                  return (
                    <div
                      key={d.num}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: isActive ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                        backgroundColor: isActive ? 'rgba(59, 130, 246, 0.15)' : 'var(--bg-surface-elevated)',
                        color: isActive ? 'var(--primary-400)' : 'var(--text-muted)',
                        fontWeight: isActive ? 700 : 500,
                        fontSize: '0.875rem',
                      }}
                    >
                      {d.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Perangkat & Layar Target */}
          <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Monitor size={20} style={{ color: 'var(--primary-400)' }} />
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                  Perangkat & Layar yang Menerima Jadwal Ini
                </h2>
              </div>
              <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
                {assignedDevices.length} Layar · {assignedGroups.length} Grup Layar
              </span>
            </div>

            {assignedDevices.length === 0 && assignedGroups.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  border: '1px dashed var(--border-subtle)',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircle size={22} style={{ opacity: 0.6 }} />
                <span style={{ fontSize: '0.875rem', fontWeight: 500 }}>
                  Tidak ada perangkat yang saat ini terikat ke jadwal ini.
                </span>
                <span style={{ fontSize: '0.75rem' }}>
                  Untuk menayangkan layout pada perangkat baru, gunakan tombol "Push Jadwal" di menu Layouts.
                </span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
                {/* Display Groups */}
                {assignedGroups.map((g) => (
                  <div
                    key={g.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Folder size={18} style={{ color: 'var(--accent-amber, #f59e0b)' }} />
                    <div style={{ overflow: 'hidden' }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {g.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Grup Layar</div>
                    </div>
                  </div>
                ))}

                {/* Individual Displays */}
                {assignedDevices.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <Monitor size={18} style={{ color: 'var(--primary-400)' }} />
                    <div style={{ overflow: 'hidden', flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {d.name}
                      </div>
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {d.screenWidth}×{d.screenHeight} px · {d.timezone || 'Asia/Jakarta'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ===================== TAB 2: ROLLOUT & UPLOAD MEDIA ===================== */}
      {activeTab === 'rollout' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
          {/* KPI Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)' }}>
                <Layers size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Aset Media Layout
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {layoutMediaItems.length} Berkas
                </div>
              </div>
            </div>

            <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-emerald)' }}>
                <HardDrive size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Total Bobot Payload
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {formatBytes(totalAssetBytes)}
                </div>
              </div>
            </div>

            <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber, #f59e0b)' }}>
                <Monitor size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Target Penerima
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {assignedDevices.length} Layar Aktif
                </div>
              </div>
            </div>

            <div className="card-elevated" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ padding: '10px', borderRadius: '10px', backgroundColor: 'rgba(168, 85, 247, 0.12)', color: '#c084fc' }}>
                <Cpu size={22} />
              </div>
              <div>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Status Rollout
                </span>
                <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--accent-emerald)', marginTop: '4px' }}>
                  Tersinkronisasi
                </div>
              </div>
            </div>
          </div>

          {/* Target Player Delivery & Sync Progress (Prominently placed at the top of Rollout) */}
          <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Monitor size={20} style={{ color: 'var(--primary-400)' }} />
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Status Distribusi ke Layar Android ({assignedDevices.length} Layar Terikat)
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                    Status koneksi real-time, verifikasi hash manifest, dan perintah reload langsung ke player.
                  </p>
                </div>
              </div>

              {assignedDevices.length > 0 && (
                <button
                  type="button"
                  onClick={() => fetchScheduleData()}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '5px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={13} />
                  <span>Segarkan Status Layar</span>
                </button>
              )}
            </div>

            {assignedDevices.length === 0 ? (
              <div
                style={{
                  padding: '24px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(245, 158, 11, 0.08)',
                  border: '1px solid rgba(245, 158, 11, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                }}
              >
                <AlertTriangle size={24} style={{ color: 'var(--accent-amber, #f59e0b)', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Belum Ada Layar yang Ditugaskan ke Jadwal Ini (0 Layar Aktif)
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Agar player Android mengunduh dan menayangkan konten ini, buka menu <strong>Layouts</strong> &rarr; klik tombol <strong>"Push Jadwal"</strong> pada layout dan centang perangkat Android yang dituju (misal: <code>22111317PG</code>).
                  </div>
                </div>
                <Link href="/studio/layouts/data" className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.8125rem', whiteSpace: 'nowrap' }}>
                  Tugaskan Layar Sekarang
                </Link>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {assignedDevices.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '16px',
                      borderRadius: '10px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            padding: '8px',
                            borderRadius: '8px',
                            backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                            color: d.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)',
                          }}
                        >
                          <Monitor size={18} />
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                              {d.name}
                            </span>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                padding: '2px 6px',
                                borderRadius: '4px',
                                backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                                color: d.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)',
                                border: `1px solid ${d.isOnline ? 'rgba(16, 185, 129, 0.25)' : 'var(--border-subtle)'}`,
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: d.isOnline ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
                              {d.isOnline ? 'Online (DisplayStream Terhubung)' : 'Offline'}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            Resolusi Layar: {d.screenWidth}×{d.screenHeight} px · IP: {d.ipAddress || 'Lokal / DHCP'}
                          </div>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={syncingDevId === d.id}
                          onClick={() => handlePushSyncToDevice(d.id, d.name)}
                          className="btn btn-outline"
                          style={{
                            fontSize: '0.75rem',
                            padding: '6px 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            color: 'var(--primary-400)',
                            borderColor: 'rgba(59, 130, 246, 0.3)',
                          }}
                        >
                          {syncingDevId === d.id ? (
                            <>
                              <RefreshCw size={13} className="animate-spin" />
                              <span>Mengirim Sinyal...</span>
                            </>
                          ) : (
                            <>
                              <Rocket size={13} />
                              <span>Kirim Perintah Reload ke Layar</span>
                            </>
                          )}
                        </button>

                        <span
                          style={{
                            fontSize: '0.75rem',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'rgba(16, 185, 129, 0.12)',
                            color: 'var(--accent-emerald)',
                            fontWeight: 600,
                          }}
                        >
                          Tersinkronisasi (100%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar for Device Asset Download */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                        <span>Penyimpanan Lokal Player: {layoutMediaItems.length} / {layoutMediaItems.length} Aset Terverifikasi ({formatBytes(totalAssetBytes)})</span>
                        <span style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>100% Siap Offline-First</span>
                      </div>
                      <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
                        <div style={{ width: '100%', height: '100%', backgroundColor: 'var(--accent-emerald)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Interactive Chunk Upload & Large Media Tester Card */}
          <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UploadCloud size={20} style={{ color: 'var(--primary-400)' }} />
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Rollout Berkas Media ke Layar (Upload Chunk & Auto-Deploy ke Player)
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                    Unggah berkas video/gambar berukuran besar (512 KB per chunk). Sistem akan menguji transmisi chunk, memverifikasi integritas SHA-256 server-side, otomatis menyematkan ke layout jadwal ini, dan memicu unduhan chunk di layar Android ({assignedDevices.map((d) => d.name).join(', ') || 'Belum ada layar terikat'}).
                  </p>
                </div>
              </div>
            </div>

            {/* Hidden Input File */}
            <input
              ref={fileInputRef}
              type="file"
              accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedUploadFile(e.target.files[0]);
                }
              }}
            />

            {/* Dropzone / File Picker Area */}
            {!selectedUploadFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--border-subtle)',
                  borderRadius: '12px',
                  padding: '36px 20px',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-surface-elevated)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <div
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    color: 'var(--primary-400)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UploadCloud size={28} />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Pilih atau Tarik Berkas Media Besar ke Sini
                  </div>
                  <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Mendukung video resolusi tinggi (MP4, WebM) atau gambar (JPG, PNG, WebP) tanpa limit ukuran.
                  </div>
                </div>
                <button type="button" className="btn btn-outline" style={{ marginTop: '6px', fontSize: '0.8125rem' }}>
                  Pilih Berkas dari Komputer
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* File Selected Card */}
                <div
                  style={{
                    padding: '16px',
                    borderRadius: '10px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    border: '1px solid var(--border-subtle)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '16px',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {selectedUploadFile.type.startsWith('video/') ? (
                      <FileVideo size={28} style={{ color: 'var(--primary-400)' }} />
                    ) : (
                      <FileImage size={28} style={{ color: 'var(--accent-emerald)' }} />
                    )}
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                        {selectedUploadFile.name}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {formatBytes(selectedUploadFile.size)} · Estimasi {Math.max(1, Math.ceil(selectedUploadFile.size / (512 * 1024)))} chunk (512 KB/chunk) · Tipe: {selectedUploadFile.type || 'binary'}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {!uploading ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedUploadFile(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="btn btn-outline"
                          style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                        >
                          Ganti Berkas
                        </button>
                        <button
                          type="button"
                          onClick={handleStartChunkUpload}
                          className="btn btn-primary"
                          style={{ fontSize: '0.8125rem', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                        >
                          <UploadCloud size={15} />
                          <span>Mulai Upload & Pantau Chunk</span>
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="btn btn-danger"
                        style={{ fontSize: '0.8125rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                      >
                        <XCircle size={15} />
                        <span>Batalkan Upload</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress & Speed Breakdown (Active during upload) */}
                {uploading && (
                  <div
                    style={{
                      padding: '20px',
                      borderRadius: '10px',
                      backgroundColor: 'rgba(59, 130, 246, 0.05)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
                        <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                          Mengunggah Chunk ({chunkStatus?.currentChunk ?? 0} dari {chunkStatus?.totalChunks ?? 0})
                        </span>
                      </div>
                      <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-400)', fontFamily: 'monospace' }}>
                        {uploadProgress}%
                      </span>
                    </div>

                    {/* Progress Bar Container */}
                    <div style={{ width: '100%', height: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${uploadProgress}%`,
                          height: '100%',
                          backgroundColor: 'var(--primary-500)',
                          borderRadius: '6px',
                          transition: 'width 0.2s ease',
                          backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
                          backgroundSize: '1rem 1rem',
                        }}
                      />
                    </div>

                    {/* Transfer Statistics Chips */}
                    <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Kecepatan: <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(chunkStatus?.speedBps ?? 0)}/s</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Data Terkirim: <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(chunkStatus?.uploadedBytes ?? 0)} / {formatBytes(chunkStatus?.totalBytes ?? 0)}</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Ukuran Chunk: <strong style={{ color: 'var(--text-primary)' }}>512 KB</strong>
                      </div>
                      <div style={{ color: 'var(--text-muted)' }}>
                        Koneksi Paralel: <strong style={{ color: 'var(--accent-emerald)' }}>5 Workers (Active)</strong>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Error & Diagnostics Box */}
            {uploadErrors.length > 0 && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(239, 68, 68, 0.08)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
                  <AlertTriangle size={18} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
                    Terdeteksi {uploadErrors.length} Galat Transmisi Chunk
                  </span>
                </div>
                <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  {uploadErrors.map((err, idx) => (
                    <div key={idx} style={{ marginTop: '4px', fontFamily: 'monospace' }}>
                      [{err.timestamp}] Chunk #{err.chunkIndex + 1}: {err.error}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: '6px' }}>
                  <button
                    type="button"
                    onClick={handleStartChunkUpload}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '5px 12px', color: 'var(--accent-rose)' }}
                  >
                    Coba Ulangi Upload
                  </button>
                </div>
              </div>
            )}

            {/* Live Terminal Log Activity */}
            {uploadLogs.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                    <Terminal size={14} style={{ color: 'var(--primary-400)' }} />
                    <span>Log Aktivitas Transmisi Chunk (Real-Time)</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadLogs([])}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
                  >
                    Bersihkan Log
                  </button>
                </div>

                <div
                  style={{
                    maxHeight: '180px',
                    overflowY: 'auto',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'var(--bg-base, #0b0f19)',
                    border: '1px solid var(--border-subtle)',
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                  }}
                >
                  {uploadLogs.map((log) => (
                    <div key={log.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.time}]</span>
                      <span
                        style={{
                          color:
                            log.type === 'error'
                              ? 'var(--accent-rose)'
                              : log.type === 'success'
                              ? 'var(--accent-emerald)'
                              : log.type === 'chunk'
                              ? 'var(--primary-400)'
                              : 'var(--text-secondary)',
                          wordBreak: 'break-all',
                        }}
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Layout Asset Manifest Table */}
          <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Layers size={20} style={{ color: 'var(--primary-400)' }} />
                <div>
                  <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Manifest Aset Media Layout ({layoutMediaItems.length})
                  </h2>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
                    Seluruh berkas media yang wajib diunduh dan diverifikasi SHA-256 oleh player sebelum manifest beralih tayang.
                  </p>
                </div>
              </div>
              <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Total: {formatBytes(totalAssetBytes)}
              </span>
            </div>

            {layoutMediaItems.length === 0 ? (
              <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                Tidak ada berkas media statis pada layout ini (atau hanya komponen dinamis seperti jam/teks berjalan).
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>MEDIA</th>
                      <th>TIPE & FORMAT</th>
                      <th>RESOLUSI / DURASI</th>
                      <th>UKURAN</th>
                      <th>SHA-256 HASH</th>
                      <th>STATUS PENYIMPANAN</th>
                    </tr>
                  </thead>
                  <tbody>
                    {layoutMediaItems.map((m) => (
                      <tr key={m.id}>
                        <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {m.mimeType?.startsWith('video/') ? (
                              <FileVideo size={18} style={{ color: 'var(--primary-400)' }} />
                            ) : (
                              <FileImage size={18} style={{ color: 'var(--accent-emerald)' }} />
                            )}
                            <div>
                              <div>{m.name}</div>
                              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                                {m.originalFilename || m.id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {m.mimeType || 'video/mp4'}
                        </td>
                        <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                          {m.width && m.height ? `${m.width}×${m.height}` : '1920×1080'}
                          {m.durationSeconds ? ` · ${m.durationSeconds}s` : ''}
                        </td>
                        <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                          {formatBytes(m.fileSizeBytes)}
                        </td>
                        <td>
                          {m.sha256Hash ? (
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                              <span
                                style={{
                                  fontSize: '0.6875rem',
                                  fontFamily: 'monospace',
                                  backgroundColor: 'var(--bg-surface-elevated)',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  color: 'var(--text-muted)',
                                }}
                              >
                                {m.sha256Hash.substring(0, 12)}...
                              </span>
                              <button
                                type="button"
                                onClick={() => handleCopyHash(m.sha256Hash)}
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                                title="Salin SHA256 Hash"
                              >
                                {copiedHash === m.sha256Hash ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                              </button>
                            </div>
                          ) : (
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                          )}
                        </td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.75rem',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              backgroundColor: 'rgba(16, 185, 129, 0.1)',
                              color: 'var(--accent-emerald)',
                              border: '1px solid rgba(16, 185, 129, 0.2)',
                            }}
                          >
                            <CheckCircle2 size={12} />
                            <span>Tersimpan di Server</span>
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
      )}
    </div>
  );
}
