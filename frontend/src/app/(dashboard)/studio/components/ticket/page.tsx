'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Ticket,
  Plus,
  Search,
  Edit,
  Trash2,
  Bell,
  Volume2,
  RotateCcw,
  Monitor,
  History,
  GripVertical,
  Clock,
  Radio,
  CheckCircle2,
  Tv,
  Undo2,
  Coffee,
  Lock,
  Unlock,
  Sliders,
  Settings2,
  Check,
  RefreshCw,
  X,
  Play,
  ShieldAlert,
  Sparkles,
} from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { modal } from '@/components/ui/ModalDialog';
import {
  QueueDisplayConfig,
  QueueAudio,
  QueueCounter,
  QUEUE_STORAGE_KEY,
  DEFAULT_QUEUES,
  QueueCallHistoryItem,
  QUEUE_HISTORY_STORAGE_KEY,
  speakQueueAnnouncement,
  stopQueueAnnouncement,
  speakCounterStatusAnnouncement,
  SECTOR_PRESETS,
  SectorPreset,
} from './types';
import { getDevices } from '@/lib/services/hardware/device.service';
import { Device } from '@/lib/services/hardware/types';
import {
  listQueueDisplays,
  callNextTicket,
  callPreviousTicket,
  resetQueue,
  setCounterStatus,
  updateQueueDisplay,
} from '@/lib/services/studio/queue.service';

const Marquee = 'marquee' as any;

// Audio chime generator using Web Audio API (Ding-Dong fallback)
function playDingDongChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Ding tone (880 Hz / A5)
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

    // Dong tone (587.33 Hz / D5) after 400ms
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

// Active audio and timeout tracking to prevent glitches when triggered rapidly
let activeChimeAudio: HTMLAudioElement | null = null;
let activeChimeTimer: any = null;

function playQueueCallAudio(
  queue: QueueDisplayConfig | null,
  ticketNumber: string,
  counterName: string,
  isRecall: boolean = false,
  onFinished?: () => void
) {
  // 1. Immediately halt any previous playing audio & speech synthesis
  if (activeChimeAudio) {
    try {
      activeChimeAudio.pause();
      activeChimeAudio.currentTime = 0;
    } catch (_) {}
    activeChimeAudio = null;
  }
  if (activeChimeTimer) {
    clearTimeout(activeChimeTimer);
    activeChimeTimer = null;
  }
  stopQueueAnnouncement();

  const triggerTTS = () => {
    speakQueueAnnouncement(ticketNumber, counterName, isRecall, onFinished, queue || undefined);
  };

  // Check if custom audio chime exists and is active
  const activeAudioConf = queue?.audios?.find(
    (a) => a.isActive !== false && (a.fileUrl || a.mediaItemId)
  );
  const audioUrl = activeAudioConf?.fileUrl || (activeAudioConf?.mediaItemId ? `/api/assets/${activeAudioConf.mediaItemId}` : null);

  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      activeChimeAudio = audio;
      const vol = (activeAudioConf?.volumePercent ?? 100) / 100;
      audio.volume = Math.max(0, Math.min(1, vol));

      audio.onended = () => {
        if (activeChimeAudio === audio) activeChimeAudio = null;
        triggerTTS();
      };
      audio.onerror = () => {
        if (activeChimeAudio === audio) activeChimeAudio = null;
        playDingDongChime();
        activeChimeTimer = setTimeout(triggerTTS, 1100);
      };

      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Custom audio playback failed, falling back to Ding-Dong:', err);
          playDingDongChime();
          activeChimeTimer = setTimeout(triggerTTS, 1100);
        });
      }
      return;
    } catch (e) {
      console.warn('Audio init error:', e);
    }
  }

  // Fallback to Web Audio Ding-Dong chime
  playDingDongChime();
  activeChimeTimer = setTimeout(triggerTTS, 1100);
}

export default function TicketPage() {
  const [queues, setQueues] = useState<QueueDisplayConfig[]>(DEFAULT_QUEUES);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [selectedQueueId, setSelectedQueueId] = useState<string>(DEFAULT_QUEUES[0]?.id || '');

  // Operator Calling Panel State
  const [isChiming, setIsChiming] = useState(false);
  const [devices, setDevices] = useState<Device[]>([]);
  const [targetDeviceId, setTargetDeviceId] = useState<string>('all');
  const [callHistory, setCallHistory] = useState<QueueCallHistoryItem[]>([]);

  // Draggable Split Divider State (Left Column ~68%, Right Column ~32%)
  const [leftWidthPercent, setLeftWidthPercent] = useState<number>(68);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const splitContainerRef = useRef<HTMLDivElement>(null);

  // Active selected queue
  const selectedQueue = queues.find((q) => q.id === selectedQueueId) || queues[0] || null;

  const queuesRef = useRef(queues);
  useEffect(() => {
    queuesRef.current = queues;
  }, [queues]);

  // Unique tab client ID & local call timestamp to ignore self-broadcast echoes
  const clientIdRef = useRef<string>(`client-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`);
  const lastLocalCallTimeRef = useRef<number>(0);

  // Initialize and load saved state from localStorage, and sync from backend
  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If previously only 1 queue was cached, merge second default queue if absent
          if (parsed.length === 1 && parsed[0].id === DEFAULT_QUEUES[0].id && DEFAULT_QUEUES.length > 1) {
            const merged = [parsed[0], DEFAULT_QUEUES[1]];
            setQueues(merged);
            setSelectedQueueId(merged[0].id);
            localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(merged));
          } else {
            setQueues(parsed);
            setSelectedQueueId(parsed[0].id);
          }
        }
      } else {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(DEFAULT_QUEUES));
        setSelectedQueueId(DEFAULT_QUEUES[0]?.id || '');
      }
    } catch {}

    // Sync latest queue definitions, custom audios, and counters from backend
    listQueueDisplays()
      .then((res) => {
        if (res && res.itemsList && Array.isArray(res.itemsList) && res.itemsList.length > 0) {
          setQueues((prevQueues) => {
            const backendMap = new Map(res.itemsList.map((b: any) => [b.id, b]));
            const updated = prevQueues.map((localQ) => {
              const b = backendMap.get(localQ.id) as any;
              if (!b) return localQ;

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
                ...localQ,
                name: b.name || localQ.name,
                prefix: b.prefix || localQ.prefix,
                backgroundColor: b.backgroundColor || localQ.backgroundColor,
                backgroundImageUrl: b.backgroundImageUrl || localQ.backgroundImageUrl,
                themePreset: b.themePreset || localQ.themePreset,
                autoRecallEnabled: b.autoRecallEnabled ?? localQ.autoRecallEnabled,
                sectorType: b.sectorType || localQ.sectorType || 'HOSPITAL',
                ticketLabel: b.ticketLabel || localQ.ticketLabel || 'Nomor Antrian',
                counterLabel: b.counterLabel || localQ.counterLabel || 'Loket',
                ttsTemplateCall: b.ttsTemplateCall || localQ.ttsTemplateCall,
                ttsTemplateRecall: b.ttsTemplateRecall || localQ.ttsTemplateRecall,
                ttsTemplateBreak: b.ttsTemplateBreak || localQ.ttsTemplateBreak,
                currentSequence: b.currentSequence ?? localQ.currentSequence ?? 0,
                items: b.itemsList && b.itemsList.length > 0 ? b.itemsList : localQ.items,
                counters: mappedCounters.length > 0 ? mappedCounters : localQ.counters,
                audios: mappedAudios.length > 0 ? mappedAudios : localQ.audios,
              };
            });

            // Also include any new backend queues not in local cache
            res.itemsList.forEach((b: any) => {
              if (!prevQueues.some((q) => q.id === b.id)) {
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
                updated.push({
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
                  backgroundImageUrl: b.backgroundImageUrl,
                  themePreset: b.themePreset || 'clean-light',
                  autoRecallEnabled: b.autoRecallEnabled || false,
                  sectorType: b.sectorType || 'HOSPITAL',
                  ticketLabel: b.ticketLabel || 'Nomor Antrian',
                  counterLabel: b.counterLabel || 'Loket',
                  ttsTemplateCall: b.ttsTemplateCall,
                  ttsTemplateRecall: b.ttsTemplateRecall,
                  ttsTemplateBreak: b.ttsTemplateBreak,
                  currentSequence: b.currentSequence || 0,
                  items: b.itemsList || [],
                  counters: mappedCounters,
                  audios: mappedAudios,
                });
              }
            });

            try {
              localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
            } catch {}
            return updated;
          });
        }
      })
      .catch(() => {});

    // Load Call History (and automatically clean up any existing duplicate entries)
    try {
      const historyStored = localStorage.getItem(QUEUE_HISTORY_STORAGE_KEY);
      if (historyStored) {
        const parsedHistory = JSON.parse(historyStored);
        if (Array.isArray(parsedHistory)) {
          const deduplicated: QueueCallHistoryItem[] = [];
          for (const item of parsedHistory) {
            const prev = deduplicated[deduplicated.length - 1];
            if (!prev || prev.ticketNumber !== item.ticketNumber || prev.counterName !== item.counterName || Math.abs((prev.timestamp || 0) - (item.timestamp || 0)) > 2500) {
              deduplicated.push(item);
            }
          }
          setCallHistory(deduplicated);
          try {
            localStorage.setItem(QUEUE_HISTORY_STORAGE_KEY, JSON.stringify(deduplicated));
          } catch {}
        }
      }
    } catch {}

    // Load hardware displays
    getDevices({ limit: 100 })
      .then((res) => {
        if (res && res.data) setDevices(res.data);
      })
      .catch(() => {});
  }, []);

  // Real-time SSE listener: sync with Android player taps or other clients
  useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream/device?deviceId=all');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && (data.type === 'CALL_QUEUE' || data.type === 'QUEUE_CALL')) {
            // Ignore echo broadcast originating from THIS tab to prevent duplicate TTS & duplicate history
            if (data.senderClientId && data.senderClientId === clientIdRef.current) {
              return;
            }
            if (data.source === 'web_studio' && Date.now() - lastLocalCallTimeRef.current < 2500) {
              return;
            }

            const ticketNum = data.ticketNumber;
            const counterNm = data.counterName || 'LOKET 01';
            const targetQId = data.queueId;
            const isFromPlayer = data.source === 'player_touch';

            if (!ticketNum) return;

            // Update queue list state & persist immediately
            setQueues((prevQueues) => {
              const updated = prevQueues.map((q) => {
                const isMatch = !targetQId || q.id === targetQId || prevQueues.length === 1;
                if (isMatch) {
                  return {
                    ...q,
                    currentNumber: ticketNum,
                    currentCounter: counterNm,
                  };
                }
                return q;
              });
              try {
                localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });

            // Trigger custom audio chime & Indonesian TTS announcement
            const currentQueues = queuesRef.current;
            const matchingQ = currentQueues.find((q) => !targetQId || q.id === targetQId) || currentQueues[0];
            if (matchingQ && matchingQ.audioChimeEnabled !== false) {
              setIsChiming(true);
              playQueueCallAudio(
                matchingQ,
                ticketNum,
                counterNm,
                data.callType === 'recall',
                () => setIsChiming(false)
              );
            }

            // Record to calling history
            const newHistoryItem: QueueCallHistoryItem = {
              id: `call-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              queueId: targetQId || '',
              queueName: data.queueName || 'Layar Antrian',
              ticketNumber: ticketNum,
              counterName: counterNm,
              targetDevice: isFromPlayer
                ? (data.sourceDeviceId ? `Layar Player (${data.sourceDeviceId.substring(0, 8)})` : 'Layar Player (Sentuh Langsung)')
                : 'Studio Web / Operator',
              calledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              timestamp: Date.now(),
              callType: isFromPlayer ? 'player_tap' : (data.callType || 'next'),
            };

            setCallHistory((prev) => {
              if (prev.length > 0 && prev[0].ticketNumber === ticketNum && prev[0].counterName === counterNm && Math.abs(Date.now() - prev[0].timestamp) < 2500) {
                return prev;
              }
              const next = [newHistoryItem, ...prev].slice(0, 50);
              try {
                localStorage.setItem(QUEUE_HISTORY_STORAGE_KEY, JSON.stringify(next));
              } catch {}
              return next;
            });
          } else if (data && data.type === 'RESET_QUEUE') {
            if (data.senderClientId && data.senderClientId === clientIdRef.current) return;
            const targetQId = data.queueId;
            const resetToNum = data.resetToNumber || 'A-000';
            setQueues((prevQueues) => {
              const updated = prevQueues.map((q) => {
                if (!targetQId || q.id === targetQId) {
                  return { ...q, currentNumber: resetToNum, currentSequence: 0 };
                }
                return q;
              });
              try {
                localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          } else if (data && data.type === 'COUNTER_STATUS_CHANGED') {
            if (data.senderClientId && data.senderClientId === clientIdRef.current) return;
            const targetQId = data.queueId;
            const counterId = data.counterId;
            const counterNm = data.counterName;
            const newStatus = data.status || 'ACTIVE';
            setQueues((prevQueues) => {
              const updated = prevQueues.map((q) => {
                if (!targetQId || q.id === targetQId) {
                  const updatedCounters = (q.counters || []).map((c) => {
                    if (c.id === counterId || c.counterName === counterNm) {
                      return { ...c, status: newStatus };
                    }
                    return c;
                  });
                  return { ...q, counters: updatedCounters };
                }
                return q;
              });
              try {
                localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
              } catch {}
              return updated;
            });
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, []);

  // Draggable divider mouse events
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !splitContainerRef.current) return;
      const rect = splitContainerRef.current.getBoundingClientRect();
      const relativeX = e.clientX - rect.left;
      const newPercent = (relativeX / rect.width) * 100;
      // Clamp between 45% and 82%
      if (newPercent >= 45 && newPercent <= 82) {
        setLeftWidthPercent(Math.round(newPercent * 10) / 10);
      }
    };

    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
      }
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Update Loket/Counter for selected queue
  const handleCounterChange = (newCounter: string) => {
    if (!selectedQueue) return;
    const updated = queues.map((q) => {
      if (q.id === selectedQueue.id) {
        return { ...q, currentCounter: newCounter };
      }
      return q;
    });
    setQueues(updated);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const [isCalling, setIsCalling] = useState(false);

  // Sector & TTS Modal State
  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [sectorForm, setSectorForm] = useState({
    sectorType: 'HOSPITAL',
    ticketLabel: 'Nomor Antrian',
    counterLabel: 'Loket',
    ttsTemplateCall: '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateRecall: 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
    ttsTemplateBreak: '{counter_label} {counter_name} sedang istirahat',
  });
  const [isTestingTts, setIsTestingTts] = useState(false);
  const [isSavingSector, setIsSavingSector] = useState(false);

  const handleOpenSectorModal = () => {
    if (!selectedQueue) return;
    setSectorForm({
      sectorType: selectedQueue.sectorType || 'HOSPITAL',
      ticketLabel: selectedQueue.ticketLabel || 'Nomor Antrian',
      counterLabel: selectedQueue.counterLabel || 'Loket',
      ttsTemplateCall: selectedQueue.ttsTemplateCall || '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
      ttsTemplateRecall: selectedQueue.ttsTemplateRecall || 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}',
      ttsTemplateBreak: selectedQueue.ttsTemplateBreak || '{counter_label} {counter_name} sedang istirahat',
    });
    setIsSectorModalOpen(true);
  };

  const handleSelectSectorPreset = (presetId: string) => {
    const preset = SECTOR_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setSectorForm({
      sectorType: preset.id,
      ticketLabel: preset.ticketLabel,
      counterLabel: preset.counterLabel,
      ttsTemplateCall: preset.ttsTemplateCall,
      ttsTemplateRecall: preset.ttsTemplateRecall,
      ttsTemplateBreak: preset.ttsTemplateBreak,
    });
  };

  const handleTestTtsVoice = () => {
    setIsTestingTts(true);
    const sampleConfig: Partial<QueueDisplayConfig> = {
      prefix: selectedQueue?.prefix || 'A',
      ticketLabel: sectorForm.ticketLabel,
      counterLabel: sectorForm.counterLabel,
      ttsTemplateCall: sectorForm.ttsTemplateCall,
      ttsTemplateRecall: sectorForm.ttsTemplateRecall,
    };
    speakQueueAnnouncement('A-005', `${sectorForm.counterLabel} 1`, false, () => setIsTestingTts(false), sampleConfig);
  };

  const handleSaveSectorSettings = async () => {
    if (!selectedQueue) return;
    setIsSavingSector(true);
    try {
      await updateQueueDisplay(selectedQueue.id, {
        name: selectedQueue.name,
        prefix: selectedQueue.prefix,
        sectorType: sectorForm.sectorType,
        ticketLabel: sectorForm.ticketLabel,
        counterLabel: sectorForm.counterLabel,
        ttsTemplateCall: sectorForm.ttsTemplateCall,
        ttsTemplateRecall: sectorForm.ttsTemplateRecall,
        ttsTemplateBreak: sectorForm.ttsTemplateBreak,
      });

      const updatedQueues = queues.map((q) => {
        if (q.id === selectedQueue.id) {
          return {
            ...q,
            sectorType: sectorForm.sectorType,
            ticketLabel: sectorForm.ticketLabel,
            counterLabel: sectorForm.counterLabel,
            ttsTemplateCall: sectorForm.ttsTemplateCall,
            ttsTemplateRecall: sectorForm.ttsTemplateRecall,
            ttsTemplateBreak: sectorForm.ttsTemplateBreak,
          };
        }
        return q;
      });
      setQueues(updatedQueues);
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueues));
      } catch {}

      setIsSectorModalOpen(false);
    } catch (e) {
      console.error('Gagal menyimpan pengaturan sektor:', e);
    } finally {
      setIsSavingSector(false);
    }
  };

  // Set Counter Status (ACTIVE, BREAK, LOCKED)
  const handleSetCounterStatus = async (newStatus: 'ACTIVE' | 'BREAK' | 'LOCKED') => {
    if (!selectedQueue) return;
    const currentCounterObj = selectedQueue.counters?.find((c) => c.counterName === selectedQueue.currentCounter) || selectedQueue.counters?.[0];
    if (!currentCounterObj) return;

    try {
      await setCounterStatus(currentCounterObj.id, newStatus);
    } catch (e) {
      console.warn('Backend setCounterStatus warning:', e);
    }

    const updatedCounters = (selectedQueue.counters || []).map((c) => {
      if (c.id === currentCounterObj.id || c.counterName === selectedQueue.currentCounter) {
        return { ...c, status: newStatus };
      }
      return c;
    });

    const updatedQueues = queues.map((q) => {
      if (q.id === selectedQueue.id) {
        return { ...q, counters: updatedCounters };
      }
      return q;
    });
    setQueues(updatedQueues);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueues));
    } catch {}

    if (selectedQueue.audioChimeEnabled) {
      speakCounterStatusAnnouncement(currentCounterObj.counterName, newStatus, selectedQueue);
    }

    try {
      await fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: targetDeviceId,
          type: 'COUNTER_STATUS_CHANGED',
          queueId: selectedQueue.id,
          counterId: currentCounterObj.id,
          counterName: currentCounterObj.counterName,
          status: newStatus,
          source: 'web_studio',
          senderClientId: clientIdRef.current,
        }),
      });
    } catch (e) {
      console.error('Gagal broadcast status loket:', e);
    }
  };

  // Call Next Ticket (+1)
  const handleCallNext = async () => {
    if (!selectedQueue || isCalling) return;
    setIsCalling(true);
    try {
      const currentCounterObj = selectedQueue.counters?.find((c) => c.counterName === selectedQueue.currentCounter) || selectedQueue.counters?.[0];
      const counterId = currentCounterObj?.id || '';

      if (currentCounterObj?.status === 'BREAK') {
        const proceed = await modal.confirm({
          title: 'Loket Sedang Istirahat',
          message: `${selectedQueue.currentCounter} sedang dalam status ISTIRAHAT. Apakah Anda ingin mengaktifkan loket kembali dan memanggil antrian?`,
          variant: 'warning',
          confirmText: 'Buka Loket & Panggil',
        });
        if (!proceed) return;
        await handleSetCounterStatus('ACTIVE');
      } else if (currentCounterObj?.status === 'LOCKED') {
        const proceed = await modal.confirm({
          title: 'Loket Terkunci / Ditutup',
          message: `${selectedQueue.currentCounter} sedang dalam status KUNCI/TUTUP. Apakah Anda ingin membuka loket ini kembali?`,
          variant: 'warning',
          confirmText: 'Buka Loket & Panggil',
        });
        if (!proceed) return;
        await handleSetCounterStatus('ACTIVE');
      }

      let newFormatted = '';
      try {
        const res = await callNextTicket(selectedQueue.id, counterId);
        if (res && res.ticket) {
          newFormatted = res.ticket.ticketNumber;
        }
      } catch (e) {
        console.warn('Backend callNextTicket error, calculating next sequence locally:', e);
      }

      if (!newFormatted) {
        const numPart = parseInt(selectedQueue.currentNumber.replace(/[^0-9]/g, ''), 10) || 0;
        const nextSeq = numPart + 1;
        newFormatted = `${selectedQueue.prefix}-${String(nextSeq).padStart(3, '0')}`;
      }

      // Update queue state & localStorage immediately so table list updates in real time!
      const updatedQueues = queues.map((q) => {
        if (q.id === selectedQueue.id) {
          return {
            ...q,
            currentNumber: newFormatted,
            currentCounter: selectedQueue.currentCounter,
          };
        }
        return q;
      });
      setQueues(updatedQueues);
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueues));
      } catch {}

      // Custom Audio Chime & TTS announcement
      if (selectedQueue.audioChimeEnabled) {
        setIsChiming(true);
        playQueueCallAudio(
          selectedQueue,
          newFormatted,
          selectedQueue.currentCounter,
          false,
          () => setIsChiming(false)
        );
      }

      // Add to History
      const historyItem: QueueCallHistoryItem = {
        id: `call-${Date.now()}`,
        queueId: selectedQueue.id,
        queueName: selectedQueue.name,
        ticketNumber: newFormatted,
        counterName: selectedQueue.currentCounter,
        targetDevice: targetDeviceId === 'all' ? 'Semua Layar' : (devices.find((d) => d.id === targetDeviceId)?.name || targetDeviceId),
        calledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: Date.now(),
        callType: 'next',
      };
      const nextHistory = [historyItem, ...callHistory].slice(0, 50);
      setCallHistory(nextHistory);
      try {
        localStorage.setItem(QUEUE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      } catch {}

      lastLocalCallTimeRef.current = Date.now();

      // Broadcast via SSE to Android Player & other screens
      try {
        await fetch('/api/stream/device', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            deviceId: targetDeviceId,
            type: 'CALL_QUEUE',
            queueId: selectedQueue.id,
            queueName: selectedQueue.name,
            ticketNumber: newFormatted,
            counterName: selectedQueue.currentCounter,
            source: 'web_studio',
            senderClientId: clientIdRef.current,
            callType: 'next',
            ticketLabel: selectedQueue.ticketLabel,
            counterLabel: selectedQueue.counterLabel,
            ttsTemplateCall: selectedQueue.ttsTemplateCall,
          }),
        });
      } catch (e) {
        console.error('Gagal broadcast panggilan antrian:', e);
      }
    } finally {
      setIsCalling(false);
    }
  };

  // Call Previous Ticket (-1)
  const handleCallPrevious = async () => {
    if (!selectedQueue || isCalling) return;
    setIsCalling(true);
    try {
      const currentCounterObj = selectedQueue.counters?.find((c) => c.counterName === selectedQueue.currentCounter) || selectedQueue.counters?.[0];
      const counterId = currentCounterObj?.id || '';

      let prevFormatted = '';
      try {
        const res = await callPreviousTicket(selectedQueue.id, counterId);
        if (res && res.ticket) {
          prevFormatted = res.ticket.ticketNumber;
        }
      } catch (e) {
        console.warn('Backend callPreviousTicket error, calculating previous sequence locally:', e);
      }

      if (!prevFormatted) {
        const numPart = parseInt(selectedQueue.currentNumber.replace(/[^0-9]/g, ''), 10) || 1;
        const prevSeq = Math.max(0, numPart - 1);
        prevFormatted = `${selectedQueue.prefix}-${String(prevSeq).padStart(3, '0')}`;
      }

      const updatedQueues = queues.map((q) => {
        if (q.id === selectedQueue.id) {
          return {
            ...q,
            currentNumber: prevFormatted,
            currentCounter: selectedQueue.currentCounter,
          };
        }
        return q;
      });
      setQueues(updatedQueues);
      try {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueues));
      } catch {}

      if (selectedQueue.audioChimeEnabled) {
        setIsChiming(true);
        playQueueCallAudio(
          selectedQueue,
          prevFormatted,
          selectedQueue.currentCounter,
          false,
          () => setIsChiming(false)
        );
      }

      const historyItem: QueueCallHistoryItem = {
        id: `call-${Date.now()}`,
        queueId: selectedQueue.id,
        queueName: selectedQueue.name,
        ticketNumber: prevFormatted,
        counterName: selectedQueue.currentCounter,
        targetDevice: targetDeviceId === 'all' ? 'Semua Layar' : (devices.find((d) => d.id === targetDeviceId)?.name || targetDeviceId),
        calledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        timestamp: Date.now(),
        callType: 'back',
      };
      const nextHistory = [historyItem, ...callHistory].slice(0, 50);
      setCallHistory(nextHistory);
      try {
        localStorage.setItem(QUEUE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
      } catch {}

      lastLocalCallTimeRef.current = Date.now();

      await fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: targetDeviceId,
          type: 'CALL_QUEUE',
          queueId: selectedQueue.id,
          queueName: selectedQueue.name,
          ticketNumber: prevFormatted,
          counterName: selectedQueue.currentCounter,
          source: 'web_studio',
          senderClientId: clientIdRef.current,
          callType: 'back',
          ticketLabel: selectedQueue.ticketLabel,
          counterLabel: selectedQueue.counterLabel,
          ttsTemplateCall: selectedQueue.ttsTemplateCall,
        }),
      });
    } finally {
      setIsCalling(false);
    }
  };

  // Repeat Call Current Ticket
  const handleRepeatCall = async () => {
    if (!selectedQueue || isCalling) return;

    if (selectedQueue.audioChimeEnabled) {
      setIsChiming(true);
      playQueueCallAudio(
        selectedQueue,
        selectedQueue.currentNumber,
        selectedQueue.currentCounter,
        true,
        () => setIsChiming(false)
      );
    }

    // Add to History as recall
    const historyItem: QueueCallHistoryItem = {
      id: `call-${Date.now()}`,
      queueId: selectedQueue.id,
      queueName: selectedQueue.name,
      ticketNumber: selectedQueue.currentNumber,
      counterName: selectedQueue.currentCounter,
      targetDevice: targetDeviceId === 'all' ? 'Semua Layar' : (devices.find((d) => d.id === targetDeviceId)?.name || targetDeviceId),
      calledAt: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      timestamp: Date.now(),
      callType: 'recall',
    };
    const nextHistory = [historyItem, ...callHistory].slice(0, 50);
    setCallHistory(nextHistory);
    try {
      localStorage.setItem(QUEUE_HISTORY_STORAGE_KEY, JSON.stringify(nextHistory));
    } catch {}

    lastLocalCallTimeRef.current = Date.now();

    // Broadcast via SSE
    try {
      await fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: targetDeviceId,
          type: 'CALL_QUEUE',
          queueId: selectedQueue.id,
          queueName: selectedQueue.name,
          ticketNumber: selectedQueue.currentNumber,
          counterName: selectedQueue.currentCounter,
          source: 'web_studio',
          senderClientId: clientIdRef.current,
          callType: 'recall',
          ticketLabel: selectedQueue.ticketLabel,
          counterLabel: selectedQueue.counterLabel,
          ttsTemplateRecall: selectedQueue.ttsTemplateRecall,
        }),
      });
    } catch (e) {
      console.error('Gagal broadcast panggil ulang antrian:', e);
    }
  };

  // Reset Queue Sequence to 0
  const handleResetQueue = async () => {
    if (!selectedQueue) return;
    const ok = await modal.confirm({
      title: 'Reset Nomor Antrian',
      message: `Apakah Anda yakin ingin me-reset urutan nomor antrian "${selectedQueue.name}" kembali ke nomor 0? Seluruh loket akan kembali ke posisi awal.`,
      variant: 'danger',
      confirmText: 'Reset Antrian ke 0',
    });
    if (!ok) return;

    const resetFormatted = `${selectedQueue.prefix}-000`;
    try {
      await resetQueue(selectedQueue.id, 0);
    } catch (e) {
      console.warn('Backend resetQueue error:', e);
    }

    const updatedQueues = queues.map((q) => {
      if (q.id === selectedQueue.id) {
        return {
          ...q,
          currentNumber: resetFormatted,
          currentSequence: 0,
        };
      }
      return q;
    });
    setQueues(updatedQueues);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updatedQueues));
    } catch {}

    try {
      await fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: targetDeviceId,
          type: 'RESET_QUEUE',
          queueId: selectedQueue.id,
          resetToNumber: resetFormatted,
          source: 'web_studio',
          senderClientId: clientIdRef.current,
        }),
      });
    } catch (e) {
      console.error('Gagal broadcast reset antrian:', e);
    }
  };

  // Clear History
  const handleClearHistory = () => {
    setCallHistory([]);
    try {
      localStorage.removeItem(QUEUE_HISTORY_STORAGE_KEY);
    } catch {}
  };

  // Delete Queue Configuration
  const handleDelete = async (id: string, name: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Layar Antrian',
      message: `Apakah Anda yakin ingin menghapus konfigurasi layar antrian "${name}"?`,
      variant: 'danger',
      confirmText: 'Hapus Layar',
    });
    if (!ok) return;

    const updated = queues.filter((q) => q.id !== id);
    setQueues(updated);
    if (selectedQueueId === id && updated.length > 0) {
      setSelectedQueueId(updated[0].id);
    }
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Filter queues
  const filtered = queues.filter(
    (q) =>
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.prefix.toLowerCase().includes(search.toLowerCase()) ||
      q.currentCounter.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Ticket size={22} color="var(--text-secondary)" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Nomor Antrian
            </h2>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola dan panggil nomor antrian loket.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/studio/components/ticket/create" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8125rem' }}>
            <Plus size={15} />
            <span>Tambah Antrian</span>
          </Link>
        </div>
      </div>

      {/* 2-Column Split Layout with Draggable Divider */}
      <div
        ref={splitContainerRef}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          gap: 0,
          width: '100%',
          userSelect: isDragging ? 'none' : 'auto',
        }}
      >
        {/* LEFT COLUMN: Table List (default ~68%) */}
        <div
          style={{
            width: `${leftWidthPercent}%`,
            minWidth: '380px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingRight: '6px',
            transition: isDragging ? 'none' : 'width 0.1s ease',
          }}
        >
          {/* Search Box */}
          <div className="card-elevated" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Cari antrian..."
                className="form-input"
                style={{ paddingLeft: '34px', fontSize: '0.8125rem', padding: '7px 12px 7px 34px' }}
              />
            </div>
          </div>

          {/* Table Data */}
          <div className="card-elevated" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nama</th>
                    <th>Awalan</th>
                    <th>Nomor</th>
                    <th>Loket</th>
                    <th>Audio</th>
                    <th style={{ textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Belum ada antrian. Klik tombol Tambah untuk membuat baru.
                      </td>
                    </tr>
                  ) : (
                    paginated.map((q) => {
                      const isSelected = selectedQueue?.id === q.id;
                      return (
                        <tr
                          key={q.id}
                          onClick={() => setSelectedQueueId(q.id)}
                          style={{
                            cursor: 'pointer',
                            backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : undefined,
                            borderLeft: isSelected ? '3px solid var(--primary-500)' : '3px solid transparent',
                            transition: 'background-color 0.15s ease',
                          }}
                        >
                          <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                            <Link
                              href={`/studio/components/ticket/${q.id}/edit`}
                              onClick={(e) => e.stopPropagation()}
                              style={{ textDecoration: 'none', color: 'inherit' }}
                            >
                              {q.name}
                            </Link>
                          </td>
                          <td>
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                color: 'var(--text-primary)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              {q.prefix}
                            </span>
                          </td>
                          <td>
                            <span
                              style={{
                                fontSize: '0.875rem',
                                fontWeight: 700,
                                fontFamily: 'monospace',
                                color: 'var(--text-primary)',
                              }}
                            >
                              {q.currentNumber}
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                              {q.currentCounter}
                            </span>
                          </td>
                          <td>
                            {(() => {
                              const customAud = q.audios?.find((a) => a.isActive !== false && (a.fileUrl || a.mediaItemId));
                              return (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    fontSize: '0.75rem',
                                    color: 'var(--text-muted)',
                                    maxWidth: '180px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title={customAud ? customAud.name : (q.audioChimeEnabled ? 'Ding-Dong' : 'Mute')}
                                >
                                  <Volume2 size={13} style={{ flexShrink: 0, opacity: 0.7 }} />
                                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {customAud ? customAud.name : (q.audioChimeEnabled ? 'Ding-Dong' : 'Mute')}
                                  </span>
                                </span>
                              );
                            })()}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <Link
                                href={`/studio/components/ticket/${q.id}/edit`}
                                onClick={(e) => e.stopPropagation()}
                                className="btn btn-outline"
                                style={{ padding: '5px 7px' }}
                                title="Edit"
                              >
                                <Edit size={13} />
                              </Link>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(q.id, q.name);
                                }}
                                className="btn btn-outline"
                                style={{ padding: '5px 7px', color: 'var(--text-muted)' }}
                                title="Hapus"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              page={page}
              limit={limit}
              total={filtered.length}
              onPageChange={(p) => setPage(p)}
              onLimitChange={(l) => {
                setLimit(l);
                setPage(1);
              }}
            />
          </div>
        </div>

        {/* DRAGGABLE DIVIDER */}
        <div
          onMouseDown={handleMouseDown}
          style={{
            width: '12px',
            cursor: 'col-resize',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 10,
            userSelect: 'none',
            transition: 'background-color 0.15s ease',
            backgroundColor: isDragging ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
            borderRadius: '4px',
          }}
          title="Geser ke kiri / kanan untuk menyesuaikan ukuran kolom"
        >
          <div
            style={{
              width: '4px',
              height: '56px',
              borderRadius: '2px',
              backgroundColor: isDragging ? 'var(--primary-400)' : 'var(--border-strong)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.2s ease',
            }}
          />
        </div>

        {/* RIGHT COLUMN: Calling Console & History (default ~32%) */}
        <div
          style={{
            width: `${100 - leftWidthPercent}%`,
            minWidth: '320px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            paddingLeft: '6px',
            transition: isDragging ? 'none' : 'width 0.1s ease',
          }}
        >
          {selectedQueue ? (
            <>
              {/* Operator Controller & Screen Card */}
              <div
                className="card-elevated"
                style={{
                  padding: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {/* Header Title */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Radio size={15} style={{ color: 'var(--text-secondary)' }} />
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Pemanggil Antrian
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    {selectedQueue.name} ({selectedQueue.prefix})
                  </span>
                  <button
                    type="button"
                    onClick={handleOpenSectorModal}
                    className="btn btn-outline"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      padding: '3px 8px',
                      fontSize: '0.75rem',
                    }}
                    title="Konfigurasi Sektor & Naskah TTS"
                  >
                    <Sliders size={13} />
                    <span>Sektor & TTS</span>
                  </button>
                </div>

                {/* Digital Signage Screen Simulation */}
                <div
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '18px 14px',
                    textAlign: 'center',
                    border: isChiming ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    boxShadow: isChiming ? '0 0 20px rgba(59, 130, 246, 0.25)' : 'none',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    {selectedQueue.ticketLabel || 'Nomor Antrian'}
                  </div>
                  <div
                    style={{
                      fontSize: '3.25rem',
                      fontWeight: 800,
                      letterSpacing: '0.02em',
                      fontFamily: 'monospace',
                      color: 'var(--text-primary)',
                      lineHeight: 1.1,
                      margin: '6px 0',
                    }}
                  >
                    {selectedQueue.currentNumber}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'inline-block',
                        padding: '4px 14px',
                        borderRadius: '6px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        border: '1px solid var(--border-subtle)',
                        color: 'var(--text-secondary)',
                        fontSize: '0.875rem',
                        fontWeight: 600,
                      }}
                    >
                      {selectedQueue.currentCounter}
                    </div>
                    {(() => {
                      const cObj = selectedQueue.counters?.find((c) => c.counterName === selectedQueue.currentCounter) || selectedQueue.counters?.[0];
                      if (cObj?.status === 'BREAK') {
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.4)', color: '#F59E0B', fontSize: '0.75rem', fontWeight: 700 }}>
                            <Coffee size={12} />
                            <span>ISTIRAHAT</span>
                          </span>
                        );
                      }
                      if (cObj?.status === 'LOCKED') {
                        return (
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', color: '#EF4444', fontSize: '0.75rem', fontWeight: 700 }}>
                            <Lock size={12} />
                            <span>TUTUP</span>
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </div>

                  {/* Marquee Banner */}
                  <div
                    style={{
                      marginTop: '12px',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      padding: '6px 10px',
                      borderRadius: '6px',
                      color: 'var(--text-muted)',
                      fontSize: '0.75rem',
                    }}
                  >
                    <Marquee>{selectedQueue.marqueeText}</Marquee>
                  </div>
                </div>

                {/* Configuration / Selectors */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Layar:</label>
                    <select
                      value={targetDeviceId}
                      onChange={(e) => setTargetDeviceId(e.target.value)}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--input-border)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        fontSize: '0.75rem',
                        maxWidth: '220px',
                      }}
                    >
                      <option value="all">Otomatis (Layar Aktif)</option>
                      {devices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.isOnline ? 'Online' : 'Offline'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>
                      {selectedQueue.counterLabel || 'Loket'}:
                    </label>
                    <select
                      value={selectedQueue.currentCounter}
                      onChange={(e) => handleCounterChange(e.target.value)}
                      style={{
                        backgroundColor: 'var(--input-bg)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--input-border)',
                        borderRadius: '6px',
                        padding: '5px 8px',
                        fontSize: '0.75rem',
                        maxWidth: '220px',
                      }}
                    >
                      {selectedQueue.counters && selectedQueue.counters.length > 0 ? (
                        selectedQueue.counters.map((c) => (
                          <option key={c.id || c.counterName} value={c.counterName}>
                            {c.counterName} {c.status === 'BREAK' ? '⏸️ (Istirahat)' : c.status === 'LOCKED' ? '🔒 (Tutup)' : '🟢 (Aktif)'}
                          </option>
                        ))
                      ) : (
                        <>
                          <option value="LOKET 01">LOKET 01</option>
                          <option value="LOKET 02">LOKET 02</option>
                          <option value="LOKET 03">LOKET 03</option>
                          <option value="CUSTOMER SERVICE">CUSTOMER SERVICE</option>
                          <option value="KASIR UTAMA">KASIR UTAMA</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* Counter Status Switcher Buttons */}
                  {(() => {
                    const cObj = selectedQueue.counters?.find((c) => c.counterName === selectedQueue.currentCounter) || selectedQueue.counters?.[0];
                    const currStatus = cObj?.status || 'ACTIVE';
                    return (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--text-muted)' }}>Status:</span>
                        <button
                          type="button"
                          onClick={() => handleSetCounterStatus('ACTIVE')}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: currStatus === 'ACTIVE' ? '1px solid var(--accent-emerald)' : '1px solid var(--border-subtle)',
                            backgroundColor: currStatus === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'var(--bg-surface-elevated)',
                            color: currStatus === 'ACTIVE' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                          }}
                        >
                          <CheckCircle2 size={12} />
                          <span>Buka</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCounterStatus('BREAK')}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: currStatus === 'BREAK' ? '1px solid #F59E0B' : '1px solid var(--border-subtle)',
                            backgroundColor: currStatus === 'BREAK' ? 'rgba(245, 158, 11, 0.18)' : 'var(--bg-surface-elevated)',
                            color: currStatus === 'BREAK' ? '#F59E0B' : 'var(--text-muted)',
                          }}
                        >
                          <Coffee size={12} />
                          <span>Istirahat</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetCounterStatus('LOCKED')}
                          style={{
                            flex: 1,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '4px',
                            padding: '4px 6px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            border: currStatus === 'LOCKED' ? '1px solid #EF4444' : '1px solid var(--border-subtle)',
                            backgroundColor: currStatus === 'LOCKED' ? 'rgba(239, 68, 68, 0.18)' : 'var(--bg-surface-elevated)',
                            color: currStatus === 'LOCKED' ? '#EF4444' : 'var(--text-muted)',
                          }}
                        >
                          <Lock size={12} />
                          <span>Kunci</span>
                        </button>
                      </div>
                    );
                  })()}
                </div>

                {/* Action Buttons: Mundur (-1), Ulang, Panggil Selanjutnya (+1) */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.3fr', gap: '6px' }}>
                    <button
                      onClick={handleCallPrevious}
                      disabled={isCalling}
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '8px 10px',
                        fontSize: '0.8125rem',
                      }}
                      title="Panggil nomor antrian sebelumnya (Mundur 1)"
                    >
                      <Undo2 size={15} />
                      <span>Mundur</span>
                    </button>
                    <button
                      onClick={handleRepeatCall}
                      disabled={isCalling}
                      className="btn btn-secondary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '5px',
                        padding: '8px 10px',
                        fontSize: '0.8125rem',
                      }}
                      title="Panggil ulang nomor antrian saat ini"
                    >
                      <Volume2 size={15} />
                      <span>Ulang</span>
                    </button>
                    <button
                      onClick={handleCallNext}
                      disabled={isCalling}
                      className="btn btn-primary"
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        padding: '8px 12px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                      }}
                      title="Panggil nomor antrian berikutnya (+1)"
                    >
                      <Bell size={15} />
                      <span>Selanjutnya</span>
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', paddingTop: '4px', borderTop: '1px solid var(--border-subtle)' }}>
                    <button
                      type="button"
                      onClick={handleResetQueue}
                      disabled={isCalling}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        padding: '4px 0',
                      }}
                      title="Reset urutan nomor antrian kembali ke 0"
                    >
                      <RotateCcw size={13} />
                      <span>Reset Urutan (0)</span>
                    </button>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                      Sektor: {SECTOR_PRESETS.find((p) => p.id === (selectedQueue.sectorType || 'HOSPITAL'))?.name || 'Rumah Sakit'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Call History Card */}
              <div
                className="card-elevated"
                style={{
                  padding: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  backgroundColor: 'var(--bg-surface)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <History size={14} style={{ color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                      Riwayat
                    </span>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '1px 5px',
                        borderRadius: '4px',
                        backgroundColor: 'var(--bg-surface-elevated)',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {callHistory.length}
                    </span>
                  </div>

                  {callHistory.length > 0 && (
                    <button
                      onClick={handleClearHistory}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                      }}
                      title="Bersihkan riwayat panggilan"
                    >
                      <RotateCcw size={11} />
                      <span>Bersihkan</span>
                    </button>
                  )}
                </div>

                {/* History List */}
                <div
                  style={{
                    maxHeight: '260px',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    paddingRight: '2px',
                  }}
                >
                  {callHistory.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                      Belum ada riwayat panggilan.
                    </div>
                  ) : (
                    callHistory.map((h) => {
                      const isRecall = h.callType === 'recall';
                      const isPlayerTap = h.callType === 'player_tap';
                      return (
                        <div
                          key={h.id}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '6px 8px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Clock size={11} style={{ color: 'var(--text-muted)' }} />
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              {h.calledAt}
                            </span>
                            <span style={{ fontWeight: 700, fontSize: '0.8125rem', fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                              {h.ticketNumber}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              {h.counterName}
                            </span>
                          </div>

                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              padding: '1px 5px',
                              borderRadius: '4px',
                              backgroundColor: 'var(--bg-surface)',
                              color: 'var(--text-muted)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {isPlayerTap ? 'Player' : isRecall ? 'Ulang' : h.callType === 'back' ? 'Mundur' : 'Baru'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="card-elevated" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Pilih salah satu antrian di tabel untuk mengontrol pemanggilan.
            </div>
          )}
        </div>
      </div>

      {/* SECTOR & TTS CONFIGURATION MODAL */}
      {isSectorModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setIsSectorModalOpen(false)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              overflowY: 'auto',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '12px',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sliders size={18} color="var(--primary-500)" />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Pengaturan Sektor & Naskah Suara TTS
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Sesuaikan jenis industri & naskah suara pengumuman pemanggilan untuk layar ini.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsSectorModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Sector Presets Grid */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
                Pilih Preset Sektor Industri:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '8px' }}>
                {SECTOR_PRESETS.map((preset) => {
                  const isSelected = sectorForm.sectorType === preset.id;
                  return (
                    <div
                      key={preset.id}
                      onClick={() => handleSelectSectorPreset(preset.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'var(--bg-surface-elevated)',
                        cursor: 'pointer',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '4px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: isSelected ? 'var(--primary-400)' : 'var(--text-primary)' }}>
                          {preset.name}
                        </span>
                        {isSelected && <Check size={14} color="var(--primary-500)" />}
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                        {preset.ticketLabel} → {preset.counterLabel}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Label Customization */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Label Tiket / Nomor:
                </label>
                <input
                  type="text"
                  value={sectorForm.ticketLabel}
                  onChange={(e) => setSectorForm({ ...sectorForm, ticketLabel: e.target.value })}
                  placeholder="Contoh: Nomor Antrian, Nomor Pesanan"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Label Loket / Pos:
                </label>
                <input
                  type="text"
                  value={sectorForm.counterLabel}
                  onChange={(e) => setSectorForm({ ...sectorForm, counterLabel: e.target.value })}
                  placeholder="Contoh: Loket, Teller, Pickup Point, Poli"
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '0.8125rem',
                  }}
                />
              </div>
            </div>

            {/* TTS Template Customization */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Naskah Panggilan Baru (TTS):
                </label>
                <input
                  type="text"
                  value={sectorForm.ttsTemplateCall}
                  onChange={(e) => setSectorForm({ ...sectorForm, ttsTemplateCall: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Naskah Panggilan Ulang (Recall):
                </label>
                <input
                  type="text"
                  value={sectorForm.ttsTemplateRecall}
                  onChange={(e) => setSectorForm({ ...sectorForm, ttsTemplateRecall: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Naskah Pengumuman Istirahat:
                </label>
                <input
                  type="text"
                  value={sectorForm.ttsTemplateBreak}
                  onChange={(e) => setSectorForm({ ...sectorForm, ttsTemplateBreak: e.target.value })}
                  style={{
                    width: '100%',
                    backgroundColor: 'var(--input-bg)',
                    color: 'var(--text-primary)',
                    border: '1px solid var(--input-border)',
                    borderRadius: '6px',
                    padding: '7px 10px',
                    fontSize: '0.8125rem',
                    fontFamily: 'monospace',
                  }}
                />
              </div>

              {/* Variable helper tags */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Variabel tersedia:</span>
                {['{ticket_label}', '{ticket_number}', '{counter_label}', '{counter_name}'].map((v) => (
                  <code
                    key={v}
                    style={{
                      fontSize: '0.6875rem',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {v}
                  </code>
                ))}
              </div>
            </div>

            {/* Modal Footer / Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '4px' }}>
              <button
                type="button"
                onClick={handleTestTtsVoice}
                disabled={isTestingTts}
                className="btn btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem' }}
              >
                <Volume2 size={15} color={isTestingTts ? 'var(--primary-500)' : undefined} />
                <span>{isTestingTts ? 'Menguji Suara...' : 'Uji Suara Naskah'}</span>
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setIsSectorModalOpen(false)}
                  className="btn btn-outline"
                  style={{ fontSize: '0.8125rem' }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveSectorSettings}
                  disabled={isSavingSector}
                  className="btn btn-primary"
                  style={{ fontSize: '0.8125rem', fontWeight: 700 }}
                >
                  {isSavingSector ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

