'use client';

import React from 'react';
import { Activity } from 'lucide-react';
import { useDisplayDetail, cleanMediaTitle } from '../context/DisplayDetailContext';

export default function DisplayAnalyticsChart() {
  const {
    timeRange,
    setTimeRange,
    sortedHistory,
    hoveredPoint,
    setHoveredPoint,
  } = useDisplayDetail();

  const chartWidth = 760;
  const chartHeight = 180;
  const padding = { top: 20, right: 20, bottom: 30, left: 45 };
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;

  const cpuData = sortedHistory.map(
    (r) => r.inputOutput?.cpu_percent ?? r.inputOutput?.cpuPercent ?? 0
  );
  const ramData = sortedHistory.map(
    (r) => r.inputOutput?.ram_percent ?? r.inputOutput?.ramPercent ?? 0
  );

  const getPoints = (data: number[]) => {
    if (data.length === 0) return [];
    return data.map((val, idx) => {
      const clamped = Math.max(0, Math.min(100, val));
      const x = padding.left + (data.length > 1 ? idx * (plotWidth / (data.length - 1)) : plotWidth / 2);
      const y = padding.top + plotHeight * (1 - clamped / 100);
      return { x, y, val };
    });
  };

  const cpuPoints = getPoints(cpuData);
  const ramPoints = getPoints(ramData);

  const cpuLine = cpuPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');
  const ramLine = ramPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`, '');

  const cpuArea = cpuPoints.length > 0
    ? `${cpuLine} L ${cpuPoints[cpuPoints.length - 1].x},${padding.top + plotHeight} L ${cpuPoints[0].x},${padding.top + plotHeight} Z`
    : '';
  const ramArea = ramPoints.length > 0
    ? `${ramLine} L ${ramPoints[ramPoints.length - 1].x},${padding.top + plotHeight} L ${ramPoints[0].x},${padding.top + plotHeight} Z`
    : '';

  return (
    <div className="card-elevated" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Activity size={18} style={{ color: 'var(--accent-cyan)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Tren Performa Perangkat
            </h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Metrik beban CPU dan memori RAM.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '8px', padding: '3px' }}>
            {(['15m', '1h', '6h', '24h'] as const).map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => setTimeRange(rng)}
                style={{
                  padding: '4px 10px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  border: 'none',
                  cursor: 'pointer',
                  backgroundColor: timeRange === rng ? 'var(--primary-600)' : 'transparent',
                  color: timeRange === rng ? '#ffffff' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                }}
              >
                {rng === '15m' ? '15 Menit' : rng === '1h' ? '1 Jam' : rng === '6h' ? '6 Jam' : '24 Jam'}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, padding: '4px 8px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)' }}>
            {sortedHistory.length} Snapshot
          </span>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', fontSize: '0.75rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-cyan)' }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Beban CPU Sistem (%)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span style={{ display: 'inline-block', width: '10px', height: '10px', borderRadius: '2px', backgroundColor: 'var(--accent-emerald)' }} />
          <span style={{ color: 'var(--text-secondary)', fontWeight: 600 }}>Penggunaan RAM (%)</span>
        </div>
      </div>

      {/* Native SVG Timeseries Chart */}
      <div style={{ width: '100%', overflowX: 'auto', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '12px', padding: '16px' }}>
        {sortedHistory.length === 0 ? (
          <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
            <Activity size={24} style={{ opacity: 0.4 }} />
            <span>Belum ada snapshot histori performa untuk rentang waktu {timeRange}. Menunggu telemetri player...</span>
          </div>
        ) : (
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
            <defs>
              <linearGradient id="cpuGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.35" />
                <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="ramGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent-emerald)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--accent-emerald)" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines & Y-axis labels */}
            {[0, 25, 50, 75, 100].map((percent) => {
              const y = padding.top + plotHeight * (1 - percent / 100);
              return (
                <g key={percent}>
                  <line
                    x1={padding.left}
                    y1={y}
                    x2={chartWidth - padding.right}
                    y2={y}
                    stroke="rgba(255, 255, 255, 0.07)"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={padding.left - 8}
                    y={y + 3}
                    fill="var(--text-muted)"
                    fontSize="9"
                    textAnchor="end"
                    fontFamily="monospace"
                  >
                    {percent}%
                  </text>
                </g>
              );
            })}

            {/* Area fills */}
            {cpuArea && <path d={cpuArea} fill="url(#cpuGrad)" />}
            {ramArea && <path d={ramArea} fill="url(#ramGrad)" />}

            {/* Lines */}
            {ramLine && (
              <path
                d={ramLine}
                fill="none"
                stroke="var(--accent-emerald)"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}
            {cpuLine && (
              <path
                d={cpuLine}
                fill="none"
                stroke="var(--accent-cyan)"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Interactive Data Points */}
            {cpuPoints.map((pt, idx) => {
              const record = sortedHistory[idx];
              const isHovered = hoveredPoint?.id === record?.id;
              return (
                <g key={`cpu-pt-${idx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 3}
                    fill="var(--accent-cyan)"
                    stroke="var(--bg-surface)"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint(record)}
                  />
                </g>
              );
            })}

            {ramPoints.map((pt, idx) => {
              const record = sortedHistory[idx];
              const isHovered = hoveredPoint?.id === record?.id;
              return (
                <g key={`ram-pt-${idx}`}>
                  <circle
                    cx={pt.x}
                    cy={pt.y}
                    r={isHovered ? 6 : 3}
                    fill="var(--accent-emerald)"
                    stroke="var(--bg-surface)"
                    strokeWidth="1.5"
                    style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
                    onMouseEnter={() => setHoveredPoint(record)}
                  />
                </g>
              );
            })}

            {/* X-axis Timestamps */}
            {sortedHistory.length > 0 && (
              <g>
                <text
                  x={padding.left}
                  y={chartHeight - 6}
                  fill="var(--text-muted)"
                  fontSize="9"
                  textAnchor="start"
                  fontFamily="monospace"
                >
                  {new Date(sortedHistory[0].recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </text>
                {sortedHistory.length > 2 && (
                  <text
                    x={padding.left + plotWidth / 2}
                    y={chartHeight - 6}
                    fill="var(--text-muted)"
                    fontSize="9"
                    textAnchor="middle"
                    fontFamily="monospace"
                  >
                    {new Date(sortedHistory[Math.floor(sortedHistory.length / 2)].recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </text>
                )}
                <text
                  x={chartWidth - padding.right}
                  y={chartHeight - 6}
                  fill="var(--text-muted)"
                  fontSize="9"
                  textAnchor="end"
                  fontFamily="monospace"
                >
                  {new Date(sortedHistory[sortedHistory.length - 1].recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      {/* Hovered Point Details Bar */}
      {hoveredPoint && (
        <div
          style={{
            marginTop: '12px',
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'var(--bg-surface-elevated)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '10px',
            fontSize: '0.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              Waktu: {new Date(hoveredPoint.recordedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
              CPU: {hoveredPoint.inputOutput?.cpu_percent ?? hoveredPoint.inputOutput?.cpuPercent ?? 0}%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 700 }}>
              RAM: {hoveredPoint.inputOutput?.ram_percent ?? hoveredPoint.inputOutput?.ramPercent ?? 0}%
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--accent-rose)' }}>
              Suhu: {hoveredPoint.inputOutput?.battery_temp_celsius ?? hoveredPoint.inputOutput?.batteryTempCelsius ?? 34}°C
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ color: 'var(--text-muted)' }}>Media:</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              {hoveredPoint.assetsStatsList && hoveredPoint.assetsStatsList.length > 0
                ? hoveredPoint.assetsStatsList.map((a) => cleanMediaTitle(a.media_name || a.mediaName)).join(', ')
                : cleanMediaTitle(hoveredPoint.assetsStats?.media_name || hoveredPoint.assetsStats?.mediaName)}
            </span>
            <span
              style={{
                color:
                  (hoveredPoint.assetsStatsList && hoveredPoint.assetsStatsList.length > 0
                    ? hoveredPoint.assetsStatsList.reduce((acc, a) => acc + (a.dropped_frames ?? a.droppedFrames ?? 0), 0)
                    : hoveredPoint.assetsStats?.dropped_frames ?? hoveredPoint.assetsStats?.droppedFrames ?? 0) > 0
                    ? 'var(--accent-amber)'
                    : 'var(--accent-emerald)',
                fontWeight: 700,
              }}
            >
              (
              {hoveredPoint.assetsStatsList && hoveredPoint.assetsStatsList.length > 0
                ? hoveredPoint.assetsStatsList.reduce((acc, a) => acc + (a.dropped_frames ?? a.droppedFrames ?? 0), 0)
                : hoveredPoint.assetsStats?.dropped_frames ?? hoveredPoint.assetsStats?.droppedFrames ?? 0}{' '}
              drop)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
