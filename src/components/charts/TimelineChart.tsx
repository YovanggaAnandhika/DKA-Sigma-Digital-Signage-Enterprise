'use client';

import React from 'react';

export interface TimelineDataPoint {
  label: string;
  value: number;
}

export interface TimelineChartProps {
  title: string;
  description: string;
  data: TimelineDataPoint[];
  primaryColor?: string;
  primaryLegend?: string;
}

export function TimelineChart({
  title,
  description,
  data,
  primaryColor = '#f43f5e',
  primaryLegend = 'Layar Aktif',
}: TimelineChartProps) {
  const maxValue = Math.max(...data.map((d) => d.value), 10);

  const generatePath = () => {
    if (data.length === 0) return '';
    const step = 100 / Math.max(data.length - 1, 1);
    return data
      .map((d, i) => {
        const x = i * step;
        const y = 100 - (d.value / maxValue) * 100;
        return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)},${y.toFixed(2)}`;
      })
      .join(' ');
  };

  const generateArea = () => {
    if (data.length === 0) return '';
    const path = generatePath();
    return `${path} L 100,100 L 0,100 Z`;
  };

  return (
    <div className="card-elevated" style={{ padding: '20px', marginTop: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div>
          <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>{title}</h3>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>{description}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 600 }}>
          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: primaryColor }} />
          <span style={{ color: 'var(--text-secondary)' }}>{primaryLegend}</span>
        </div>
      </div>

      <div style={{ position: 'relative', height: '180px', width: '100%', borderBottom: '1px solid var(--border-subtle)' }}>
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', overflow: 'visible' }}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path d={generateArea()} fill={primaryColor} fillOpacity="0.15" />
          <path d={generatePath()} fill="none" stroke={primaryColor} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
        </svg>

        {/* Interactive Overlay & Points */}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          {data.map((point, idx) => (
            <div
              key={idx}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                height: '100%',
                position: 'relative',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  width: '6px',
                  height: '6px',
                  borderRadius: '50%',
                  backgroundColor: primaryColor,
                  border: '1.5px solid #fff',
                  top: `${100 - (point.value / maxValue) * 100}%`,
                  transform: 'translateY(-50%)',
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* X-Axis Labels */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
        {data.map((point, idx) => (
          <span key={idx}>{point.label}</span>
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
        <span>Dasar: 0</span>
        <span>Puncak Skala: {maxValue}</span>
      </div>
    </div>
  );
}
