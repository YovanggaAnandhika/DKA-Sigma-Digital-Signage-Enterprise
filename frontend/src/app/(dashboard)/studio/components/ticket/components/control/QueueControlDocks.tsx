'use client';

import React from 'react';
import {
  ArrowRight,
  RotateCcw,
  Volume2,
  Coffee,
  Lock,
  LockOpen,
  CheckCircle2,
  ChevronDown,
} from 'lucide-react';
import { QueueCounter, QueueDisplayConfig } from '../../types';

interface QueueControlDocksProps {
  activeCounter: QueueCounter;
  counterLabel: string;
  isLocked: boolean;
  isBreak: boolean;
  isCallingDisabled: boolean;
  counterMenuOpen: boolean;
  setCounterMenuOpen: (open: boolean) => void;
  handleToggleLock: () => void;
  handleToggleBreak: () => void;
  handleCallNext: () => void;
  handleRecall: () => void;
  handleCallPrevious: () => void;
  handleReset: () => void;
  queue: QueueDisplayConfig;
  setQueue: React.Dispatch<React.SetStateAction<QueueDisplayConfig>>;
  setSimulator: React.Dispatch<React.SetStateAction<any>>;
}

export default function QueueControlDocks({
  activeCounter,
  counterLabel,
  isLocked,
  isBreak,
  isCallingDisabled,
  counterMenuOpen,
  setCounterMenuOpen,
  handleToggleLock,
  handleToggleBreak,
  handleCallNext,
  handleRecall,
  handleCallPrevious,
  handleReset,
  queue,
  setQueue,
  setSimulator,
}: QueueControlDocksProps) {
  return (
    <>
      {/* Top Floating Control Bar */}
      <div
        style={{
          position: 'absolute',
          top: '14px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '6px 16px',
          borderRadius: '12px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          boxShadow: '0 12px 32px rgba(0, 0, 0, 0.55)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              width: '9px',
              height: '9px',
              borderRadius: '50%',
              backgroundColor: isLocked ? 'var(--accent-rose)' : isBreak ? 'var(--accent-amber)' : 'var(--accent-emerald)',
              boxShadow: `0 0 10px ${isLocked ? 'rgba(244, 63, 94, 0.8)' : isBreak ? 'rgba(245, 158, 11, 0.8)' : 'rgba(16, 185, 129, 0.8)'}`,
              display: 'inline-block',
            }}
          />
          <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#f8fafc', whiteSpace: 'nowrap', letterSpacing: '0.2px' }}>
            Monitor Live
          </span>
        </div>

        <div style={{ height: '16px', width: '1px', backgroundColor: 'rgba(255,255,255,0.18)' }} />

        {/* Dropdown Menu Pos / Loket */}
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setCounterMenuOpen(!counterMenuOpen)}
            style={{
              height: '36px',
              padding: '0 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              borderRadius: '8px',
              backgroundColor: counterMenuOpen ? 'rgba(30, 41, 59, 0.95)' : 'rgba(30, 41, 59, 0.75)',
              border: counterMenuOpen ? '1px solid var(--primary-500)' : '1px solid rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              cursor: 'pointer',
              boxShadow: counterMenuOpen ? '0 0 14px rgba(59, 130, 246, 0.35)' : 'none',
              transition: 'all 0.18s ease',
            }}
          >
            <span style={{ fontSize: '0.78rem', color: '#94a3b8', fontWeight: 600 }}>
              {counterLabel}:
            </span>
            <span style={{ fontSize: '0.84rem', fontWeight: 700, color: '#f8fafc' }}>
              {activeCounter.counterName}
            </span>
            {activeCounter.operatorName && (
              <span style={{ fontSize: '0.72rem', color: '#cbd5e1', opacity: 0.8 }}>
                ({activeCounter.operatorName})
              </span>
            )}
            <ChevronDown
              size={15}
              style={{
                color: '#94a3b8',
                transform: counterMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                marginLeft: '4px',
              }}
            />
          </button>

          {/* Floating Dropdown Options Panel */}
          {counterMenuOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 40 }}
                onClick={() => setCounterMenuOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  left: 0,
                  minWidth: '240px',
                  maxHeight: '260px',
                  overflowY: 'auto',
                  borderRadius: '10px',
                  backgroundColor: '#0f172a',
                  border: '1px solid rgba(255, 255, 255, 0.15)',
                  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.7)',
                  padding: '6px',
                  zIndex: 50,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                {queue.counters.map((c) => {
                  const isSelected = (queue.currentCounter || activeCounter.counterName) === c.counterName;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setQueue((prev) => ({ ...prev, currentCounter: c.counterName }));
                        setSimulator((prev: any) => ({ ...prev, currentCounter: c.counterName }));
                        setCounterMenuOpen(false);
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent',
                        border: isSelected ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid transparent',
                        color: isSelected ? '#ffffff' : '#cbd5e1',
                        cursor: 'pointer',
                        textAlign: 'left',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span style={{ fontSize: '0.8125rem', fontWeight: isSelected ? 700 : 600 }}>
                          {c.counterName}
                        </span>
                        {c.operatorName && (
                          <span style={{ fontSize: '0.6875rem', color: isSelected ? '#93c5fd' : '#94a3b8' }}>
                            {c.operatorName}
                          </span>
                        )}
                      </div>
                      {isSelected && <CheckCircle2 size={15} color="#38bdf8" />}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Floating Square Docking Kiri (Kontrol Akses Pos/Loket) */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 10,
          padding: '8px',
          borderRadius: '10px',
          backgroundColor: 'rgba(15, 23, 42, 0.85)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '6px',
        }}
      >
        <button
          type="button"
          onClick={handleToggleLock}
          style={{
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            backgroundColor: isLocked ? 'rgba(239, 68, 68, 0.25)' : 'rgba(16, 185, 129, 0.25)',
            border: isLocked ? '1px solid rgba(239, 68, 68, 0.5)' : '1px solid rgba(16, 185, 129, 0.5)',
            color: isLocked ? '#f87171' : '#34d399',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? `Buka kembali ${counterLabel} (${activeCounter.counterName})` : `Tutup ${counterLabel} (${activeCounter.counterName})`}
          aria-label={isLocked ? 'Buka Loket' : 'Tutup Loket'}
        >
          {isLocked ? <Lock size={18} /> : <LockOpen size={18} />}
        </button>

        <button
          type="button"
          onClick={handleToggleBreak}
          disabled={isLocked}
          style={{
            width: '42px',
            height: '42px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            backgroundColor: isBreak ? 'rgba(245, 158, 11, 0.3)' : 'rgba(30, 41, 59, 0.7)',
            border: isBreak ? '1px solid rgba(245, 158, 11, 0.6)' : '1px solid rgba(255, 255, 255, 0.1)',
            color: isBreak ? '#fbbf24' : '#94a3b8',
            cursor: isLocked ? 'not-allowed' : 'pointer',
            opacity: isLocked ? 0.35 : 1,
            transition: 'all 0.15s ease',
          }}
          title={isLocked ? `Buka ${counterLabel} terlebih dahulu sebelum istirahat` : isBreak ? 'Selesai Istirahat' : 'Mulai Jam Istirahat'}
          aria-label="Jam Istirahat"
        >
          <Coffee size={18} />
        </button>
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
    </>
  );
}
