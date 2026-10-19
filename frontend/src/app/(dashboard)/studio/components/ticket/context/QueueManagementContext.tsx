'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  QueueDisplayConfig,
  QueueCallHistoryItem,
  QueueSector,
  DEFAULT_QUEUES,
  QUEUE_STORAGE_KEY,
  QUEUE_HISTORY_STORAGE_KEY,
  QueueAudio,
  QueueCounter,
} from '../types';
import { modal } from '@/components/ui/ModalDialog';
import { listQueueDisplays, deleteQueueDisplay, listQueueSectors } from '@/lib/services/studio/queue.service';

interface QueueManagementContextType {
  queues: QueueDisplayConfig[];
  setQueues: React.Dispatch<React.SetStateAction<QueueDisplayConfig[]>>;
  loading: boolean;
  sectors: QueueSector[];
  callHistory: QueueCallHistoryItem[];
  search: string;
  setSearch: (s: string) => void;
  page: number;
  setPage: (p: number) => void;
  limit: number;
  setLimit: (l: number) => void;
  refreshQueues: () => Promise<void>;
  handleDeleteQueue: (id: string, name: string) => Promise<void>;
  clearHistory: () => Promise<void>;
}

const QueueManagementContext = createContext<QueueManagementContextType | undefined>(undefined);

export function useQueueManagement() {
  const ctx = useContext(QueueManagementContext);
  if (!ctx) {
    throw new Error('useQueueManagement must be used within QueueManagementProvider');
  }
  return ctx;
}

export function QueueManagementProvider({ children }: { children: React.ReactNode }) {
  const [queues, setQueues] = useState<QueueDisplayConfig[]>(DEFAULT_QUEUES);
  const [loading, setLoading] = useState(true);
  const [sectors, setSectors] = useState<QueueSector[]>([]);
  const [callHistory, setCallHistory] = useState<QueueCallHistoryItem[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  // Load call history from localStorage
  useEffect(() => {
    try {
      const storedHistory = localStorage.getItem(QUEUE_HISTORY_STORAGE_KEY);
      if (storedHistory) {
        setCallHistory(JSON.parse(storedHistory));
      }
    } catch {}
  }, []);

  // Fetch available sector types from backend table queue_sectors
  useEffect(() => {
    listQueueSectors()
      .then((res) => {
        if (res && res.sectorsList && Array.isArray(res.sectorsList)) {
          setSectors(res.sectorsList);
        } else if (res && res.sectors && Array.isArray(res.sectors)) {
          setSectors(res.sectors);
        }
      })
      .catch(() => {});
  }, []);

  // Refresh and sync queue displays from backend
  const refreshQueues = useCallback(async () => {
    try {
      const res = await listQueueDisplays(search);
      if (res && res.itemsList && Array.isArray(res.itemsList)) {
        const mapped = res.itemsList.map((b: any) => {
          const mappedAudios: QueueAudio[] = (b.audiosList || b.audios || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            audioType: a.audioType || 'media_item',
            mediaItemId: a.mediaItemId,
            fileUrl: a.fileUrl || (a.mediaItemId ? `/api/assets/${a.mediaItemId}` : undefined),
            volumePercent: a.volumePercent ?? 100,
            isActive: a.isActive !== false,
          }));

          const mappedCounters: QueueCounter[] = (b.countersList || b.counters || []).map((c: any) => ({
            id: c.id,
            counterNumber: c.counterNumber,
            counterName: c.counterName,
            operatorName: c.operatorName,
            isActive: c.isActive !== false,
            status: c.status || 'ACTIVE',
            statusNote: c.statusNote || '',
            currentTicketNumber: c.currentTicketNumber || '',
            lastCalledAt: c.lastCalledAt || '',
          }));

          return {
            id: b.id,
            name: b.name,
            prefix: b.prefix || 'A',
            currentNumber: b.latestCalledNumber || `${b.prefix || 'A'}-001`,
            currentCounter: mappedCounters[0]?.counterName || 'LOKET 01',
            audioChimeEnabled: true,
            marqueeText: `PENGUMUMAN: Silakan menuju ${mappedCounters[0]?.counterName || 'LOKET 01'} saat nomor dipanggil.`,
            canvasWidth: b.canvasWidth || 1920,
            canvasHeight: b.canvasHeight || 1080,
            backgroundColor: b.backgroundColor || '#0f172a',
            backgroundImageUrl: b.backgroundImageUrl || '',
            themePreset: b.themePreset || 'clean-light',
            autoRecallEnabled: !!b.autoRecallEnabled,
            sectorType: b.sectorType || 'RETAIL_FB',
            ticketLabel: b.ticketLabel || 'Nomor Pesanan',
            counterLabel: b.counterLabel || 'Pickup Point',
            ttsTemplateCall: b.ttsTemplateCall,
            ttsTemplateRecall: b.ttsTemplateRecall,
            ttsTemplateBreak: b.ttsTemplateBreak,
            currentSequence: b.currentSequence || 0,
            items: b.itemsList || [],
            counters: mappedCounters,
            audios: mappedAudios,
          } as QueueDisplayConfig;
        });

        setQueues(mapped);
        try {
          localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(mapped));
        } catch {}
      }
    } catch (e) {
      console.warn('Failed to fetch queue displays from backend:', e);
      try {
        const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
        if (stored) setQueues(JSON.parse(stored));
      } catch {}
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    refreshQueues();
  }, [refreshQueues]);

  const handleDeleteQueue = useCallback(async (id: string, name: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Antrian',
      message: `Hapus layar antrian "${name}"? Tindakan ini akan menghapus antrian dari database server.`,
      variant: 'danger',
      confirmText: 'Hapus Antrian',
    });
    if (!ok) return;

    try {
      await deleteQueueDisplay(id);
      setQueues((prev) => {
        const updated = prev.filter((q) => q.id !== id);
        try {
          localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
        } catch {}
        return updated;
      });
      await refreshQueues();
      await modal.alert({
        title: 'Berhasil Dihapus',
        message: `Layar antrian "${name}" berhasil dihapus dari server.`,
        variant: 'success',
      });
    } catch (e: any) {
      await modal.alert({
        title: 'Gagal Menghapus',
        message: e?.message || 'Terjadi kesalahan saat menghapus antrian dari server.',
        variant: 'danger',
      });
    }
  }, [refreshQueues]);

  const clearHistory = useCallback(async () => {
    const ok = await modal.confirm({
      title: 'Bersihkan Riwayat',
      message: 'Hapus seluruh catatan riwayat panggilan antrian?',
      variant: 'danger',
      confirmText: 'Bersihkan',
    });
    if (!ok) return;
    setCallHistory([]);
    try {
      localStorage.removeItem(QUEUE_HISTORY_STORAGE_KEY);
    } catch {}
  }, []);

  return (
    <QueueManagementContext.Provider
      value={{
        queues,
        setQueues,
        loading,
        sectors,
        callHistory,
        search,
        setSearch,
        page,
        setPage,
        limit,
        setLimit,
        refreshQueues,
        handleDeleteQueue,
        clearHistory,
      }}
    >
      {children}
    </QueueManagementContext.Provider>
  );
}
