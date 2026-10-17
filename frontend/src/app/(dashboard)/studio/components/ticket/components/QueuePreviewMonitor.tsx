'use client';

import React from 'react';
import { Volume2, PhoneCall, RefreshCw, Monitor, Sparkles } from 'lucide-react';
import { useQueueEditor } from '../context/QueueEditorContext';
import { injectQueueVariables } from '../types';

const Marquee = 'marquee' as any;

export default function QueuePreviewMonitor() {
  const { queue, simulator, callNextTicket, triggerChime, setQueue } = useQueueEditor();

  const handleCounterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setQueue((prev) => ({ ...prev, currentCounter: val }));
  };

  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Top simulator bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }} />
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Pratinjau Layar Monitor Antrian (Live 16:9 Canvas)
          </h4>
        </div>

        {/* Call Simulator Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Loket Pemanggil:</span>
            <select
              value={queue.currentCounter}
              onChange={handleCounterChange}
              className="form-select"
              style={{ width: 'auto', padding: '4px 10px', fontSize: '0.75rem' }}
            >
              {queue.counters.map((c) => (
                <option key={c.id} value={c.counterName}>
                  {c.counterName} {c.operatorName ? `(${c.operatorName})` : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={callNextTicket}
            className="btn btn-primary"
            style={{ padding: '6px 14px', fontSize: '0.75rem', backgroundColor: '#059669', borderColor: '#059669' }}
          >
            <PhoneCall size={13} />
            Panggil Berikutnya
          </button>

          <button
            type="button"
            onClick={triggerChime}
            disabled={simulator.isChiming}
            className="btn btn-secondary"
            style={{ padding: '6px 12px', fontSize: '0.75rem' }}
          >
            <Volume2 size={13} color={simulator.isChiming ? 'var(--primary-500)' : undefined} />
            Uji Bel
          </button>
        </div>
      </div>

      {/* 16:9 Canvas Monitor Frame */}
      <div
        style={{
          width: '100%',
          aspectRatio: '16 / 9',
          position: 'relative',
          backgroundColor: queue.backgroundColor,
          backgroundImage: queue.backgroundImageUrl ? `url(${queue.backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 20px 40px -15px rgba(0,0,0,0.4)',
        }}
      >
        {/* Render Layout Items */}
        {(() => {
          const canvasW = queue.canvasWidth || 1920;
          const canvasH = queue.canvasHeight || 1080;
          return queue.items
            .filter((it) => it.isVisible)
            .sort((a, b) => a.zIndex - b.zIndex)
            .map((item) => {
              const interpolated = injectQueueVariables(item.templateContent, {
                queueNumber: simulator.currentNumber,
                queueCounter: queue.currentCounter,
                queuePrefix: queue.prefix,
                queueName: queue.name,
              });

              // Convert canvas pixel coordinates to percentage for responsiveness
              const leftPct = (item.x / canvasW) * 100;
              const topPct = (item.y / canvasH) * 100;
              const widthPct = (item.width / canvasW) * 100;
              const heightPct = (item.height / canvasH) * 100;

            if (item.itemType === 'marquee') {
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    backgroundColor: item.backgroundColor,
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    zIndex: item.zIndex,
                  }}
                >
                  <Marquee
                    behavior="scroll"
                    direction={item.config.direction || 'left'}
                    scrollamount={item.config.speed === 'fast' ? 12 : item.config.speed === 'slow' ? 4 : 8}
                    style={{
                      width: '100%',
                      color: item.textColor,
                      fontSize: 'clamp(11px, 1.5vw, 20px)',
                      fontWeight: item.fontWeight,
                    }}
                  >
                    {interpolated}
                  </Marquee>
                </div>
              );
            }

            if (item.itemType === 'ticket_number') {
              return (
                <div
                  key={item.id}
                  style={{
                    position: 'absolute',
                    left: `${leftPct}%`,
                    top: `${topPct}%`,
                    width: `${widthPct}%`,
                    height: `${heightPct}%`,
                    backgroundColor: item.backgroundColor,
                    border: `${item.config.borderWidth || 1}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`,
                    borderRadius: `${item.config.borderRadius || 12}px`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: item.zIndex,
                    boxShadow: simulator.isChiming ? '0 0 40px rgba(59, 130, 246, 0.5)' : '0 4px 12px rgba(0,0,0,0.06)',
                    transform: simulator.isChiming ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <span
                    style={{
                      fontSize: 'clamp(9px, 1vw, 14px)',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      color: 'var(--text-muted)',
                      marginBottom: '4px',
                    }}
                  >
                    Nomor Antrian Dipanggil
                  </span>
                  <div
                    style={{
                      fontSize: 'clamp(36px, 7vw, 92px)',
                      fontWeight: item.fontWeight,
                      color: item.textColor,
                      lineHeight: 1,
                    }}
                  >
                    {interpolated}
                  </div>
                  {/* Embedded Counter Badge */}
                  <div
                    style={{
                      marginTop: '12px',
                      padding: '6px 20px',
                      borderRadius: '8px',
                      backgroundColor: '#f59e0b',
                      color: '#ffffff',
                      fontWeight: 800,
                      fontSize: 'clamp(12px, 1.6vw, 22px)',
                      letterSpacing: '0.05em',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                    }}
                  >
                    {queue.currentCounter}
                  </div>
                </div>
              );
            }

            if (item.itemType === 'counter_loket') {
              return null; // Handled directly inside the main ticket number card for clean layout
            }

            // Text Label / Title
            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  backgroundColor: item.backgroundColor,
                  color: item.textColor,
                  fontSize: 'clamp(14px, 2.2vw, 32px)',
                  fontWeight: item.fontWeight,
                  textAlign: item.textAlign,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: item.textAlign === 'center' ? 'center' : item.textAlign === 'right' ? 'flex-end' : 'flex-start',
                  zIndex: item.zIndex,
                }}
              >
                {interpolated}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}
