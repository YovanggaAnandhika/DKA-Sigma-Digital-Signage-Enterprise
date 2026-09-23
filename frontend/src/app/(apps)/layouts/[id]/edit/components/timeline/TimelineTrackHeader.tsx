'use client';

import React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { useLayoutState } from '../../context/LayoutStateContext';
import { useLayoutUI } from '../../context/LayoutUIContext';
import { useLayoutPlayback } from '../../context/LayoutPlaybackContext';

export default function TimelineTrackHeader() {
  const { zones, selectedZoneId, setSelectedZoneId } = useLayoutState();
  const { hiddenZones, toggleZoneVisibility, setInspectorTarget, setSelectedBlockId, setIsInspectorCollapsed } = useLayoutUI();
  const { playheadPosition, isZoneActive } = useLayoutPlayback();

  return (
    <div style={{ width: '220px', backgroundColor: 'var(--bg-surface)', flexShrink: 0 }}>
      {zones.map((z, idx) => {
        const active = isZoneActive(z, playheadPosition);
        const isSelected = z.id === selectedZoneId;
        const isHidden = hiddenZones.includes(z.id);
        const zColors = ['#1d4ed8', '#047857', '#b45309', '#be185d', '#6d28d9', '#0f766e', '#4338ca'];
        const color = zColors[idx % zColors.length];

        const handleTrackClick = () => {
          setSelectedZoneId(z.id);
          setSelectedBlockId(null);
          setInspectorTarget('zone');
          setIsInspectorCollapsed(false);
        };

        return (
          <div
            key={z.id}
            onClick={handleTrackClick}
            style={{
              height: '34px',
              borderBottom: '1px solid var(--border-subtle)',
              padding: '0 8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
              borderLeft: `4px solid ${color}`,
              cursor: 'pointer',
              opacity: isHidden ? 0.4 : 1,
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {z.name}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.625rem', color: 'var(--text-muted)' }}>
                  {z.blocksList?.length || 0} block(s)
                </span>
                {active && (
                  <span style={{ fontSize: '0.5625rem', padding: '1px 4px', borderRadius: '4px', backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#10b981', fontWeight: 700 }}>
                    ACTIVE
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                toggleZoneVisibility(z.id);
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: isHidden ? 'var(--text-muted)' : 'var(--text-secondary)', padding: '4px' }}
              title={isHidden ? 'Tampilkan Layer' : 'Sembunyikan Layer'}
            >
              {isHidden ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>
        );
      })}
    </div>
  );
}
