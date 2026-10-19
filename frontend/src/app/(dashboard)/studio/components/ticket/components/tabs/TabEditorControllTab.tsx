'use client';

import React, { useState } from 'react';
import {
  ArrowRight,
  RotateCcw,
  Volume2,
  Coffee,
  Lock,
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
    } catch {}
  };

  const counterLabel = queue.counterLabel || 'Loket';

  const liveTicketNumber = queue.currentNumber || simulator.currentNumber || `${queue.prefix || 'A'}-000`;
  const liveCounterName = queue.currentCounter || simulator.currentCounter || activeCounter.counterName;

  return (
    <div
      style={{
        display: 'flex',
        gap: '16px',
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        alignItems: 'stretch',
      }}
    >
      {/* 1. SISI KIRI: Vertical Menu Status (Buka, Istirahat, Tutup via 1 Toggle) */}
      <div
        className="card-elevated"
        style={{
          width: '230px',
          flexShrink: 0,
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingBottom: '10px', borderBottom: '1px solid var(--border-subtle)' }}>
          <Users size={16} color="var(--primary-400)" />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Status {counterLabel}
          </span>
        </div>

        {/* Pilih Loket */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Pilih Pos / {counterLabel}:
          </label>
          <select
            value={queue.currentCounter}
            onChange={(e) => {
              const val = e.target.value;
              setQueue((prev) => ({ ...prev, currentCounter: val }));
              setSimulator((prev) => ({ ...prev, currentCounter: val }));
            }}
            className="form-input"
            style={{ height: '34px', padding: '0 8px', fontSize: '0.75rem', width: '100%' }}
          >
            {queue.counters.map((c) => (
              <option key={c.id} value={c.counterName}>
                {c.counterName} {c.operatorName ? `(${c.operatorName})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* 1 Tombol Toggle Buka & Tutup */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            Kontrol Akses Loket:
          </span>

          <button
            type="button"
            onClick={handleToggleLock}
            className="btn"
            style={{
              width: '100%',
              height: '46px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              borderRadius: '8px',
              backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
              border: isLocked ? '1px solid var(--accent-rose)' : '1px solid var(--accent-emerald)',
              color: isLocked ? 'var(--accent-rose)' : 'var(--accent-emerald)',
              fontWeight: 700,
              fontSize: '0.8125rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
            title={isLocked ? 'Klik untuk Buka Loket ini' : 'Klik untuk Tutup Loket ini'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isLocked ? <Lock size={16} /> : <CheckCircle2 size={16} />}
              <span>{isLocked ? 'Loket Tutup' : 'Loket Buka'}</span>
            </div>
            <span
              style={{
                fontSize: '0.6875rem',
                padding: '2px 8px',
                borderRadius: '9999px',
                backgroundColor: isLocked ? 'var(--accent-rose)' : 'var(--accent-emerald)',
                color: '#ffffff',
                fontWeight: 800,
                textTransform: 'uppercase',
              }}
            >
              {isLocked ? 'Tutup' : 'Buka'}
            </span>
          </button>

          {/* Tombol Istirahat */}
          <button
            type="button"
            onClick={handleToggleBreak}
            disabled={isLocked}
            className="btn"
            style={{
              width: '100%',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 12px',
              borderRadius: '8px',
              backgroundColor: isBreak ? 'rgba(245, 158, 11, 0.2)' : 'var(--bg-surface-elevated)',
              border: isBreak ? '1px solid var(--accent-amber)' : '1px solid var(--border-subtle)',
              color: isBreak ? 'var(--accent-amber)' : 'var(--text-secondary)',
              fontWeight: isBreak ? 700 : 500,
              fontSize: '0.8125rem',
              cursor: isLocked ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.4 : 1,
              transition: 'all 0.15s ease',
            }}
            title={isLocked ? 'Buka loket terlebih dahulu sebelum istirahat' : isBreak ? 'Kembali Buka Melayani' : 'Mulai Jam Istirahat'}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={16} />
              <span>{isBreak ? 'Sedang Istirahat' : 'Istirahat'}</span>
            </div>
            {isBreak && (
              <span
                style={{
                  fontSize: '0.6875rem',
                  padding: '2px 8px',
                  borderRadius: '9999px',
                  backgroundColor: 'var(--accent-amber)',
                  color: '#ffffff',
                  fontWeight: 800,
                }}
              >
                Aktif
              </span>
            )}
          </button>
        </div>

        {/* Status Card Detail */}
        <div
          style={{
            marginTop: 'auto',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Status Operasional:</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: isLocked ? 'var(--accent-rose)' : isBreak ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              }}
            />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isLocked ? 'var(--accent-rose)' : isBreak ? 'var(--accent-amber)' : 'var(--accent-emerald)' }}>
              {isLocked ? 'DITUTUP' : isBreak ? 'SEDANG ISTIRAHAT' : 'SIAP MELAYANI'}
            </span>
          </div>
          {activeCounter.operatorName && (
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
              Petugas: <strong style={{ color: 'var(--text-secondary)' }}>{activeCounter.operatorName}</strong>
            </span>
          )}
        </div>
      </div>

      {/* 2. SISI TENGAH: Preview Full 1 Halaman (Monitor Siaran Langsung) */}
      <div
        className="card-elevated"
        style={{
          flex: 1,
          minWidth: 0,
          height: '100%',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          overflow: 'hidden',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: isLocked ? 'var(--accent-rose)' : isBreak ? 'var(--accent-amber)' : 'var(--accent-emerald)', display: 'inline-block' }} />
            <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Monitor Siaran Langsung (Live Canvas)
            </h4>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '6px',
                backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.15)' : isBreak ? 'rgba(245, 158, 11, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: isLocked ? 'var(--accent-rose)' : isBreak ? 'var(--accent-amber)' : 'var(--accent-emerald)',
                border: isLocked ? '1px solid rgba(239, 68, 68, 0.3)' : isBreak ? '1px solid rgba(245, 158, 11, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
              }}
            >
              {isLocked ? `🔒 ${liveCounterName} DITUTUP` : isBreak ? `☕ ${liveCounterName} ISTIRAHAT` : `● ${liveCounterName} BUKA`}
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              {queue.canvasWidth} × {queue.canvasHeight} px
            </span>
          </div>
        </div>

        {/* 16:9 Scaled Responsive Canvas Frame yang Memenuhi Ruang */}
        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
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
              /* DEDICATED BREAK SCREEN LAYOUT (Layout Khusus Jam Istirahat) */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '36px 32px',
                  background: 'radial-gradient(ellipse at 50% 38%, rgba(245, 158, 11, 0.22) 0%, rgba(13, 16, 26, 0.98) 65%, #080a10 100%)',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* Ambient Glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '340px',
                    height: '340px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Top Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.08em', color: '#f59e0b', textTransform: 'uppercase' }}>
                      {queue.name || 'Layar Antrian'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.05em' }}>
                    INFORMASI LAYANAN
                  </span>
                </div>

                {/* Center Hero Card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', zIndex: 1, maxWidth: '640px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '24px',
                      backgroundColor: 'rgba(245, 158, 11, 0.16)',
                      border: '2px solid rgba(245, 158, 11, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#fbbf24',
                      boxShadow: '0 0 35px rgba(245, 158, 11, 0.28)',
                    }}
                  >
                    <Coffee size={40} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '2.4rem',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                      }}
                    >
                      SEDANG ISTIRAHAT
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                      <span
                        style={{
                          padding: '4px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(245, 158, 11, 0.25)',
                          border: '1px solid rgba(245, 158, 11, 0.5)',
                          color: '#fef3c7',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {liveCounterName}
                      </span>
                      {activeCounter.operatorName && (
                        <span style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                          Petugas: <strong style={{ color: '#ffffff' }}>{activeCounter.operatorName}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      lineHeight: 1.6,
                      maxWidth: '500px',
                    }}
                  >
                    Petugas saat ini sedang dalam jam istirahat. Layanan antrian akan dibuka kembali segera. Mohon menunggu dengan tertib, terima kasih.
                  </p>
                </div>

                {/* Bottom Footer Bar */}
                <div
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#fde68a',
                    zIndex: 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Coffee size={13} />
                    <span>Status Operasional: <strong>Istirahat Sementara</strong></span>
                  </div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Silakan menunggu panggilan berikutnya</span>
                </div>
              </div>
            ) : isLocked ? (
              /* DEDICATED CLOSED SCREEN LAYOUT (Layout Khusus Loket Ditutup) */
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '36px 32px',
                  background: 'radial-gradient(ellipse at 50% 38%, rgba(239, 68, 68, 0.22) 0%, rgba(13, 16, 26, 0.98) 65%, #080a10 100%)',
                  color: '#ffffff',
                  boxSizing: 'border-box',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                {/* Ambient Glow */}
                <div
                  style={{
                    position: 'absolute',
                    top: '30%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '340px',
                    height: '340px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    filter: 'blur(60px)',
                    pointerEvents: 'none',
                  }}
                />

                {/* Top Header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
                    <span style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.08em', color: '#f87171', textTransform: 'uppercase' }}>
                      {queue.name || 'Layar Antrian'}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.72rem', fontWeight: 600, color: 'rgba(255, 255, 255, 0.45)', letterSpacing: '0.05em' }}>
                    PEMBERITAHUAN OPERASIONAL
                  </span>
                </div>

                {/* Center Hero Card */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px', zIndex: 1, maxWidth: '640px' }}>
                  <div
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '24px',
                      backgroundColor: 'rgba(239, 68, 68, 0.16)',
                      border: '2px solid rgba(239, 68, 68, 0.45)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#f87171',
                      boxShadow: '0 0 35px rgba(239, 68, 68, 0.28)',
                    }}
                  >
                    <Lock size={38} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <h2
                      style={{
                        margin: 0,
                        fontSize: '2.4rem',
                        fontWeight: 900,
                        letterSpacing: '0.04em',
                        color: '#ffffff',
                        lineHeight: 1.1,
                        textShadow: '0 2px 12px rgba(0,0,0,0.6)',
                      }}
                    >
                      LOKET DITUTUP
                    </h2>
                    <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '4px' }}>
                      <span
                        style={{
                          padding: '4px 16px',
                          borderRadius: '8px',
                          backgroundColor: 'rgba(239, 68, 68, 0.25)',
                          border: '1px solid rgba(239, 68, 68, 0.5)',
                          color: '#fecaca',
                          fontSize: '0.95rem',
                          fontWeight: 800,
                          letterSpacing: '0.04em',
                        }}
                      >
                        {liveCounterName}
                      </span>
                      {activeCounter.operatorName && (
                        <span style={{ fontSize: '0.8125rem', color: '#cbd5e1' }}>
                          Petugas: <strong style={{ color: '#ffffff' }}>{activeCounter.operatorName}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <p
                    style={{
                      margin: '6px 0 0 0',
                      fontSize: '0.875rem',
                      color: '#94a3b8',
                      lineHeight: 1.6,
                      maxWidth: '500px',
                    }}
                  >
                    Mohon maaf, layanan antrian pada loket ini saat ini sedang ditutup. Silakan menuju loket lain yang sedang buka atau hubungi meja informasi.
                  </p>
                </div>

                {/* Bottom Footer Bar */}
                <div
                  style={{
                    width: '100%',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                    color: '#fca5a5',
                    zIndex: 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Lock size={13} />
                    <span>Status Operasional: <strong>Loket Tidak Beroperasi</strong></span>
                  </div>
                  <span style={{ color: 'rgba(255, 255, 255, 0.45)' }}>Silakan menuju loket yang beroperasi</span>
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

      {/* 3. SISI KANAN: Vertical Menu Calling Action (Next, Recall, Sebelumnya, Reset) */}
      <div
        className="card-elevated"
        style={{
          width: '94px',
          flexShrink: 0,
          padding: '16px 10px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          backgroundColor: 'var(--bg-surface)',
        }}
      >
        <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase' }}>
          Aksi
        </span>

        {/* 1. Tombol Next (Selanjutnya) */}
        <button
          type="button"
          onClick={handleCallNext}
          disabled={isCallingDisabled}
          className="btn btn-primary"
          style={{
            width: '100%',
            height: '64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '4px',
            borderRadius: '12px',
            backgroundColor: isCallingDisabled ? 'var(--bg-surface-elevated)' : 'var(--primary-600)',
            borderColor: isCallingDisabled ? 'var(--border-subtle)' : 'var(--primary-600)',
            color: isCallingDisabled ? 'var(--text-muted)' : '#ffffff',
            boxShadow: isCallingDisabled ? 'none' : '0 4px 14px rgba(37, 99, 235, 0.35)',
            cursor: isCallingDisabled ? 'not-allowed' : 'pointer',
            opacity: isCallingDisabled ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? 'Loket sedang ditutup. Buka loket terlebih dahulu.' : 'Panggil Nomor Selanjutnya (Next)'}
          aria-label="Panggil nomor selanjutnya"
        >
          <ArrowRight size={26} />
          <span style={{ fontSize: '0.6875rem', fontWeight: 700 }}>Next</span>
        </button>

        {/* 2. Tombol Recall (Panggil Ulang) */}
        <button
          type="button"
          onClick={handleRecall}
          disabled={isCallingDisabled}
          className="btn btn-outline"
          style={{
            width: '100%',
            height: '56px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            borderRadius: '10px',
            color: isCallingDisabled ? 'var(--text-muted)' : 'var(--primary-400)',
            cursor: isCallingDisabled ? 'not-allowed' : 'pointer',
            opacity: isCallingDisabled ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? 'Loket sedang ditutup.' : 'Panggil Ulang Nomor Ini (Recall)'}
          aria-label="Panggil ulang nomor ini"
        >
          <Volume2 size={22} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Ulang</span>
        </button>

        {/* 3. Tombol Sebelumnya (Mundur) */}
        <button
          type="button"
          onClick={handleCallPrevious}
          disabled={isCallingDisabled}
          className="btn btn-outline"
          style={{
            width: '100%',
            height: '52px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            borderRadius: '10px',
            color: 'var(--text-muted)',
            cursor: isCallingDisabled ? 'not-allowed' : 'pointer',
            opacity: isCallingDisabled ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? 'Loket sedang ditutup.' : 'Mundur ke Nomor Sebelumnya'}
          aria-label="Mundur ke nomor sebelumnya"
        >
          <RotateCcw size={19} />
          <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Mundur</span>
        </button>

        <div style={{ flex: 1, minHeight: '10px' }} />

        {/* 4. Reset Urutan (0) */}
        <button
          type="button"
          onClick={handleReset}
          className="btn btn-ghost"
          style={{
            width: '100%',
            padding: '6px 2px',
            fontSize: '0.625rem',
            color: 'var(--text-muted)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '2px',
          }}
          title="Reset urutan nomor antrian kembali ke 0"
        >
          <RotateCcw size={13} />
          <span>Reset (0)</span>
        </button>
      </div>
    </div>
  );
}
