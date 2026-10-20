'use client';

import React, { useState, useRef, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useQueueEditor } from '../../context/QueueEditorContext';
import {
  speakQueueAnnouncement,
  speakCounterStatusAnnouncement,
  QUEUE_HISTORY_STORAGE_KEY,
  QueueCallHistoryItem,
} from '../../types';
import {
  callNextTicket as apiCallNextTicket,
  callPreviousTicket as apiCallPreviousTicket,
  resetQueue as apiResetQueue,
  setCounterStatus as apiSetCounterStatus,
} from '@/lib/services/studio/queue.service';
import { modal } from '@/components/ui/ModalDialog';
import { invokeApi } from '@/lib/core/invokeApi';

const QueueControlDocks = dynamic(() => import('../control/QueueControlDocks'), {
  ssr: false,
});

const QueueLiveMonitorCanvas = dynamic(() => import('../control/QueueLiveMonitorCanvas'), {
  ssr: false,
});

export default function TabEditorControllTab() {
  const { queue, setQueue, simulator, setSimulator, triggerChime } = useQueueEditor();
  const [calling, setCalling] = useState(false);
  const [counterMenuOpen, setCounterMenuOpen] = useState(false);

  // Efek invert visual pemanggilan (100% konsisten dengan Android player: aktif selama audio TTS berbicara)
  const [isInverted, setIsInverted] = useState(false);
  const invertSafetyTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const startInvertEffect = () => {
    if (invertSafetyTimeoutRef.current) {
      clearTimeout(invertSafetyTimeoutRef.current);
      invertSafetyTimeoutRef.current = null;
    }
    // Jika sedang dalam status invert (panggilan beruntun cepat), berikan micro-shutter 60ms agar terlihat kedipan panggilan baru
    if (isInverted) {
      setIsInverted(false);
      setTimeout(() => setIsInverted(true), 60);
    } else {
      setIsInverted(true);
    }
    // Safety watchdog: jika browser memblokir audio/TTS, matikan setelah 20 detik agar tidak stuck selamanya
    invertSafetyTimeoutRef.current = setTimeout(() => {
      setIsInverted(false);
      invertSafetyTimeoutRef.current = null;
    }, 20000);
  };

  const stopInvertEffect = () => {
    if (invertSafetyTimeoutRef.current) {
      clearTimeout(invertSafetyTimeoutRef.current);
      invertSafetyTimeoutRef.current = null;
    }
    setIsInverted(false);
  };

  useEffect(() => {
    return () => {
      if (invertSafetyTimeoutRef.current) clearTimeout(invertSafetyTimeoutRef.current);
    };
  }, []);

  const activeCounter = queue.counters.find((c) => c.counterName === queue.currentCounter) || queue.counters[0] || {
    id: 'cnt-1',
    counterNumber: 1,
    counterName: `${queue.counterLabel || 'LOKET'} 01`.toUpperCase(),
    operatorName: 'Petugas 1',
    isActive: true,
    status: 'ACTIVE',
  };

  const isLocked = activeCounter.status === 'LOCKED';
  const isBreak = activeCounter.status === 'BREAK';

  // Sesuai permintaan: saat ditutup tombol kontrol pemanggil dinonaktifkan
  const isCallingDisabled = calling || isLocked;

  // Real-time synchronization: saat layar disentuh di Android (player touch), konsol web ikut terupdate
  React.useEffect(() => {
    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource('/api/stream/device?deviceId=all');
      eventSource.onmessage = (event) => {
        if (!event.data) return;
        try {
          const data = JSON.parse(event.data);
          if (data && (data.type === 'CALL_QUEUE' || data.type === 'QUEUE_CALL')) {
            // Abaikan jika pesan berasal dari konsol web ini sendiri (menghindari echo ganda)
            if (data.source === 'web_console') return;

            // Abaikan jika ditujukan ke antrian spesifik lain
            if (data.queueId && queue.id && data.queueId !== queue.id) return;

            const ticketNum = data.ticketNumber;
            const counterNm = data.counterName;
            if (ticketNum) {
              startInvertEffect();

              if (queue.audioChimeEnabled && data.source === 'player_touch') {
                triggerChime();
              }

              speakQueueAnnouncement(
                ticketNum,
                counterNm || activeCounter.counterName,
                data.callType === 'recall',
                () => {
                  stopInvertEffect();
                },
                queue
              );

              setQueue((prev) => ({
                ...prev,
                currentNumber: ticketNum,
                ...(counterNm ? { currentCounter: counterNm } : {}),
              }));

              setSimulator((prev) => ({
                ...prev,
                currentNumber: ticketNum,
                ...(counterNm ? { currentCounter: counterNm } : {}),
                currentSeq: parseInt(ticketNum.replace(/[^0-9]/g, ''), 10) || prev.currentSeq,
              }));

              if (counterNm) {
                recordCallHistory(ticketNum, counterNm, data.callType || 'next');
              }
            }
          } else if (data && data.type === 'COUNTER_STATUS_CHANGED') {
            if (data.counterName && data.status) {
              setQueue((prev) => ({
                ...prev,
                counters: prev.counters.map((c) =>
                  c.counterName.trim().toUpperCase() === data.counterName.trim().toUpperCase()
                    ? { ...c, status: data.status }
                    : c
                ),
              }));
            }
          } else if (data && data.type === 'RESET_QUEUE') {
            const resetNum = data.resetToNumber || `${queue.prefix || 'A'}-000`;
            setQueue((prev) => ({
              ...prev,
              currentNumber: resetNum,
              currentSequence: 0,
            }));
            setSimulator((prev) => ({
              ...prev,
              currentNumber: resetNum,
              currentSeq: 0,
            }));
            stopInvertEffect();
          }
        } catch (_) {}
      };
    } catch (_) {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [queue.id, queue.prefix]);

  const broadcastToAndroid = (payload: Record<string, any>) => {
    try {
      invokeApi('/api/stream/device', {
        deviceId: 'all',
        queueId: queue.id,
        source: 'web_console',
        timestamp: Date.now(),
        ...payload,
      }).catch(() => {});
    } catch {}
  };

  const recordCallHistory = (num: string, counterName: string, callType: 'next' | 'recall' | 'back') => {
    try {
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}.${String(now.getMinutes()).padStart(2, '0')}.${String(now.getSeconds()).padStart(2, '0')}`;
      const newItem: QueueCallHistoryItem = {
        id: `call-${Date.now()}`,
        queueId: queue.id,
        queueName: queue.name,
        ticketNumber: num,
        counterName,
        targetDevice: 'Browser Console',
        calledAt: timeStr,
        timestamp: Date.now(),
        callType,
      };
      const stored = localStorage.getItem(QUEUE_HISTORY_STORAGE_KEY);
      const historyList: QueueCallHistoryItem[] = stored ? JSON.parse(stored) : [];
      const updated = [newItem, ...historyList].slice(0, 50);
      localStorage.setItem(QUEUE_HISTORY_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Next ticket call
  const handleCallNext = async () => {
    if (isCallingDisabled) return;
    setCalling(true);
    startInvertEffect();
    try {
      let nextNumber = queue.currentNumber || simulator.currentNumber || `${queue.prefix || 'A'}-000`;
      if (queue.id) {
        const res = await apiCallNextTicket(queue.id, activeCounter.id).catch(() => null);
        if (res && res.ticket && res.ticket.ticketNumber) {
          nextNumber = res.ticket.ticketNumber;
        } else {
          const curSeq = parseInt(nextNumber.replace(/[^0-9]/g, ''), 10) || 0;
          const nextSeq = curSeq + 1;
          nextNumber = `${queue.prefix || 'A'}-${String(nextSeq).padStart(3, '0')}`;
        }
      } else {
        const curSeq = parseInt(nextNumber.replace(/[^0-9]/g, ''), 10) || 0;
        const nextSeq = curSeq + 1;
        nextNumber = `${queue.prefix || 'A'}-${String(nextSeq).padStart(3, '0')}`;
      }

      setQueue((prev) => ({
        ...prev,
        currentNumber: nextNumber,
        currentCounter: activeCounter.counterName,
      }));

      setSimulator((prev) => ({
        ...prev,
        currentNumber: nextNumber,
        currentCounter: activeCounter.counterName,
        currentSeq: parseInt(nextNumber.replace(/[^0-9]/g, ''), 10) || prev.currentSeq + 1,
      }));

      recordCallHistory(nextNumber, activeCounter.counterName, 'next');

      broadcastToAndroid({
        type: 'CALL_QUEUE',
        queueName: queue.name,
        ticketNumber: nextNumber,
        counterName: activeCounter.counterName,
        callType: 'next',
        ticketLabel: queue.ticketLabel,
        counterLabel: queue.counterLabel,
        ttsTemplateCall: queue.ttsTemplateCall,
        ttsTemplateRecall: queue.ttsTemplateRecall,
      });

      if (queue.audioChimeEnabled) {
        triggerChime();
        setTimeout(() => {
          speakQueueAnnouncement(
            nextNumber,
            activeCounter.counterName,
            false,
            () => {
              setCalling(false);
              stopInvertEffect();
            },
            queue
          );
        }, 1200);
      } else {
        speakQueueAnnouncement(
          nextNumber,
          activeCounter.counterName,
          false,
          () => {
            setCalling(false);
            stopInvertEffect();
          },
          queue
        );
      }
    } catch {
      setCalling(false);
      stopInvertEffect();
    }
  };

  // Recall current ticket
  const handleRecall = () => {
    if (isCallingDisabled) return;
    setCalling(true);
    startInvertEffect();
    const curNumber = queue.currentNumber || simulator.currentNumber || `${queue.prefix || 'A'}-001`;
    recordCallHistory(curNumber, activeCounter.counterName, 'recall');

    broadcastToAndroid({
      type: 'CALL_QUEUE',
      queueName: queue.name,
      ticketNumber: curNumber,
      counterName: activeCounter.counterName,
      callType: 'recall',
      ticketLabel: queue.ticketLabel,
      counterLabel: queue.counterLabel,
      ttsTemplateCall: queue.ttsTemplateCall,
      ttsTemplateRecall: queue.ttsTemplateRecall,
    });

    if (queue.audioChimeEnabled) {
      triggerChime();
      setTimeout(() => {
        speakQueueAnnouncement(
          curNumber,
          activeCounter.counterName,
          true,
          () => {
            setCalling(false);
            stopInvertEffect();
          },
          queue
        );
      }, 1200);
    } else {
      speakQueueAnnouncement(
        curNumber,
        activeCounter.counterName,
        true,
        () => {
          setCalling(false);
          stopInvertEffect();
        },
        queue
      );
    }
  };

  // Previous ticket call
  const handleCallPrevious = async () => {
    if (isCallingDisabled) return;
    setCalling(true);
    startInvertEffect();
    try {
      let prevNumber = queue.currentNumber || simulator.currentNumber || `${queue.prefix || 'A'}-001`;
      if (queue.id) {
        const res = await apiCallPreviousTicket(queue.id, activeCounter.id).catch(() => null);
        if (res && res.ticket && res.ticket.ticketNumber) {
          prevNumber = res.ticket.ticketNumber;
        } else {
          const curSeq = parseInt(prevNumber.replace(/[^0-9]/g, ''), 10) || 1;
          const prevSeq = Math.max(0, curSeq - 1);
          prevNumber = `${queue.prefix || 'A'}-${String(prevSeq).padStart(3, '0')}`;
        }
      } else {
        const curSeq = parseInt(prevNumber.replace(/[^0-9]/g, ''), 10) || 1;
        const prevSeq = Math.max(0, curSeq - 1);
        prevNumber = `${queue.prefix || 'A'}-${String(prevSeq).padStart(3, '0')}`;
      }

      setQueue((prev) => ({
        ...prev,
        currentNumber: prevNumber,
        currentCounter: activeCounter.counterName,
      }));

      setSimulator((prev) => ({
        ...prev,
        currentNumber: prevNumber,
        currentCounter: activeCounter.counterName,
        currentSeq: parseInt(prevNumber.replace(/[^0-9]/g, ''), 10) || 0,
      }));

      recordCallHistory(prevNumber, activeCounter.counterName, 'back');

      broadcastToAndroid({
        type: 'CALL_QUEUE',
        queueName: queue.name,
        ticketNumber: prevNumber,
        counterName: activeCounter.counterName,
        callType: 'back',
        ticketLabel: queue.ticketLabel,
        counterLabel: queue.counterLabel,
        ttsTemplateCall: queue.ttsTemplateCall,
        ttsTemplateRecall: queue.ttsTemplateRecall,
      });

      if (queue.audioChimeEnabled) {
        triggerChime();
        setTimeout(() => {
          speakQueueAnnouncement(
            prevNumber,
            activeCounter.counterName,
            false,
            () => {
              setCalling(false);
              stopInvertEffect();
            },
            queue
          );
        }, 1200);
      } else {
        speakQueueAnnouncement(
          prevNumber,
          activeCounter.counterName,
          false,
          () => {
            setCalling(false);
            stopInvertEffect();
          },
          queue
        );
      }
    } catch {
      setCalling(false);
      stopInvertEffect();
    }
  };

  // Status handler (Buka, Istirahat, Kunci)
  const handleStatusChange = async (newStatus: 'ACTIVE' | 'BREAK' | 'LOCKED') => {
    try {
      if (activeCounter.id && !activeCounter.id.startsWith('cnt-')) {
        await apiSetCounterStatus(activeCounter.id, newStatus).catch(() => null);
      }

      setQueue((prev) => ({
        ...prev,
        currentCounter: activeCounter.counterName,
        counters: prev.counters.map((c) =>
          c.id === activeCounter.id ? { ...c, status: newStatus } : c
        ),
      }));

      broadcastToAndroid({
        type: 'COUNTER_STATUS_CHANGED',
        counterName: activeCounter.counterName,
        status: newStatus,
      });

      speakCounterStatusAnnouncement(
        activeCounter.counterName,
        newStatus,
        queue,
        () => {}
      );
    } catch {}
  };

  const handleToggleLock = () => {
    if (isLocked) {
      handleStatusChange('ACTIVE');
    } else {
      handleStatusChange('LOCKED');
    }
  };

  const handleToggleBreak = () => {
    if (isBreak) {
      handleStatusChange('ACTIVE');
    } else {
      handleStatusChange('BREAK');
    }
  };

  // Reset sequence handler
  const handleReset = async () => {
    const ok = await modal.confirm({
      title: 'Reset Urutan Nomor',
      message: `Reset urutan nomor panggilan antrian "${queue.name}" kembali ke nomor awal (0)?`,
      variant: 'warning',
      confirmText: 'Ya, Reset',
    });
    if (!ok) return;

    try {
      if (queue.id) {
        await apiResetQueue(queue.id, 0).catch(() => null);
      }
      const initialNum = `${queue.prefix || 'A'}-000`;
      setQueue((prev) => ({
        ...prev,
        currentNumber: initialNum,
        currentSequence: 0,
      }));
      setSimulator((prev) => ({
        ...prev,
        currentNumber: initialNum,
        currentCounter: activeCounter.counterName,
        currentSeq: 0,
      }));

      broadcastToAndroid({
        type: 'RESET_QUEUE',
        resetToNumber: initialNum,
      });

      await modal.alert({
        title: 'Berhasil Direset',
        message: `Urutan nomor antrian "${queue.name}" telah dikembalikan ke 0.`,
        variant: 'success',
      });
      stopInvertEffect();
    } catch {
      stopInvertEffect();
    }
  };

  const counterLabel = queue.counterLabel || 'Loket';
  const liveTicketNumber = queue.currentNumber || simulator.currentNumber || `${queue.prefix || 'A'}-000`;
  const liveCounterName = queue.currentCounter || simulator.currentCounter || activeCounter.counterName;

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#05070b',
        overflow: 'hidden',
      }}
    >
      <QueueControlDocks
        activeCounter={activeCounter}
        counterLabel={counterLabel}
        isLocked={isLocked}
        isBreak={isBreak}
        isCallingDisabled={isCallingDisabled}
        counterMenuOpen={counterMenuOpen}
        setCounterMenuOpen={setCounterMenuOpen}
        handleToggleLock={handleToggleLock}
        handleToggleBreak={handleToggleBreak}
        handleCallNext={handleCallNext}
        handleRecall={handleRecall}
        handleCallPrevious={handleCallPrevious}
        handleReset={handleReset}
        queue={queue}
        setQueue={setQueue}
        setSimulator={setSimulator}
      />

      <QueueLiveMonitorCanvas
        isBreak={isBreak}
        isLocked={isLocked}
        isInverted={isInverted}
        liveCounterName={liveCounterName}
        liveTicketNumber={liveTicketNumber}
        counterLabel={counterLabel}
        queue={queue}
        activeCounter={activeCounter}
      />
    </div>
  );
}
