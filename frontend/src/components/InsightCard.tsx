'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react';

export interface InsightItem {
  id: string;
  title: string;
  category: string;
  description: string;
  level: 'success' | 'warning' | 'danger' | 'info';
}

export function InsightCard({ insights }: { insights: InsightItem[] }) {
  if (!insights || insights.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
        Diagnostik Cerdas Layar Retail & Distribusi
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '12px' }}>
        {insights.map((item) => {
          const isSuccess = item.level === 'success';
          const isWarning = item.level === 'warning';
          const isDanger = item.level === 'danger';

          const bg = isSuccess
            ? 'rgba(16, 185, 129, 0.08)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.08)'
            : isDanger
            ? 'rgba(244, 63, 94, 0.08)'
            : 'rgba(37, 99, 235, 0.08)';

          const border = isSuccess
            ? 'rgba(16, 185, 129, 0.3)'
            : isWarning
            ? 'rgba(245, 158, 11, 0.3)'
            : isDanger
            ? 'rgba(244, 63, 94, 0.3)'
            : 'rgba(37, 99, 235, 0.3)';

          const color = isSuccess
            ? 'var(--accent-emerald)'
            : isWarning
            ? 'var(--accent-amber)'
            : isDanger
            ? 'var(--accent-rose)'
            : 'var(--primary-400)';

          const IconComp = isSuccess ? CheckCircle2 : isWarning ? AlertTriangle : isDanger ? XCircle : Info;

          return (
            <div
              key={item.id}
              style={{
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: bg,
                border: `1px solid ${border}`,
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
              }}
            >
              <div style={{ color, flexShrink: 0, marginTop: '2px' }}>
                <IconComp size={18} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                  <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>{item.title}</h4>
                  <span
                    style={{
                      fontSize: '0.625rem',
                      fontWeight: 700,
                      padding: '2px 6px',
                      borderRadius: '4px',
                      border: `1px solid ${border}`,
                      color,
                    }}
                  >
                    {item.category}
                  </span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
