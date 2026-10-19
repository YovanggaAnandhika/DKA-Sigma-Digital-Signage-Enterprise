'use client';

import React from 'react';
import { QueueCounter, QueueDisplayConfig, injectQueueVariables } from '../../types';

const Marquee = 'marquee' as any;

interface QueueLiveMonitorCanvasProps {
  isBreak: boolean;
  isLocked: boolean;
  isInverted: boolean;
  liveCounterName: string;
  liveTicketNumber: string;
  counterLabel: string;
  queue: QueueDisplayConfig;
  activeCounter: QueueCounter;
}

export default function QueueLiveMonitorCanvas({
  isBreak,
  isLocked,
  isInverted,
  liveCounterName,
  liveTicketNumber,
  counterLabel,
  queue,
  activeCounter,
}: QueueLiveMonitorCanvasProps) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        flex: 1,
        minHeight: 0,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: isLocked ? '#080a10' : isBreak ? '#0a0d14' : queue.backgroundColor,
        backgroundImage: isLocked || isBreak ? undefined : queue.backgroundImageUrl ? `url(${queue.backgroundImageUrl})` : undefined,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        filter: isInverted ? 'invert(1)' : 'none',
        transition: 'filter 140ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          position: 'relative',
          overflow: 'hidden',
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
  );
}
