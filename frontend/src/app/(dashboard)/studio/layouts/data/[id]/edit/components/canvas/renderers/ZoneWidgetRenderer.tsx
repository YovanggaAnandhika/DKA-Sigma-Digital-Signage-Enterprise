'use client';

import React from 'react';
import { RotateCcw, Bell } from 'lucide-react';
import { Layer } from '../../../context/LayoutStateContext';
import { injectQueueVariables, createDefaultQueueLayoutItems } from '@/app/(dashboard)/studio/components/ticket/types';

const Marquee = 'marquee' as any;

interface ZoneWidgetRendererProps {
  activeBlock: any;
  layer: Layer;
  scale: number;
  isPlaying: boolean;
  isSelected: boolean;
  filterCssString: string;
  isCallingQueue: boolean;
  onNextCall: (block: any) => void;
  onRepeatCall: (block: any) => void;
}

export default function ZoneWidgetRenderer({
  activeBlock,
  layer: z,
  scale,
  isPlaying,
  isSelected,
  filterCssString,
  isCallingQueue,
  onNextCall,
  onRepeatCall,
}: ZoneWidgetRendererProps) {
  if (activeBlock.widgetType === 'webview') {
    return (
      <iframe
        src={activeBlock.widgetData?.url || 'about:blank'}
        title={activeBlock.widgetData?.name || z.name}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          border: 'none',
          filter: filterCssString,
          pointerEvents: isPlaying ? 'auto' : 'none',
        }}
      />
    );
  }

  if (activeBlock.widgetType === 'ticker') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor:
            activeBlock.widgetData?.backgroundColor ||
            (activeBlock.widgetData?.theme === 'blue'
              ? '#1e3a8a'
              : activeBlock.widgetData?.theme === 'red'
              ? '#991b1b'
              : activeBlock.widgetData?.theme === 'emerald'
              ? '#065f46'
              : activeBlock.widgetData?.theme === 'amber'
              ? '#92400e'
              : '#111827'),
          color: activeBlock.widgetData?.textColor || '#ffffff',
          borderRadius: activeBlock.widgetData?.borderRadius ? `${Math.round(activeBlock.widgetData.borderRadius * scale)}px` : undefined,
          border: activeBlock.widgetData?.borderColor ? `${Math.max(1, Math.round(scale))}px solid ${activeBlock.widgetData.borderColor}` : undefined,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          padding: `0 ${Math.max(3, Math.round(12 * scale))}px`,
          gap: `${Math.max(3, Math.round(12 * scale))}px`,
        }}
      >
        {activeBlock.widgetData?.badge && (
          <span
            style={{
              backgroundColor: activeBlock.widgetData?.badgeBackgroundColor || 'rgba(255,255,255,0.2)',
              color: activeBlock.widgetData?.badgeTextColor || '#ffffff',
              padding: `${Math.max(1, Math.round(2 * scale))}px ${Math.max(3, Math.round(8 * scale))}px`,
              borderRadius: `${Math.max(2, Math.round(4 * scale))}px`,
              fontWeight: 800,
              fontSize: `${Math.max(7, Math.round(12 * scale))}px`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {activeBlock.widgetData.badge}
          </span>
        )}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', alignItems: 'center' }}>
          <Marquee
            scrollamount={
              activeBlock.widgetData?.speed === 'fast'
                ? Math.max(3, Math.round(12 * scale))
                : activeBlock.widgetData?.speed === 'slow'
                ? Math.max(1, Math.round(4 * scale))
                : Math.max(2, Math.round(7 * scale))
            }
            style={{
              fontSize: `${Math.max(8, Math.round((activeBlock.widgetData?.fontSize || 16) * scale))}px`,
              fontWeight: 600,
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {(activeBlock.widgetData?.messagesList || activeBlock.widgetData?.messages || ['DKASigma Teks Berjalan']).join('  ✦  ')}
          </Marquee>
        </div>
      </div>
    );
  }

  if (activeBlock.widgetType === 'clock') {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: activeBlock.widgetData?.backgroundColor || 'var(--bg-surface-elevated)',
          color: activeBlock.widgetData?.textColor || 'var(--text-primary)',
          borderRadius: activeBlock.widgetData?.borderRadius ? `${Math.round(activeBlock.widgetData.borderRadius * scale)}px` : undefined,
          border: activeBlock.widgetData?.borderColor ? `${Math.max(1, Math.round(scale))}px solid ${activeBlock.widgetData.borderColor}` : undefined,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${Math.max(3, Math.round(12 * scale))}px`,
        }}
      >
        <div style={{
          fontSize: `${Math.max(10, Math.round((activeBlock.widgetData?.timeFontSize ? activeBlock.widgetData.timeFontSize * 0.7 : 36.4) * scale))}px`,
          fontWeight: 800,
          letterSpacing: '0.02em',
          fontFamily: 'inherit',
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}>
          {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: activeBlock.widgetData?.showSeconds ? '2-digit' : undefined })}
        </div>
        <div style={{
          fontSize: `${Math.max(7, Math.round((activeBlock.widgetData?.dateFontSize || 14) * scale))}px`,
          color: activeBlock.widgetData?.subtitleColor || 'var(--text-muted)',
          marginTop: `${Math.max(1, Math.round(4 * scale))}px`
        }}>
          {activeBlock.widgetData?.city || 'Makassar'} &bull; Cerah 31°C
        </div>
      </div>
    );
  }

  if (activeBlock.widgetType === 'queue') {
    const qData = activeBlock.widgetData || {};
    const canvasW = qData.canvasWidth || 1920;
    const canvasH = qData.canvasHeight || 1080;
    const rawItems = (qData.itemsList && qData.itemsList.length > 0)
      ? qData.itemsList
      : (qData.items && qData.items.length > 0)
      ? qData.items
      : createDefaultQueueLayoutItems(qData.themePreset || 'clean-light');

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          backgroundColor: activeBlock.widgetData?.backgroundColor || 'var(--bg-surface)',
          backgroundImage: activeBlock.widgetData?.backgroundImageUrl ? `url(${activeBlock.widgetData.backgroundImageUrl})` : undefined,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          overflow: 'hidden',
          containerType: 'size',
          filter: isCallingQueue ? 'invert(1)' : 'none',
          transition: isCallingQueue ? 'filter 140ms ease-out' : 'filter 180ms ease-in-out',
        }}
      >
        {rawItems
          .filter((it: any) => it.isVisible !== false)
          .sort((a: any, b: any) => (a.zIndex || 1) - (b.zIndex || 1))
          .map((item: any) => {
            const interpolated = injectQueueVariables(item.templateContent || '', {
              queueNumber: qData.latestCalledNumber || qData.currentNumber || 'A-001',
              queueCounter: (qData.countersList && qData.countersList.length > 0 ? qData.countersList[0].counterName : qData.currentCounter) || 'LOKET 01',
              queuePrefix: qData.prefix || 'A',
              queueName: qData.name || 'Layar Antrian',
            });

            const leftPct = (item.x / canvasW) * 100;
            const topPct = (item.y / canvasH) * 100;
            const widthPct = (item.width / canvasW) * 100;
            const heightPct = (item.height / canvasH) * 100;
            const fontSizeCqw = `calc(${item.fontSize || 24} / ${canvasW} * 100cqw)`;
            const borderRadiusCqw = item.config?.borderRadius
              ? `calc(${item.config.borderRadius} / ${canvasW} * 100cqw)`
              : undefined;

            const hasBg = item.backgroundColor && item.backgroundColor !== 'transparent';

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
                    backgroundColor: hasBg ? item.backgroundColor : 'transparent',
                    borderRadius: borderRadiusCqw,
                    border: hasBg && item.config?.borderWidth
                      ? `${item.config.borderWidth}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 calc(12 / 1920 * 100cqw)',
                    overflow: 'hidden',
                    zIndex: item.zIndex || 1,
                  }}
                >
                  <Marquee
                    behavior="scroll"
                    direction={item.config?.direction || 'left'}
                    scrollamount={item.config?.speed === 'fast' ? 12 : item.config?.speed === 'slow' ? 4 : 8}
                    style={{
                      width: '100%',
                      color: item.textColor || '#ffffff',
                      fontSize: fontSizeCqw,
                      fontWeight: item.fontWeight || 'bold',
                    }}
                  >
                    {interpolated}
                  </Marquee>
                </div>
              );
            }

            return (
              <div
                key={item.id}
                style={{
                  position: 'absolute',
                  left: `${leftPct}%`,
                  top: `${topPct}%`,
                  width: `${widthPct}%`,
                  height: `${heightPct}%`,
                  backgroundColor: hasBg ? item.backgroundColor : 'transparent',
                  color: item.textColor || '#ffffff',
                  borderRadius: borderRadiusCqw,
                  border: hasBg && item.config?.borderWidth
                    ? `${item.config.borderWidth}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`
                    : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    item.textAlign === 'center'
                      ? 'center'
                      : item.textAlign === 'right'
                      ? 'flex-end'
                      : 'flex-start',
                  padding: hasBg ? '0 calc(12 / 1920 * 100cqw)' : 0,
                  overflow: 'hidden',
                  zIndex: item.zIndex || 1,
                  userSelect: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: fontSizeCqw,
                    fontWeight: item.fontWeight || 'bold',
                    textAlign: item.textAlign || 'center',
                    width: '100%',
                    lineHeight: 1.1,
                    letterSpacing: item.itemType === 'ticket_number' ? '0.02em' : 'normal',
                  }}
                >
                  {interpolated}
                </span>
              </div>
            );
          })}

        {/* Quick Calling Overlay Controls */}
        {isSelected && (
          <div
            onMouseDown={(e) => e.stopPropagation()}
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 35,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(15, 23, 42, 0.94)',
              backdropFilter: 'blur(12px)',
              padding: '8px 14px',
              borderRadius: '12px',
              border: isCallingQueue ? '1px solid #10b981' : '1px solid rgba(56, 189, 248, 0.5)',
              boxShadow: isCallingQueue
                ? '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 25px rgba(16, 185, 129, 0.45)'
                : '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.25)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
              filter: isCallingQueue ? 'invert(1)' : 'none',
              userSelect: 'none',
            }}
          >
            <button
              type="button"
              disabled={isCallingQueue}
              onClick={(e) => {
                e.stopPropagation();
                onRepeatCall(activeBlock);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 14px',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                color: '#f8fafc',
                fontSize: '0.8125rem',
                fontWeight: 700,
                cursor: isCallingQueue ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
              title="Panggil Ulang Nomor Antrian Ini"
            >
              <RotateCcw size={14} color="#38bdf8" />
              <span>{isCallingQueue ? 'Memanggil...' : 'Panggil Ulang'}</span>
            </button>

            <button
              type="button"
              disabled={isCallingQueue}
              onClick={(e) => {
                e.stopPropagation();
                onNextCall(activeBlock);
              }}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 16px',
                borderRadius: '8px',
                border: '1px solid rgba(16, 185, 129, 0.6)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                fontSize: '0.8125rem',
                fontWeight: 800,
                cursor: isCallingQueue ? 'not-allowed' : 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 10px rgba(16, 185, 129, 0.4)',
                transition: 'all 0.15s ease',
              }}
              title="Panggil Nomor Antrian Selanjutnya (+1)"
            >
              <Bell size={14} color="#ffffff" />
              <span>Next (+1)</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  if (activeBlock.widgetType === 'album' && (activeBlock.widgetData?.photos?.length || 0) > 0) {
    return (
      <img
        src={activeBlock.widgetData.photos[0].url}
        alt="Album photo"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: filterCssString,
        }}
      />
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
      Komponen {activeBlock.widgetType}
    </div>
  );
}
