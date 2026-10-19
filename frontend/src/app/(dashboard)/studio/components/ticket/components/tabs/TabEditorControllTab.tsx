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
  const { queue, setQueue, simulator, triggerChime } = useQueueEditor();
  const [calling, setCalling] = useState(false);

  const activeCounter = queue.counters.find((c) => c.counterName === queue.currentCounter) || queue.counters[0] || {
    id: 'cnt-1',
    counterNumber: 1,
    counterName: `${queue.counterLabel || 'LOKET'} 01`.toUpperCase(),
    operatorName: 'Petugas 1',
    isActive: true,
    status: 'ACTIVE',
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
    if (calling) return;
    setCalling(true);
    try {
      let nextNumber = simulator.currentNumber;
      if (queue.id) {
        const res = await apiCallNextTicket(queue.id, activeCounter.id).catch(() => null);
        if (res && res.ticket && res.ticket.ticketNumber) {
          nextNumber = res.ticket.ticketNumber;
        } else {
          const nextSeq = (simulator.currentSeq || 1) + 1;
          nextNumber = `${queue.prefix || 'A'}-${String(nextSeq).padStart(3, '0')}`;
        }
      }

      setQueue((prev) => ({
        ...prev,
        currentNumber: nextNumber,
        currentCounter: activeCounter.counterName,
      }));

      recordCallHistory(nextNumber, activeCounter.counterName, 'next');

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
    if (calling) return;
    setCalling(true);
    recordCallHistory(simulator.currentNumber, activeCounter.counterName, 'recall');

    if (queue.audioChimeEnabled) {
      triggerChime();
    }

    speakQueueAnnouncement(
      simulator.currentNumber,
      activeCounter.counterName,
      true,
      () => setCalling(false),
      queue
    );
  };

  // Previous ticket call
  const handleCallPrevious = async () => {
    if (calling) return;
    setCalling(true);
    try {
      let prevNumber = simulator.currentNumber;
      if (queue.id) {
        const res = await apiCallPreviousTicket(queue.id, activeCounter.id).catch(() => null);
        if (res && res.ticket && res.ticket.ticketNumber) {
          prevNumber = res.ticket.ticketNumber;
        } else {
          const curSeq = parseInt(simulator.currentNumber.replace(/[^0-9]/g, ''), 10) || 1;
          const prevSeq = Math.max(1, curSeq - 1);
          prevNumber = `${queue.prefix || 'A'}-${String(prevSeq).padStart(3, '0')}`;
        }
      }

      setQueue((prev) => ({
        ...prev,
        currentNumber: prevNumber,
        currentCounter: activeCounter.counterName,
      }));

      recordCallHistory(prevNumber, activeCounter.counterName, 'back');

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

      speakCounterStatusAnnouncement(
        activeCounter.counterName,
        newStatus,
        queue,
        () => {}
      );
    } catch {}
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
      const initialNum = `${queue.prefix || 'A'}-001`;
      setQueue((prev) => ({
        ...prev,
        currentNumber: initialNum,
        currentSequence: 0,
      }));
      await modal.alert({
        title: 'Berhasil Direset',
        message: `Urutan nomor antrian "${queue.name}" telah dikembalikan ke 0.`,
        variant: 'success',
      });
    } catch {}
  };

  const counterLabel = queue.counterLabel || 'Loket';
  const ticketLabel = queue.ticketLabel || 'Nomor Antrian';

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '20px', width: '100%', alignItems: 'start' }}>
      {/* Kolom Kiri: Live 16:9 Canvas View */}
      <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block' }} />
            <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Monitor Siaran Langsung (Live Canvas)
            </h4>
          </div>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            {queue.canvasWidth} × {queue.canvasHeight} px
          </span>
        </div>

        {/* 16:9 Scaled Canvas Frame */}
        <div
          style={{
            width: '100%',
            aspectRatio: '16 / 9',
            position: 'relative',
            backgroundColor: queue.backgroundColor,
            backgroundImage: queue.backgroundImageUrl ? `url(${queue.backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--border-subtle)',
            boxShadow: '0 16px 32px -12px rgba(0,0,0,0.5)',
          }}
        >
          {queue.items
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
                queueNumber: simulator.currentNumber,
                queueCounter: activeCounter.counterName,
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
                  }}
                >
                  {item.itemType === 'marquee' ? <Marquee>{content}</Marquee> : content}
                </div>
              );
            })}
        </div>
      </div>

      {/* Kolom Kanan: Operator Calling Console (Icon-Only Buttons) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Ticket Monitor Card */}
        <div
          className="card-elevated"
          style={{
            padding: '24px 20px',
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            border: simulator.isChiming ? '2px solid var(--primary-500)' : '1px solid var(--border-subtle)',
            boxShadow: simulator.isChiming ? '0 0 24px rgba(59, 130, 246, 0.3)' : undefined,
            transition: 'all 0.2s ease',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            {ticketLabel}
          </span>
          <span
            style={{
              fontSize: '3.75rem',
              fontWeight: 800,
              fontFamily: 'monospace',
              letterSpacing: '0.04em',
              color: 'var(--text-primary)',
              lineHeight: 1,
              margin: '4px 0',
            }}
          >
            {simulator.currentNumber}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span
              style={{
                padding: '4px 14px',
                borderRadius: '6px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                fontWeight: 700,
              }}
            >
              {activeCounter.counterName}
            </span>
            {activeCounter.operatorName && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Petugas: <strong style={{ color: 'var(--text-secondary)' }}>{activeCounter.operatorName}</strong>
              </span>
            )}
          </div>
        </div>

        {/* Counter Selection & Status Pills */}
        <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pilih {counterLabel}:
            </label>
            <select
              value={queue.currentCounter}
              onChange={(e) => setQueue((prev) => ({ ...prev, currentCounter: e.target.value }))}
              className="form-input"
              style={{ height: '32px', padding: '0 8px', fontSize: '0.75rem', width: 'auto', maxWidth: '200px' }}
            >
              {queue.counters.map((c) => (
                <option key={c.id} value={c.counterName}>
                  {c.counterName} {c.operatorName ? `(${c.operatorName})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Status Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={() => handleStatusChange('ACTIVE')}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderColor: activeCounter.status === 'ACTIVE' ? 'var(--accent-emerald)' : 'var(--border-subtle)',
                backgroundColor: activeCounter.status === 'ACTIVE' ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                color: activeCounter.status === 'ACTIVE' ? 'var(--accent-emerald)' : 'var(--text-muted)',
                fontWeight: activeCounter.status === 'ACTIVE' ? 700 : 500,
              }}
            >
              <CheckCircle2 size={13} />
              <span>Buka</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('BREAK')}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderColor: activeCounter.status === 'BREAK' ? 'var(--accent-amber)' : 'var(--border-subtle)',
                backgroundColor: activeCounter.status === 'BREAK' ? 'rgba(245, 158, 11, 0.15)' : 'transparent',
                color: activeCounter.status === 'BREAK' ? 'var(--accent-amber)' : 'var(--text-muted)',
                fontWeight: activeCounter.status === 'BREAK' ? 700 : 500,
              }}
            >
              <Coffee size={13} />
              <span>Istirahat</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('LOCKED')}
              className="btn btn-outline"
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '5px',
                borderColor: activeCounter.status === 'LOCKED' ? 'var(--accent-rose)' : 'var(--border-subtle)',
                backgroundColor: activeCounter.status === 'LOCKED' ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                color: activeCounter.status === 'LOCKED' ? 'var(--accent-rose)' : 'var(--text-muted)',
                fontWeight: activeCounter.status === 'LOCKED' ? 700 : 500,
              }}
            >
              <Lock size={13} />
              <span>Kunci</span>
            </button>
          </div>
        </div>

        {/* Tactile Icon-Only Calling Controls */}
        <div
          className="card-elevated"
          style={{
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center' }}>
            Tombol Pemanggil Operator (Icon-Only)
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.6fr', gap: '10px' }}>
            {/* Mundur (Icon Only) */}
            <button
              type="button"
              onClick={handleCallPrevious}
              disabled={calling}
              className="btn btn-outline"
              style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
              }}
              title="Mundur ke Nomor Sebelumnya (Icon Only)"
              aria-label="Mundur ke nomor sebelumnya"
            >
              <RotateCcw size={20} />
            </button>

            {/* Panggil Ulang / Recall (Icon Only) */}
            <button
              type="button"
              onClick={handleRecall}
              disabled={calling}
              className="btn btn-outline"
              style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                color: 'var(--primary-400)',
              }}
              title="Panggil Ulang Nomor Ini (Icon Only)"
              aria-label="Panggil ulang nomor ini"
            >
              <Volume2 size={22} />
            </button>

            {/* Panggil Selanjutnya (Icon Only, Primary Accent) */}
            <button
              type="button"
              onClick={handleCallNext}
              disabled={calling}
              className="btn btn-primary"
              style={{
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '10px',
                backgroundColor: 'var(--primary-600)',
                borderColor: 'var(--primary-600)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
              title="Panggil Nomor Selanjutnya (Icon Only)"
              aria-label="Panggil nomor selanjutnya"
            >
              <ArrowRight size={24} />
            </button>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
            <button
              type="button"
              onClick={handleReset}
              className="btn btn-ghost"
              style={{ fontSize: '0.72rem', color: 'var(--text-muted)', padding: '2px 6px' }}
              title="Reset urutan nomor antrian kembali ke 0"
            >
              <RotateCcw size={12} style={{ marginRight: '4px' }} />
              <span>Reset Urutan (0)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
