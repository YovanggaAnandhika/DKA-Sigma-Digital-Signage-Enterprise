'use client';

import React, { useEffect, useRef } from 'react';
import { RotateCcw, Bell, Radio, Calendar, CloudSun, Droplets, MapPin, Wind } from 'lucide-react';
import HlsPlayer from '@/components/ui/HlsPlayer';
import { Layer } from '../../../context/LayoutStateContext';
import { injectQueueVariables, createDefaultQueueLayoutItems } from '@/app/(dashboard)/studio/components/ticket/types';
import { CITY_PRESETS, CLOCK_THEME_STYLES } from '@/app/(dashboard)/studio/components/clock/types';

const Marquee = 'marquee' as any;

function ClockWidget({ data, scale, width, height }: { data: any; scale: number; width: number; height: number }) {
  const [now, setNow] = React.useState(() => new Date());

  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const city = data?.city || 'Makassar';
  const weather = CITY_PRESETS[city] || CITY_PRESETS.Makassar;
  const timeZone = data?.timezone || 'Asia/Jakarta';
  const timeParts = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: data?.is24Hour === false,
    timeZone,
  }).formatToParts(now);
  const getPart = (type: string) => timeParts.find((part) => part.type === type)?.value || '';
  const widgetScale = Math.max(0.1, Math.min(scale * width / 440, scale * height / 230));
  const themeStyle = CLOCK_THEME_STYLES[data?.theme as keyof typeof CLOCK_THEME_STYLES] || CLOCK_THEME_STYLES.glass;
  const textColor = data?.textColor || themeStyle.textColor;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        boxSizing: 'border-box',
        padding: `${20 * widgetScale}px ${28 * widgetScale}px`,
        backgroundColor: data?.backgroundColor || themeStyle.backgroundColor,
        color: textColor,
        border: `${Math.max(1, widgetScale)}px solid ${data?.borderColor || themeStyle.borderColor}`,
        borderRadius: `${Math.max(4, 24 * widgetScale)}px`,
        boxShadow: '0 12px 28px rgba(0,0,0,0.24)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 * widgetScale, marginBottom: 10 * widgetScale }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * widgetScale, color: themeStyle.locationColor, fontSize: 14 * widgetScale, fontWeight: 700 }}>
          <MapPin size={14 * widgetScale} />
          <span>{weather.city}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * widgetScale, color: themeStyle.conditionColor, fontSize: 13 * widgetScale, fontWeight: 600, whiteSpace: 'nowrap' }}>
          <CloudSun size={17 * widgetScale} />
          <span>{weather.condition}</span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 * widgetScale, marginBottom: 6 * widgetScale, whiteSpace: 'nowrap' }}>
        <span style={{ fontSize: (data?.timeFontSize || 48) * 0.7 * widgetScale, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}>
          {getPart('hour')}:{getPart('minute')}
        </span>
        {data?.showSeconds !== false && (
          <span style={{ fontSize: 28 * widgetScale, fontWeight: 700, color: themeStyle.subtitleColor }}>:{getPart('second')}</span>
        )}
        {getPart('dayPeriod') && (
          <span style={{ fontSize: 16 * widgetScale, fontWeight: 800, color: themeStyle.periodColor }}>{getPart('dayPeriod')}</span>
        )}
      </div>

      {data?.showDate !== false && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 * widgetScale, color: themeStyle.subtitleColor, fontSize: (data?.dateFontSize || 14) * widgetScale, marginBottom: 12 * widgetScale }}>
          <Calendar size={14 * widgetScale} color={themeStyle.subtitleColor} />
          <span>{now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone })}</span>
        </div>
      )}

      <div style={{ paddingTop: 10 * widgetScale, borderTop: `1px solid ${themeStyle.dividerColor}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 * widgetScale }}>
        <span style={{ fontSize: 28 * widgetScale, lineHeight: 1, fontWeight: 800 }}>{weather.temp}°C</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 * widgetScale, color: themeStyle.subtitleColor, fontSize: 12 * widgetScale, whiteSpace: 'nowrap' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 * widgetScale }}>
            <Droplets size={12 * widgetScale} color="#38bdf8" /> {weather.humidity}%
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 4 * widgetScale }}>
            <Wind size={12 * widgetScale} color="#34d399" /> {weather.windSpeed} km/h
          </span>
        </div>
      </div>
    </div>
  );
}

function TickerMarquee({
  text,
  speed,
  scale,
  fontSize,
  color,
}: {
  text: string;
  speed: string;
  scale: number;
  fontSize: number;
  color: string;
}) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const content = textRef.current;
    if (!viewport || !content) return;

    const pixelsPerSecond = (speed === 'fast' ? 160 : speed === 'slow' ? 50 : 95) * scale;
    let animation: Animation | undefined;
    const animate = () => {
      animation?.cancel();
      const distance = viewport.clientWidth + content.scrollWidth;
      if (distance === 0) return;
      animation = content.animate(
        [
          { transform: `translateX(${viewport.clientWidth}px)` },
          { transform: `translateX(-${content.scrollWidth}px)` },
        ],
        { duration: (distance / pixelsPerSecond) * 1000, iterations: Infinity, easing: 'linear' },
      );
    };

    const observer = new ResizeObserver(animate);
    observer.observe(viewport);
    observer.observe(content);
    animate();
    return () => {
      observer.disconnect();
      animation?.cancel();
    };
  }, [text, speed, scale]);

  return (
    <div ref={viewportRef} style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
      <span
        ref={textRef}
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          fontSize: `${fontSize * scale}px`,
          fontWeight: 700,
          lineHeight: 1,
          color,
        }}
      >
        {text}
      </span>
    </div>
  );
}

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
    const tickerFontSize = Math.min(
      activeBlock.widgetData?.fontSize || 16,
      Math.max(8, z.height * 0.72),
    );
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
          padding: `0 ${Math.max(1, Math.floor(12 * scale))}px`,
          gap: `${Math.max(1, Math.floor(12 * scale))}px`,
        }}
      >
        {activeBlock.widgetData?.badge && (
          <span
            style={{
              backgroundColor: activeBlock.widgetData?.badgeBackgroundColor || 'rgba(255,255,255,0.2)',
              color: activeBlock.widgetData?.badgeTextColor || '#ffffff',
              padding: `${Math.max(1, Math.floor(tickerFontSize * 0.1 * scale))}px ${Math.max(1, Math.floor(tickerFontSize * 0.35 * scale))}px`,
              borderRadius: `${Math.max(1, Math.floor(4 * scale))}px`,
              fontWeight: 800,
              fontSize: `${tickerFontSize * 0.5 * scale}px`,
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {activeBlock.widgetData.badge}
          </span>
        )}
        <TickerMarquee
          text={(activeBlock.widgetData?.messagesList || activeBlock.widgetData?.messages || ['HNDSigma Teks Berjalan']).join('  ✦  ')}
          speed={activeBlock.widgetData?.speed || 'normal'}
          scale={scale}
          fontSize={tickerFontSize}
          color={activeBlock.widgetData?.textColor || '#ffffff'}
        />
      </div>
    );
  }

  if (activeBlock.widgetType === 'clock') {
    return <ClockWidget data={activeBlock.widgetData} scale={scale} width={z.width} height={z.height} />;
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

            const isTicketNumber = item.itemType === 'ticket_number';
            const isCounterLoket = item.itemType === 'counter_loket';

            let itemBg = hasBg ? item.backgroundColor : 'transparent';
            let itemBorder = hasBg && item.config?.borderWidth
              ? `${item.config.borderWidth}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`
              : 'none';
            let itemBackdrop = 'none';
            let itemBoxShadow = 'none';
            let itemTransform = 'scale(1)';

            if (isTicketNumber && !hasBg) {
              itemBg = 'rgba(15, 23, 42, 0.72)';
              itemBackdrop = 'blur(16px)';
              itemBorder = isCallingQueue
                ? '2px solid #38bdf8'
                : '1px solid rgba(255, 255, 255, 0.18)';
              itemBoxShadow = isCallingQueue
                ? '0 0 30px rgba(56, 189, 248, 0.8), 0 10px 25px rgba(0,0,0,0.5)'
                : '0 8px 32px rgba(0, 0, 0, 0.35)';
              itemTransform = isCallingQueue ? 'scale(1.035)' : 'scale(1)';
            } else if (isCounterLoket && !hasBg) {
              itemBg = 'rgba(30, 41, 59, 0.85)';
              itemBackdrop = 'blur(12px)';
              itemBorder = '1px solid rgba(245, 158, 11, 0.4)';
              itemBoxShadow = '0 4px 16px rgba(0, 0, 0, 0.3)';
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
                  backgroundColor: itemBg,
                  backdropFilter: itemBackdrop,
                  boxShadow: itemBoxShadow,
                  transform: itemTransform,
                  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  color: item.textColor || (isTicketNumber ? '#38bdf8' : '#ffffff'),
                  borderRadius: borderRadiusCqw || (isTicketNumber ? 'calc(24 / 1920 * 100cqw)' : isCounterLoket ? 'calc(16 / 1920 * 100cqw)' : undefined),
                  border: itemBorder,
                  borderTop: isTicketNumber && !hasBg ? '1.5px solid rgba(255, 255, 255, 0.35)' : itemBorder,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent:
                    item.textAlign === 'center'
                      ? 'center'
                      : item.textAlign === 'right'
                      ? 'flex-end'
                      : 'flex-start',
                  padding: hasBg || isTicketNumber || isCounterLoket ? '0 calc(12 / 1920 * 100cqw)' : 0,
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
              transform: isCallingQueue ? 'translate(-50%, -50%) scale(1.02)' : 'translate(-50%, -50%) scale(1)',
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
                ? '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 25px rgba(16, 185, 129, 0.65)'
                : '0 12px 36px rgba(0, 0, 0, 0.75), 0 0 20px rgba(56, 189, 248, 0.25)',
              transition: 'all 0.2s ease',
              pointerEvents: 'auto',
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

  if (activeBlock.widgetType === 'livestream') {
    const ls = activeBlock.widgetData || {};
    const url = ls.sourceUrl || '';
    const streamEndpoint = ls.serverHlsEndpoint || (ls.id ? `/streams/${ls.id}/live.m3u8` : url);

    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          filter: filterCssString,
        }}
      >
        <HlsPlayer
          src={streamEndpoint}
          poster={ls.posterImageUrl || undefined}
          isMuted={ls.isMuted ?? true}
          volume={ls.volumeLevel ? ls.volumeLevel / 100 : 0.8}
          autoPlay
          fallbackTitle={ls.name || 'Siaran Offline'}
          fallbackDescription="Menunggu siaran dimulai dari OBS Studio / encoder..."
        />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
      Komponen {activeBlock.widgetType}
    </div>
  );
}
