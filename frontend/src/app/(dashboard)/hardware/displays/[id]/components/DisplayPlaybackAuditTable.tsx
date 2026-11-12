'use client';

import React from 'react';
import { ShieldCheck, Download, Activity, Cpu } from 'lucide-react';
import { useDisplayDetail } from '../context/DisplayDetailContext';
import { formatIndonesianDateTime } from './formatIndonesianDateTime';

export default function DisplayPlaybackAuditTable() {
  const {
    playbackLogs,
    handleExportCSV,
    sortedHistory,
    timeRange,
    setTimeRange,
    hoveredPoint,
    setHoveredPoint,
  } = useDisplayDetail();

  // Kalkulasi koordinat grafik SVG yang mulus (Bezier Curve)
  const chartWidth = 720;
  const chartHeight = 210;
  const paddingBottom = 28;
  const paddingTop = 16;
  const innerHeight = chartHeight - paddingTop - paddingBottom;

  const pointsCpu: { x: number; y: number; val: number; record: any }[] = [];
  const pointsRam: { x: number; y: number; val: number; record: any }[] = [];

  if (sortedHistory.length > 0) {
    const step = chartWidth / Math.max(1, sortedHistory.length - 1);
    sortedHistory.forEach((rec, idx) => {
      const x = idx * step;
      const cpuVal = Number(rec.inputOutput?.cpu_percent ?? rec.inputOutput?.cpuPercent ?? 0);
      const ramVal = Number(rec.inputOutput?.ram_percent ?? rec.inputOutput?.ramPercent ?? 0);

      const yCpu = paddingTop + innerHeight - (Math.min(100, Math.max(0, cpuVal)) / 100) * innerHeight;
      const yRam = paddingTop + innerHeight - (Math.min(100, Math.max(0, ramVal)) / 100) * innerHeight;

      pointsCpu.push({ x, y: yCpu, val: cpuVal, record: rec });
      pointsRam.push({ x, y: yRam, val: ramVal, record: rec });
    });
  }

  const makeSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const cpuPath = makeSmoothPath(pointsCpu);
  const ramPath = makeSmoothPath(pointsRam);

  const cpuAreaPath = pointsCpu.length
    ? `${cpuPath} L ${chartWidth} ${chartHeight - paddingBottom} L 0 ${chartHeight - paddingBottom} Z`
    : '';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Kartu Grafik Tren Performa Perangkat */}
      <div className="card-elevated" style={{ padding: '22px 24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ padding: '8px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', color: 'var(--primary-400)' }}>
              <Activity size={18} />
            </div>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Tren Performa Perangkat
              </h2>
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: '2px 0 0' }}>
                Metrik beban CPU dan memori RAM secara real-time.
              </p>
            </div>
          </div>

          {/* Time Range Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', backgroundColor: 'var(--bg-surface-elevated)', padding: '3px', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
            {['15m', '1h', '6h', '24h'].map((rng) => (
              <button
                key={rng}
                type="button"
                onClick={() => setTimeRange(rng)}
                style={{
                  padding: '5px 10px',
                  borderRadius: '7px',
                  fontSize: '0.72rem',
                  fontWeight: timeRange === rng ? 700 : 500,
                  backgroundColor: timeRange === rng ? 'var(--bg-surface)' : 'transparent',
                  color: timeRange === rng ? 'var(--text-primary)' : 'var(--text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: timeRange === rng ? '0 2px 6px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s ease',
                }}
              >
                {rng === '15m' ? '15 Menit' : rng === '1h' ? '1 Jam' : rng === '6h' ? '6 Jam' : '24 Jam'}
              </button>
            ))}
          </div>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', fontSize: '0.75rem', fontWeight: 600 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-cyan)', display: 'inline-block' }} />
            <span>Beban CPU Sistem (%)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)', display: 'inline-block' }} />
            <span>Penggunaan RAM (%)</span>
          </div>
        </div>

        {/* SVG Chart Area */}
        <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
          {sortedHistory.length === 0 ? (
            <div style={{ height: '210px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.8rem', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
              Belum ada snapshot histori performa untuk rentang waktu ini. Menunggu telemetri player...
            </div>
          ) : (
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              preserveAspectRatio="none"
              style={{ width: '100%', height: '210px', display: 'block', overflow: 'visible' }}
              onMouseLeave={() => setHoveredPoint(null)}
            >
              <defs>
                <linearGradient id="cpuAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Grid Horizontal */}
              {[0, 25, 50, 75, 100].map((pct) => {
                const y = paddingTop + innerHeight - (pct / 100) * innerHeight;
                return (
                  <g key={pct}>
                    <line x1="0" y1={y} x2={chartWidth} y2={y} stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" opacity={0.6} />
                    <text x="0" y={y - 4} fill="var(--text-muted)" fontSize="9" fontFamily="sans-serif">
                      {pct}%
                    </text>
                  </g>
                );
              })}

              {/* Area Gradient CPU */}
              {cpuAreaPath && <path d={cpuAreaPath} fill="url(#cpuAreaGradient)" />}

              {/* Garis Kurva RAM */}
              {ramPath && (
                <path d={ramPath} fill="none" stroke="var(--accent-emerald)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Garis Kurva CPU */}
              {cpuPath && (
                <path d={cpuPath} fill="none" stroke="var(--accent-cyan)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              )}

              {/* Titik Interaktif (Hover Overlay) */}
              {pointsCpu.map((pt, idx) => {
                const ramPt = pointsRam[idx];
                const isHovered = hoveredPoint?.id === pt.record.id;
                return (
                  <g key={pt.record.id || idx} style={{ cursor: 'pointer' }} onMouseEnter={() => setHoveredPoint(pt.record)}>
                    {/* Lingkaran CPU */}
                    <circle cx={pt.x} cy={pt.y} r={isHovered ? 6 : 3.5} fill="var(--bg-surface)" stroke="var(--accent-cyan)" strokeWidth="2" />
                    {/* Lingkaran RAM */}
                    {ramPt && <circle cx={ramPt.x} cy={ramPt.y} r={isHovered ? 5 : 3} fill="var(--bg-surface)" stroke="var(--accent-emerald)" strokeWidth="2" />}
                  </g>
                );
              })}
            </svg>
          )}

          {/* Sumbu X Label Waktu */}
          {sortedHistory.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '8px', padding: '0 4px' }}>
              <span>{formatIndonesianDateTime(sortedHistory[0].recordedAt)}</span>
              <span>{formatIndonesianDateTime(sortedHistory[sortedHistory.length - 1].recordedAt)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Kartu Bukti Tayang / Proof of Play */}
      <div className="card-elevated" style={{ padding: '24px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', borderRadius: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Bukti Tayang / Proof of Play
              </h2>
            </div>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Laporan verifikasi kepatuhan impresi iklan dan penayangan konten di layar.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleExportCSV}
              disabled={playbackLogs.length === 0}
              className="btn btn-outline"
              title="Unduh data bukti tayang ke berkas CSV"
              style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', borderRadius: '10px', padding: '6px 14px' }}
            >
              <Download size={14} />
              <span>Ekspor Laporan CSV</span>
            </button>
          </div>
        </div>

        {/* Airtime & Delivery KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL PENAYANGAN (IMPRESI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
              {playbackLogs.length}
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL AIRTIME (DURASI)</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
              {(playbackLogs.reduce((acc, cur) => acc + (cur.durationSeconds || 0), 0) / 60).toFixed(1)} Menit
            </div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: 'var(--bg-surface-elevated)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>RASIO TAYANG SUKSES</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
              {playbackLogs.length
                ? `${Math.round((playbackLogs.filter((l) => l.isCompleted).length / playbackLogs.length) * 100)}%`
                : '100%'}
            </div>
          </div>
        </div>

        {playbackLogs.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-elevated)', borderRadius: '12px', border: '1px dashed var(--border-subtle)', fontSize: '0.8125rem' }}>
            Belum ada rekaman penayangan media dari player ini.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                  <th style={{ padding: '10px 14px' }}>Media / Konten</th>
                  <th style={{ padding: '10px 14px' }}>Layout</th>
                  <th style={{ padding: '10px 14px' }}>Waktu Mulai Tayang</th>
                  <th style={{ padding: '10px 14px' }}>Durasi</th>
                  <th style={{ padding: '10px 14px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {playbackLogs.map((log) => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                    <td style={{ padding: '12px 14px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {log.mediaName || log.mediaId || 'Media Item'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {log.layoutName || log.layoutId || '-'}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-muted)' }}>
                      {formatIndonesianDateTime(log.startedAt)}
                    </td>
                    <td style={{ padding: '12px 14px', color: 'var(--text-secondary)' }}>
                      {log.durationSeconds} detik
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span
                        style={{
                          padding: '3px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: log.isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                          color: log.isCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                        }}
                      >
                        {log.isCompleted ? 'Selesai' : 'Sebagian'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}