'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Volume2,
  Coffee,
  Lock,
  LockOpen,
  CheckCircle2,
  Users,
} from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { injectQueueVariables, speakQueueAnnouncement, speakCounterStatusAnnouncement, QUEUE_HISTORY_STORAGE_KEY, QueueCallHistoryItem } from '../../types';
import { callNextTicket as apiCallNextTicket, callPreviousTicket as apiCallPreviousTicket, resetQueue as apiResetQueue, setCounterStatus as apiSetCounterStatus } from '@/lib/services/studio/queue.service';
import { modal } from '@/components/ui/ModalDialog';

const Marquee = 'marquee' as any;

export default function TabEditorControllTab() {
  const { queue, setQueue, simulator, setSimulator, triggerChime } = useQueueEditor();
  const [calling, setCalling] = useState(false);

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
  const isOpen = activeCounter.status === 'ACTIVE';

  // Sesuai permintaan: saat ditutup tombol kontrol pemanggil dinonaktifkan
  const isCallingDisabled = calling || isLocked;

  const broadcastToAndroid = (payload: Record<string, any>) => {
    try {
      fetch('/api/stream/device', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: 'all',
          queueId: queue.id,
          ...payload,
        }),
      }).catch(() => { });
    } catch { }
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
    } catch { }
  };

  // Next ticket call
  const handleCallNext = async () => {
    if (isCallingDisabled) return;
    setCalling(true);
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
      }

      speakQueueAnnouncement(
        nextNumber,
        activeCounter.counterName,
        false,
        () => setCalling(false),
        queue
      );
    } catch {
      setCalling(false);
    }
  };

  // Recall current ticket
  const handleRecall = () => {
    if (isCallingDisabled) return;
    setCalling(true);
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
    }

    speakQueueAnnouncement(
      curNumber,
      activeCounter.counterName,
      true,
      () => setCalling(false),
      queue
    );
  };

  // Previous ticket call
  const handleCallPrevious = async () => {
    if (isCallingDisabled) return;
    setCalling(true);
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
      }

      speakQueueAnnouncement(
        prevNumber,
        activeCounter.counterName,
        false,
        () => setCalling(false),
        queue
      );
    } catch {
      setCalling(false);
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
        () => { }
      );
    } catch { }
  };

  // Toggle Buka / Tutup 1 tombol pengecekan status
  const handleToggleLock = () => {
    if (isLocked) {
      handleStatusChange('ACTIVE');
    } else {
      handleStatusChange('LOCKED');
    }
  };

  // Toggle Istirahat
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
    } catch { }
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
      {/* Top Floating Control Bar (Pilihan Pos / Counter, Status, & Resolusi) */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '6px 14px',
          borderRadius: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
        }}
      >
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLocked ? 'var(--accent-rose)' : isBreak ? 'var(--accent-amber)' : 'var(--accent-emerald)', display: 'inline-block' }} />
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap' }}>
          Monitor Live
        </span>

        <div style={{ height: '14px', width: '1px', backgroundColor: 'rgba(255,255,255,0.15)' }} />

        {/* Dropdown Pos / Counter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ fontSize: '0.7rem', fontWeight: 600, color: '#94a3b8', whiteSpace: 'nowrap' }}>
            {counterLabel}:
          </span>
          <select
            value={queue.currentCounter || activeCounter.counterName}
            onChange={(e) => {
              const val = e.target.value;
              setQueue((prev) => ({ ...prev, currentCounter: val }));
              setSimulator((prev) => ({ ...prev, currentCounter: val }));
            }}
            style={{
              height: '26px',
              padding: '0 8px',
              fontSize: '0.72rem',
              fontWeight: 600,
              minWidth: '150px',
              maxWidth: '220px',
              backgroundColor: 'rgba(30, 41, 59, 0.8)',
              borderColor: 'rgba(255, 255, 255, 0.12)',
              borderRadius: '6px',
              cursor: 'pointer',
              color: '#f8fafc',
              outline: 'none',
            }}
          >
            {queue.counters.map((c) => (
              <option key={c.id} value={c.counterName} style={{ backgroundColor: '#0f172a', color: '#f8fafc' }}>
                {c.counterName} {c.operatorName ? `(${c.operatorName})` : ''}
              </option>
            ))}
          </select>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: '0.65rem',
            fontWeight: 600,
            padding: '2px 8px',
            borderRadius: '5px',
            backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.2)' : isBreak ? 'rgba(245, 158, 11, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            color: isLocked ? '#f87171' : isBreak ? '#fbbf24' : '#34d399',
            border: isLocked ? '1px solid rgba(239, 68, 68, 0.35)' : isBreak ? '1px solid rgba(245, 158, 11, 0.35)' : '1px solid rgba(16, 185, 129, 0.35)',
            whiteSpace: 'nowrap',
          }}
        >
          {isLocked ? <Lock size={11} /> : isBreak ? <Coffee size={11} /> : <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />}
          <span>{liveCounterName} • {isLocked ? 'DITUTUP' : isBreak ? 'ISTIRAHAT' : 'BUKA'}</span>
        </div>

        <span style={{ fontSize: '0.6875rem', color: '#64748b', whiteSpace: 'nowrap' }}>
          {queue.canvasWidth} × {queue.canvasHeight}
        </span>
      </div>

      {/* Floating Square Docking Kiri (Kontrol Akses Pos/Loket) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          zIndex: 10,
          width: '170px',
          padding: '12px 10px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', paddingBottom: '6px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)' }}>
          <Users size={14} color="#38bdf8" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f8fafc' }}>
            {counterLabel}
          </span>
        </div>

        {/* Info Pos Aktif */}
        <div
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px',
          }}
        >
          <span style={{ fontSize: '0.625rem', color: '#94a3b8', fontWeight: 600 }}>
            {counterLabel} Aktif:
          </span>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {activeCounter.counterName}
          </span>
          {activeCounter.operatorName && (
            <span style={{ fontSize: '0.625rem', color: '#cbd5e1', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {activeCounter.operatorName}
            </span>
          )}
        </div>

        {/* Tombol Buka/Tutup */}
        <button
          type="button"
          onClick={handleToggleLock}
          style={{
            width: '100%',
            padding: '7px 8px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            borderRadius: '6px',
            backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            border: isLocked ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
            color: isLocked ? '#f87171' : '#34d399',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? `Buka kembali ${counterLabel} ini` : `Tutup ${counterLabel} ini`}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            {isLocked ? <Lock size={12} /> : <LockOpen size={12} />}
            <span style={{ fontSize: '0.72rem' }}>{isLocked ? 'Ditutup' : 'Dibuka'}</span>
          </div>
          <span style={{ fontSize: '0.58rem', opacity: 0.85 }}>
            {isLocked ? 'Klik Buka' : 'Klik Tutup'}
          </span>
        </button>

        {/* Tombol Istirahat */}
        <button
          type="button"
          onClick={handleToggleBreak}
          disabled={isLocked}
          style={{
            width: '100%',
            padding: '6px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            borderRadius: '6px',
            backgroundColor: isBreak ? 'rgba(245, 158, 11, 0.25)' : 'rgba(30, 41, 59, 0.6)',
            border: isBreak ? '1px solid rgba(245, 158, 11, 0.5)' : '1px solid rgba(255, 255, 255, 0.08)',
            color: isBreak ? '#fbbf24' : '#cbd5e1',
            fontWeight: isBreak ? 600 : 500,
            fontSize: '0.72rem',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.4 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? `Buka ${counterLabel} terlebih dahulu sebelum istirahat` : isBreak ? 'Selesaikan jam istirahat' : 'Mulai jam istirahat'}
        >
          <Coffee size={12} />
          <span>{isBreak ? 'Selesai Istirahat' : 'Istirahat'}</span>
        </button>

        {/* Status Operasional */}
        <div
          style={{
            padding: '6px 8px',
            borderRadius: '6px',
            backgroundColor: 'rgba(30, 41, 59, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: isLocked ? '#f87171' : isBreak ? '#fbbf24' : '#34d399',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: '0.625rem', fontWeight: 700, color: isLocked ? '#f87171' : isBreak ? '#fbbf24' : '#34d399', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {isLocked ? 'DITUTUP' : isBreak ? 'ISTIRAHAT' : 'SIAP MELAYANI'}
          </span>
        </div>
      </div>

      {/* Floating Square Docking Kanan (Tombol Aksi Panggil Tiket) */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          zIndex: 10,
          width: '74px',
          padding: '12px 6px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.5)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <span style={{ fontSize: '0.625rem', fontWeight: 700, color: '#94a3b8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Aksi
        </span>

        {/* Tombol Next */}
        <button
          type="button"
          onClick={handleCallNext}
          disabled={isCallingDisabled}
          style={{
            width: '100%',
            height: '54px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            borderRadius: '8px',
            backgroundColor: isCallingDisabled ? 'rgba(30, 41, 59, 0.5)' : '#2563eb',
            border: isCallingDisabled ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #3b82f6',
            color: isCallingDisabled ? '#64748b' : '#ffffff',
            boxShadow: isCallingDisabled ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.4)',
            cursor: isCallingDisabled ? 'not-allowed' : 'pointer',
            opacity: isCallingDisabled ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? 'Loket sedang ditutup. Buka loket terlebih dahulu.' : 'Panggil Nomor Selanjutnya (Next)'}
        >
          <ArrowRight size={22} />
          <span style={{ fontSize: '0.65rem', fontWeight: 700 }}>Next</span>
        </button>

        {/* Tombol Ulang */}
        <button
          type="button"
          onClick={handleRecall}
          disabled={isCallingDisabled}
          style={{
            width: '100%',
            height: '44px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            borderRadius: '8px',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: isCallingDisabled ? '#64748b' : '#38bdf8',
            cursor: isCallingDisabled ? 'not-allowed' : 'pointer',
            opacity: isCallingDisabled ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? 'Loket sedang ditutup.' : 'Panggil Ulang Nomor Ini (Recall)'}
        >
          <Volume2 size={17} />
          <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Ulang</span>
        </button>

        {/* Tombol Mundur */}
        <button
          type="button"
          onClick={handleCallPrevious}
          disabled={isCallingDisabled}
          style={{
            width: '100%',
            height: '42px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '2px',
            borderRadius: '8px',
            backgroundColor: 'rgba(30, 41, 59, 0.6)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: isCallingDisabled ? '#64748b' : '#cbd5e1',
            cursor: isCallingDisabled ? 'not-allowed' : 'pointer',
            opacity: isCallingDisabled ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? 'Loket sedang ditutup.' : 'Mundur ke Nomor Sebelumnya'}
        >
          <RotateCcw size={15} />
          <span style={{ fontSize: '0.6rem', fontWeight: 600 }}>Mundur</span>
        </button>

        {/* Reset (0) */}
        <button
          type="button"
          onClick={handleReset}
          style={{
            width: '100%',
            padding: '4px 2px',
            fontSize: '0.58rem',
            color: '#64748b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'transparent',
            border: 'none',
            cursor: 'pointer',
          }}
          title="Reset urutan nomor antrian kembali ke 0"
        >
          <RotateCcw size={11} />
          <span>Reset (0)</span>
        </button>
      </div>

      {/* Monitor Canvas Frame yang Memenuhi Seluruh Ruang Layar (100% Full) */}
      <div
        style={{
          width: '100%',
          height: '100%',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          overflow: 'hidden',
          backgroundColor: '#05070b',
        }}
      >
          <div
            style={{
              width: '100%',
              maxWidth: '100%',
              maxHeight: '100%',
              aspectRatio: '16 / 9',
              position: 'relative',
              backgroundColor: isLocked ? '#080a10' : isBreak ? '#0a0d14' : queue.backgroundColor,
              backgroundImage: (isLocked || isBreak) ? undefined : (queue.backgroundImageUrl ? `url(${queue.backgroundImageUrl})` : undefined),
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '12px',
              overflow: 'hidden',
              border: isLocked ? '1px solid rgba(239, 68, 68, 0.4)' : isBreak ? '1px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border-subtle)',
              boxShadow: '0 16px 32px -12px rgba(0,0,0,0.5)',
            }}
          >
            {isBreak ? (
              /* DEDICATED BREAK SCREEN LAYOUT (100% Identik dengan Android UI) */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '32px 24px',
                  backgroundColor: '#0D111A',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  gap: '24px',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(2rem, 3.6vw, 3.2rem)',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: '#F59E0B',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  SEDANG ISTIRAHAT
                </h1>

                <div
                  style={{
                    width: '85%',
                    maxWidth: '680px',
                    padding: '16px 28px',
                    borderRadius: '14px',
                    backgroundColor: '#D97706',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(217, 119, 6, 0.3)',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: 'clamp(1.2rem, 2vw, 1.7rem)',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {liveCounterName}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    color: '#94A3B8',
                    fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
                    lineHeight: 1.5,
                  }}
                >
                  <span>Petugas sedang dalam jam istirahat.</span>
                  <span>Layanan akan dibuka kembali segera.</span>
                </div>
              </div>
            ) : isLocked ? (
              /* DEDICATED CLOSED SCREEN LAYOUT (100% Identik dengan Android UI) */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '32px 24px',
                  backgroundColor: '#0B0E17',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  gap: '24px',
                }}
              >
                <h1
                  style={{
                    margin: 0,
                    fontSize: 'clamp(2rem, 3.6vw, 3.2rem)',
                    fontWeight: 900,
                    letterSpacing: '0.04em',
                    color: '#EF4444',
                    lineHeight: 1.1,
                    textTransform: 'uppercase',
                  }}
                >
                  {counterLabel.toUpperCase()} DITUTUP
                </h1>

                <div
                  style={{
                    width: '85%',
                    maxWidth: '680px',
                    padding: '16px 28px',
                    borderRadius: '14px',
                    backgroundColor: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 4px 16px rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: 'clamp(1.2rem, 2vw, 1.7rem)',
                      fontWeight: 800,
                      letterSpacing: '0.04em',
                      textTransform: 'uppercase',
                    }}
                  >
                    {liveCounterName}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                    color: '#94A3B8',
                    fontSize: 'clamp(0.95rem, 1.5vw, 1.15rem)',
                    lineHeight: 1.5,
                  }}
                >
                  <span>Mohon maaf, layanan antrian pada {counterLabel.toLowerCase()} ini sedang ditutup.</span>
                  <span>Silakan menuju {counterLabel.toLowerCase()} lain yang beroperasi.</span>
                </div>
              </div>
            ) : (
              /* NORMAL ACTIVE TICKET CANVAS ITEMS */
              queue.items
                .filter((it) => it.isVisible)
                .sort((a, b) => a.zIndex - b.zIndex)
                .map((item) => {
                  const canvasW = queue.canvasWidth || 1920;
                  const canvasH = queue.canvasHeight || 1080;
                  const leftPercent = (item.x / canvasW) * 100;
                  const topPercent = (item.y / canvasH) * 100;
                  const widthPercent = (item.width / canvasW) * 100;
                  const heightPercent = (item.height / canvasH) * 100;

                  const content = injectQueueVariables(item.templateContent, {
                    queueNumber: liveTicketNumber,
                    queueCounter: liveCounterName,
                    queuePrefix: queue.prefix,
                    queueName: queue.name,
                    operatorName: activeCounter.operatorName || 'Petugas',
                    counterLabel: queue.counterLabel,
                  });

                  return (
                    <div
                      key={item.id}
                      style={{
                        position: 'absolute',
                        left: `${leftPercent}%`,
                        top: `${topPercent}%`,
                        width: `${widthPercent}%`,
                        height: `${heightPercent}%`,
                        backgroundColor: item.backgroundColor,
                        color: item.textColor,
                        fontSize: `calc(${item.fontSize}px * 0.35)`,
                        fontWeight: item.fontWeight as any,
                        textAlign: item.textAlign as any,
                        borderRadius: `${(item.borderRadius || 0) * 0.35}px`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent:
                          item.textAlign === 'center' ? 'center' : item.textAlign === 'right' ? 'flex-end' : 'flex-start',
                        padding: '0 4px',
                        boxSizing: 'border-box',
                        overflow: 'hidden',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {item.itemType === 'marquee' ? <Marquee>{content}</Marquee> : content}
                    </div>
                  );
                })
            )}
        </div>
      </div>
    </div>
  );
}
