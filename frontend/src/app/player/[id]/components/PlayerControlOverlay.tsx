'use client';

import React from 'react';
import { Volume2 } from 'lucide-react';

interface PlayerControlOverlayProps {
  isSleeping: boolean;
  wakeTime?: string;
  canvasW: number;
  canvasH: number;
  queueState: { ticket: string; counter: string; isCalling: boolean };
  triggerQueueCall: (customTicket?: string, customCounter?: string) => void;
  isAudioDucked: boolean;
}

export default function PlayerControlOverlay({
  isSleeping,
  wakeTime,
  canvasW,
  canvasH,
  queueState,
  triggerQueueCall,
  isAudioDucked,
}: PlayerControlOverlayProps) {
  return (
    <>
      {/* Standby CEC Sleep Mode Screen Overlay */}
      {isSleeping && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: '#000000',
            zIndex: 999998,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#334155',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              padding: '8px 16px',
              borderRadius: '9999px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#64748b' }} />
            <span>Mode Standby Hemat Energi (CEC) • Bangun pukul {wakeTime || '06:00'}</span>
          </div>
        </div>
      )}

      {/* Interactive Kiosk Simulator Controls Pill */}
      <div
        style={{
          position: 'fixed',
          bottom: '12px',
          right: '12px',
          padding: '6px 14px',
          borderRadius: '9999px',
          backgroundColor: 'rgba(10, 13, 20, 0.88)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          color: '#94a3b8',
          fontSize: '0.75rem',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          zIndex: 99999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981' }} />
          <span>Kiosk • {canvasW}×{canvasH}</span>
        </div>

        <div style={{ width: '1px', height: '14px', backgroundColor: 'rgba(255,255,255,0.2)' }} />

        {/* Simulasi Panggil Antrian Button */}
        <button
          onClick={() => triggerQueueCall('A-001', 'LOKET 01')}
          disabled={queueState.isCalling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: queueState.isCalling ? 'rgba(16, 185, 129, 0.2)' : '#10b981',
            color: '#ffffff',
            border: 'none',
            borderRadius: '9999px',
            padding: '4px 12px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            cursor: queueState.isCalling ? 'not-allowed' : 'pointer',
          }}
          title="Klik untuk mensimulasikan panggilan suara TTS antrian dan audio ducking video"
        >
          <Volume2 size={13} />
          <span>{queueState.isCalling ? 'Memanggil...' : 'Simulasi Panggil A-001'}</span>
        </button>

        <button
          onClick={() => triggerQueueCall('A-002', 'LOKET 02')}
          disabled={queueState.isCalling}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            color: '#ffffff',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: '9999px',
            padding: '4px 10px',
            fontSize: '0.6875rem',
            fontWeight: 700,
            cursor: queueState.isCalling ? 'not-allowed' : 'pointer',
          }}
        >
          <span>A-002</span>
        </button>

        {/* Audio Volume Status Indicator */}
        <div
          style={{
            fontSize: '0.6875rem',
            color: isAudioDucked ? '#10b981' : '#94a3b8',
            fontWeight: 700,
          }}
        >
          Vol: {isAudioDucked ? '15% (Ducked)' : '100%'}
        </div>
      </div>
    </>
  );
}
