'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  QueueDisplayConfig,
  QueueLayoutItem,
  QueueCounter,
  QueueAudio,
  QueueSector,
  QUEUE_STORAGE_KEY,
  DEFAULT_QUEUES,
  createDefaultQueueLayoutItems,
} from '../types';
import { modal } from '@/components/ui/ModalDialog';
import { createQueueDisplay, updateQueueDisplay, getQueueDisplay, listQueueSectors } from '@/lib/services/studio/queue.service';

interface SimulatorState {
  currentSeq: number;
  currentNumber: string;
  currentCounter: string;
  isChiming: boolean;
}

interface QueueEditorContextType {
  queue: QueueDisplayConfig;
  setQueue: React.Dispatch<React.SetStateAction<QueueDisplayConfig>>;
  sectors: QueueSector[];
  selectSector: (sectorId: string) => void;
  isNew: boolean;
  loading: boolean;
  saving: boolean;
  simulator: SimulatorState;
  setSimulator: React.Dispatch<React.SetStateAction<SimulatorState>>;
  callNextTicket: () => void;
  triggerChime: () => void;
  updateField: <K extends keyof QueueDisplayConfig>(field: K, value: QueueDisplayConfig[K]) => void;
  updateLayoutItem: (itemId: string, patch: Partial<QueueLayoutItem>) => void;
  addCounter: (data?: Partial<QueueCounter>) => void;
  removeCounter: (counterId: string) => void;
  updateCounter: (counterId: string, patch: Partial<QueueCounter>) => void;
  updateAudio: (patch: Partial<QueueAudio>) => void;
  applyThemePreset: (preset: 'clean-light' | 'solid-dark' | 'medical-green' | 'executive-blue') => void;
  saveQueue: () => Promise<void>;
}

const QueueEditorContext = createContext<QueueEditorContextType | undefined>(undefined);

export function useQueueEditor() {
  const ctx = useContext(QueueEditorContext);
  if (!ctx) {
    throw new Error('useQueueEditor must be used within QueueEditorProvider');
  }
  return ctx;
}

function playDingDongChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.4);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 1.4);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

export function QueueEditorProvider({
  children,
  initialId,
  isNew = false,
}: {
  children: React.ReactNode;
  initialId?: string;
  isNew?: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [sectors, setSectors] = useState<QueueSector[]>([]);

  // Load available sector types dynamically from backend database table queue_sectors
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

  const [queue, setQueue] = useState<QueueDisplayConfig>(() => {
    const defaultItems = createDefaultQueueLayoutItems('clean-light');
    const defaultCounters: QueueCounter[] = [
      { id: 'cnt-1', counterNumber: 1, counterName: 'LOKET 01', operatorName: 'Petugas 1', isActive: true },
      { id: 'cnt-2', counterNumber: 2, counterName: 'LOKET 02', operatorName: 'Petugas 2', isActive: true },
    ];
    const defaultAudios: QueueAudio[] = [
      { id: 'aud-1', name: 'Chime Klasik (Ding-Dong)', audioType: 'preset', volumePercent: 80, isActive: true },
    ];

    return {
      id: initialId || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `queue-${Date.now()}`),
      name: isNew ? 'Layar Antrian Baru' : '',
      prefix: 'A',
      currentNumber: 'A-001',
      currentCounter: 'LOKET 01',
      audioChimeEnabled: true,
      marqueeText: 'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil.',
      canvasWidth: 1920,
      canvasHeight: 1080,
      backgroundColor: '#f8fafc',
      themePreset: 'clean-light',
      autoRecallEnabled: false,
      sectorType: 'RETAIL_FB',
      ticketLabel: 'Nomor Pesanan',
      counterLabel: 'Pickup Point',
      items: defaultItems,
      counters: defaultCounters,
      audios: defaultAudios,
    };
  });

  const [simulator, setSimulator] = useState<SimulatorState>({
    currentSeq: 1,
    currentNumber: 'A-001',
    currentCounter: 'LOKET 01',
    isChiming: false,
  });

  const selectSector = useCallback((sectorId: string) => {
    const sec = sectors.find((s) => s.id === sectorId);
    if (!sec) return;
    const newCounterLabel = sec.counterLabel || 'Loket';
    const newCounterPrefix = newCounterLabel.toUpperCase();

    setQueue((prev) => {
      const updatedCounters = (prev.counters || []).map((c, idx) => {
        const num = c.counterNumber || idx + 1;
        const numStr = String(num).padStart(2, '0');
        return {
          ...c,
          counterName: `${newCounterPrefix} ${numStr}`,
        };
      });

      const updatedCurrentCounter = updatedCounters[0]?.counterName || `${newCounterPrefix} 01`;

      const updatedItems = (prev.items || []).map((it) => {
        if (it.itemType === 'counter_loket' || it.name.toLowerCase().includes('badge') || it.name.toLowerCase().includes('label loket')) {
          return {
            ...it,
            name: `Badge ${newCounterLabel}`,
          };
        }
        return it;
      });

      return {
        ...prev,
        sectorType: sec.id,
        ticketLabel: sec.ticketLabel,
        counterLabel: sec.counterLabel,
        ttsTemplateCall: sec.ttsTemplateCall,
        ttsTemplateRecall: sec.ttsTemplateRecall,
        ttsTemplateBreak: sec.ttsTemplateBreak,
        currentCounter: updatedCurrentCounter,
        counters: updatedCounters,
        items: updatedItems,
      };
    });

    setSimulator((prev) => ({
      ...prev,
      currentCounter: `${newCounterPrefix} 01`,
    }));
  }, [sectors]);

  // Load existing queue if editing
  useEffect(() => {
    if (isNew || !initialId) return;

    let isMounted = true;

    // Load from backend first, with localStorage as fallback
    getQueueDisplay(initialId)
      .then((res) => {
        if (!isMounted) return;
        if (res && res.id) {
          const mappedAudios: QueueAudio[] = (res.audiosList || res.audios || []).map((a: any) => ({
            id: a.id,
            name: a.name,
            audioType: a.audioType || 'media_item',
            mediaItemId: a.mediaItemId,
            fileUrl: a.fileUrl || (a.mediaItemId ? `/api/assets/${a.mediaItemId}` : undefined),
            volumePercent: a.volumePercent ?? 100,
            isActive: a.isActive !== false,
          }));

          const mappedCounters: QueueCounter[] = (res.countersList || res.counters || []).map((c: any) => ({
            id: c.id,
            counterNumber: c.counterNumber,
            counterName: c.counterName,
            operatorName: c.operatorName,
            isActive: c.isActive !== false,
            status: c.status || 'ACTIVE',
            statusNote: c.statusNote || '',
          }));

          const rawItems = res.itemsList && res.itemsList.length > 0
            ? res.itemsList
            : createDefaultQueueLayoutItems(res.themePreset || 'clean-light');

          const sanitizedItems = rawItems.map((it: any) => {
            if ((it.itemType === 'ticket_number' || it.itemType === 'text_label') && (it.backgroundColor === '#ffffff' || it.backgroundColor === '#0f172a' || !it.backgroundColor)) {
              return { ...it, backgroundColor: 'transparent' };
            }
            return it;
          });

          const activeCounter = mappedCounters[0]?.counterName || 'LOKET 01';
          const activeNumber = res.latestCalledNumber || `${res.prefix || 'A'}-001`;
          const numPart = parseInt(activeNumber.replace(/[^0-9]/g, ''), 10) || 1;

          setQueue({
            id: res.id,
            name: res.name || 'Layar Antrian',
            prefix: res.prefix || 'A',
            canvasWidth: res.canvasWidth || 1920,
            canvasHeight: res.canvasHeight || 1080,
            backgroundColor: res.backgroundColor || '#f8fafc',
            backgroundImageUrl: res.backgroundImageUrl || '',
            themePreset: res.themePreset || 'clean-light',
            autoRecallEnabled: !!res.autoRecallEnabled,
            sectorType: res.sectorType || 'RETAIL_FB',
            ticketLabel: res.ticketLabel || 'Nomor Pesanan',
            counterLabel: res.counterLabel || 'Pickup Point',
            ttsTemplateCall: res.ttsTemplateCall,
            ttsTemplateRecall: res.ttsTemplateRecall,
            ttsTemplateBreak: res.ttsTemplateBreak,
            currentSequence: res.currentSequence || 0,
            items: sanitizedItems,
            counters: mappedCounters.length > 0 ? mappedCounters : [
              { id: 'cnt-1', counterNumber: 1, counterName: `${res.counterLabel || 'LOKET'} 01`.toUpperCase(), operatorName: 'Petugas 1', isActive: true }
            ],
            audios: mappedAudios.length > 0 ? mappedAudios : [
              { id: 'aud-1', name: 'Chime Klasik (Ding-Dong)', audioType: 'preset', volumePercent: 80, isActive: true },
            ],
            audioChimeEnabled: true,
            marqueeText: res.marqueeText || 'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil.',
            currentNumber: activeNumber,
            currentCounter: activeCounter,
          });

          setSimulator({
            currentSeq: numPart,
            currentNumber: activeNumber,
            currentCounter: activeCounter,
            isChiming: false,
          });
          setLoading(false);
          return;
        }

        // Fallback to local storage if backend returned empty
        fallbackToLocalStorage();
      })
      .catch(() => {
        if (!isMounted) return;
        fallbackToLocalStorage();
      });

    function fallbackToLocalStorage() {
      try {
        const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
        const items: QueueDisplayConfig[] = stored ? JSON.parse(stored) : DEFAULT_QUEUES;
        const found = items.find((q) => q.id === initialId);

        if (found) {
          setQueue(found);
          const numPart = parseInt((found.currentNumber || 'A-001').replace(/[^0-9]/g, ''), 10) || 1;
          setSimulator({
            currentSeq: numPart,
            currentNumber: found.currentNumber || 'A-001',
            currentCounter: found.currentCounter || 'LOKET 01',
            isChiming: false,
          });
          setLoading(false);
        } else {
          modal.alert({
            title: 'Tidak Ditemukan',
            message: 'Layar antrian tidak ditemukan di server maupun penyimpanan lokal.',
            variant: 'warning',
          });
          router.push('/studio/components/ticket');
        }
      } catch {
        router.push('/studio/components/ticket');
      }
    }

    return () => {
      isMounted = false;
    };
  }, [initialId, isNew, router]);

  const updateField = useCallback(<K extends keyof QueueDisplayConfig>(field: K, value: QueueDisplayConfig[K]) => {
    setQueue((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateLayoutItem = useCallback((itemId: string, patch: Partial<QueueLayoutItem>) => {
    setQueue((prev) => ({
      ...prev,
      items: prev.items.map((it) => (it.id === itemId ? { ...it, ...patch } : it)),
    }));
  }, []);

  const addCounter = useCallback((data?: Partial<QueueCounter>) => {
    setQueue((prev) => {
      const nextNum = prev.counters.length + 1;
      const newCounter: QueueCounter = {
        id: `cnt-${Date.now()}-${nextNum}`,
        counterNumber: nextNum,
        counterName: `LOKET ${String(nextNum).padStart(2, '0')}`,
        operatorName: `Petugas ${nextNum}`,
        isActive: true,
        ...data,
      };
      return { ...prev, counters: [...prev.counters, newCounter] };
    });
  }, []);

  const removeCounter = useCallback((counterId: string) => {
    setQueue((prev) => {
      if (prev.counters.length <= 1) {
        modal.alert({
          title: 'Loket Diperlukan',
          message: 'Minimal harus ada 1 loket pelayanan pada layar antrian.',
          variant: 'warning',
        });
        return prev;
      }
      return {
        ...prev,
        counters: prev.counters.filter((c) => c.id !== counterId),
      };
    });
  }, []);

  const updateCounter = useCallback((counterId: string, patch: Partial<QueueCounter>) => {
    setQueue((prev) => ({
      ...prev,
      counters: prev.counters.map((c) => (c.id === counterId ? { ...c, ...patch } : c)),
    }));
  }, []);

  const updateAudio = useCallback((patch: Partial<QueueAudio>) => {
    setQueue((prev) => {
      if (prev.audios.length === 0) {
        return {
          ...prev,
          audios: [{ id: 'aud-1', name: 'Custom Audio', audioType: 'media_item', volumePercent: 80, isActive: true, ...patch }],
        };
      }
      return {
        ...prev,
        audios: [{ ...prev.audios[0], ...patch }],
      };
    });
  }, []);

  const applyThemePreset = useCallback((preset: 'clean-light' | 'solid-dark' | 'medical-green' | 'executive-blue') => {
    let bg = '#f8fafc';
    let cardBg = '#ffffff';
    let textColor = '#0f172a';
    let primaryColor = '#0284c7';
    let marqueeBg = '#0369a1';
    let badgeBg = '#f59e0b';

    if (preset === 'solid-dark') {
      bg = '#020617';
      cardBg = '#0f172a';
      textColor = '#f8fafc';
      primaryColor = '#38bdf8';
      marqueeBg = '#020617';
      badgeBg = '#f59e0b';
    } else if (preset === 'medical-green') {
      bg = '#f0fdf4';
      cardBg = '#ffffff';
      textColor = '#064e3b';
      primaryColor = '#059669';
      marqueeBg = '#064e3b';
      badgeBg = '#10b981';
    } else if (preset === 'executive-blue') {
      bg = '#0f172a';
      cardBg = '#1e293b';
      textColor = '#f8fafc';
      primaryColor = '#60a5fa';
      marqueeBg = '#0f172a';
      badgeBg = '#3b82f6';
    }

    setQueue((prev) => ({
      ...prev,
      themePreset: preset,
      backgroundColor: bg,
      items: prev.items.map((it) => {
        if (it.itemType === 'ticket_number') {
          return {
            ...it,
            textColor: primaryColor,
            backgroundColor: it.backgroundColor && it.backgroundColor !== '#ffffff' && it.backgroundColor !== '#0f172a' && it.backgroundColor !== '#1e293b' ? it.backgroundColor : 'transparent',
          };
        }
        if (it.itemType === 'counter_loket') {
          return { ...it, backgroundColor: badgeBg, textColor: '#ffffff' };
        }
        if (it.itemType === 'marquee') {
          return { ...it, backgroundColor: marqueeBg, textColor: '#ffffff' };
        }
        if (it.itemType === 'text_label') {
          return {
            ...it,
            textColor: primaryColor,
            backgroundColor: it.backgroundColor && it.backgroundColor !== '#ffffff' && it.backgroundColor !== '#0f172a' && it.backgroundColor !== '#1e293b' ? it.backgroundColor : 'transparent',
          };
        }
        return it;
      }),
    }));
  }, []);

  const triggerChime = useCallback(() => {
    setSimulator((prev) => ({ ...prev, isChiming: true }));
    const audioConf = queue.audios?.find((a) => a.isActive !== false && (a.fileUrl || a.mediaItemId)) || queue.audios?.[0];
    const audioUrl = audioConf?.fileUrl || (audioConf?.mediaItemId ? `/api/assets/${audioConf.mediaItemId}` : null);
    if (audioUrl) {
      const customAud = new Audio(audioUrl);
      customAud.volume = (audioConf?.volumePercent || 80) / 100;
      customAud.play().catch(() => playDingDongChime());
      customAud.onended = () => {
        setSimulator((prev) => ({ ...prev, isChiming: false }));
      };
      setTimeout(() => {
        setSimulator((prev) => ({ ...prev, isChiming: false }));
      }, 3500);
    } else {
      playDingDongChime();
      setTimeout(() => {
        setSimulator((prev) => ({ ...prev, isChiming: false }));
      }, 1500);
    }
  }, [queue.audios]);

  const callNextTicket = useCallback(() => {
    setSimulator((prev) => {
      const nextSeq = prev.currentSeq + 1;
      const formatted = `${queue.prefix}-${String(nextSeq).padStart(3, '0')}`;
      return {
        ...prev,
        currentSeq: nextSeq,
        currentNumber: formatted,
      };
    });
    if (queue.audioChimeEnabled) {
      triggerChime();
    }
  }, [queue.prefix, queue.audioChimeEnabled, triggerChime]);

  const saveQueue = useCallback(async () => {
    if (!queue.name.trim()) {
      await modal.alert({
        title: 'Nama Diperlukan',
        message: 'Silakan isi nama komponen antrian terlebih dahulu.',
        variant: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      let items: QueueDisplayConfig[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(items)) items = [];

      const formattedAudios = (queue.audios || []).map((a) => ({
        ...a,
        isActive: queue.audioChimeEnabled ? (a.isActive ?? true) : false,
      }));

      const payload: QueueDisplayConfig = {
        ...queue,
        name: queue.name.trim(),
        currentNumber: simulator.currentNumber,
        currentCounter: simulator.currentCounter,
        audios: formattedAudios,
      };

      if (isNew) {
        items.unshift(payload);
        const res = await createQueueDisplay({
          name: payload.name,
          prefix: payload.prefix,
          canvasWidth: payload.canvasWidth,
          canvasHeight: payload.canvasHeight,
          backgroundColor: payload.backgroundColor,
          backgroundImageUrl: payload.backgroundImageUrl,
          themePreset: payload.themePreset,
          autoRecallEnabled: !!payload.autoRecallEnabled,
          sectorType: payload.sectorType || 'RETAIL_FB',
          ticketLabel: payload.ticketLabel || 'Nomor Pesanan',
          counterLabel: payload.counterLabel || 'Pickup Point',
          ttsTemplateCall: payload.ttsTemplateCall,
          ttsTemplateRecall: payload.ttsTemplateRecall,
          ttsTemplateBreak: payload.ttsTemplateBreak,
          items: payload.items,
          counters: payload.counters,
          audios: formattedAudios,
        });
        if (res && res.id) {
          payload.id = res.id;
        }
      } else {
        items = items.map((q) => (q.id === payload.id ? payload : q));
        await updateQueueDisplay(payload.id, {
          name: payload.name,
          prefix: payload.prefix,
          canvasWidth: payload.canvasWidth,
          canvasHeight: payload.canvasHeight,
          backgroundColor: payload.backgroundColor,
          backgroundImageUrl: payload.backgroundImageUrl,
          themePreset: payload.themePreset,
          autoRecallEnabled: !!payload.autoRecallEnabled,
          sectorType: payload.sectorType || 'RETAIL_FB',
          ticketLabel: payload.ticketLabel || 'Nomor Pesanan',
          counterLabel: payload.counterLabel || 'Pickup Point',
          ttsTemplateCall: payload.ttsTemplateCall,
          ttsTemplateRecall: payload.ttsTemplateRecall,
          ttsTemplateBreak: payload.ttsTemplateBreak,
          items: payload.items,
          counters: payload.counters,
          audios: formattedAudios,
        });
      }

      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(items));

      await modal.alert({
        title: 'Tersimpan',
        message: `Konfigurasi layar antrian "${payload.name}" berhasil disimpan ke server.`,
        variant: 'success',
      });

      router.push('/studio/components/ticket');
    } catch (e: any) {
      await modal.alert({
        title: 'Gagal Menyimpan',
        message: e?.message || 'Terjadi kesalahan saat menyimpan data ke server.',
        variant: 'danger',
      });
    } finally {
      setSaving(false);
    }
  }, [queue, isNew, simulator, router]);

  return (
    <QueueEditorContext.Provider
      value={{
        queue,
        setQueue,
        sectors,
        selectSector,
        isNew,
        loading,
        saving,
        simulator,
        setSimulator,
        callNextTicket,
        triggerChime,
        updateField,
        updateLayoutItem,
        addCounter,
        removeCounter,
        updateCounter,
        updateAudio,
        applyThemePreset,
        saveQueue,
      }}
    >
      {children}
    </QueueEditorContext.Provider>
  );
}
