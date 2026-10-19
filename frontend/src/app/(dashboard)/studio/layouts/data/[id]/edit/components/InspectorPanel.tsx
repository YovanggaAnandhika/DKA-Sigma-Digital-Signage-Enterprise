'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import {
  ListMusic,
  Film,
  Clock,
  ChevronLeft,
  ChevronRight,
  Settings,
  Layers,
} from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';

const InspectorBlockProperties = dynamic(() => import('./inspector/InspectorBlockProperties'), {
  ssr: false,
  loading: () => <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat properti blok...</div>,
});

const InspectorLayerProperties = dynamic(() => import('./inspector/InspectorLayerProperties'), {
  ssr: false,
  loading: () => <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat properti layer...</div>,
});

const InspectorTimelineProperties = dynamic(() => import('./inspector/InspectorTimelineProperties'), {
  ssr: false,
  loading: () => <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat properti timeline...</div>,
});

const InspectorLayoutProperties = dynamic(() => import('./inspector/InspectorLayoutProperties'), {
  ssr: false,
  loading: () => <div style={{ padding: '16px', color: 'var(--text-muted)', fontSize: '0.75rem' }}>Memuat properti layout...</div>,
});

export default function InspectorPanel() {
  const {
    layers,
    selectedLayerId,
    isInspectorCollapsed,
    setIsInspectorCollapsed,
    selectedBlockId,
    inspectorTarget,
  } = useLayoutEditor();

  const selectedZone = layers.find((z) => z.id === selectedLayerId);

  // Find active block if block is selected
  let selectedBlock: any = null;
  if (selectedBlockId) {
    for (const z of layers) {
      const found = (z.blocksList || []).find((b) => b.id === selectedBlockId);
      if (found) {
        selectedBlock = found;
        break;
      }
    }
  }

  // If collapsed to 36px mini strip
  if (isInspectorCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          borderLeft: '1px solid var(--border-subtle)',
          flexShrink: 0,
          height: '100%',
          zIndex: 5,
        }}
      >
        <div
          style={{
            height: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderBottom: '1px solid var(--border-subtle)',
            width: '100%',
          }}
        >
          <button
            onClick={() => setIsInspectorCollapsed(false)}
            title="Buka Inspector Properties"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              border: '1px solid var(--border-subtle)',
              borderRadius: '5px',
              backgroundColor: 'var(--bg-surface-elevated)',
              cursor: 'pointer',
              color: 'var(--text-secondary)',
            }}
          >
            <ChevronLeft size={12} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', paddingTop: '16px', color: 'var(--text-muted)' }}>
          <button
            onClick={() => setIsInspectorCollapsed(false)}
            title="Properties Inspector"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary-600)' }}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>
    );
  }

  // Determine what title to show in the single inspector header
  let headerTitle = 'Properti Layer';
  let headerIcon = <Settings size={14} />;

  if (inspectorTarget === 'block' && selectedBlock) {
    headerTitle = selectedBlock.mediaItemId ? 'Properti Media' : 'Properti Playlist';
    headerIcon = selectedBlock.mediaItemId ? <Film size={14} /> : <ListMusic size={14} />;
  } else if (inspectorTarget === 'timeline') {
    headerTitle = 'Pengaturan Timeline';
    headerIcon = <Clock size={14} />;
  } else if (inspectorTarget === 'layout' || (!selectedZone && !selectedBlock)) {
    headerTitle = 'Properti Layout';
    headerIcon = <Layers size={14} />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        height: '100%',
        overflow: 'hidden',
        width: '100%',
      }}
    >
      {/* Dynamic Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '6px 12px',
          minHeight: '36px',
          backgroundColor: 'var(--bg-surface-elevated)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          {headerIcon} {headerTitle.toUpperCase()}
        </span>
        <button
          onClick={() => setIsInspectorCollapsed(true)}
          title="Sembunyikan Panel Properti"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '5px',
            backgroundColor: 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover-surface)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; }}
        >
          <ChevronRight size={12} />
        </button>
      </div>

      {/* Dynamic Body Content */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {/* CASE 1: BLOCK / MEDIA ITEM PROPERTIES */}
        {inspectorTarget === 'block' && selectedBlock ? (
          <InspectorBlockProperties />
        ) : null}

        {/* CASE 2: LAYER / ZONE PROPERTIES */}
        {(inspectorTarget === 'layer' || (!selectedBlock && selectedZone)) && selectedZone ? (
          <InspectorLayerProperties />
        ) : null}

        {/* CASE 3: TIMELINE SIMULATION & GLOBAL AUDIO SETTINGS */}
        {inspectorTarget === 'timeline' ? (
          <InspectorTimelineProperties />
        ) : null}

        {/* CASE 4: LAYOUT / CANVAS PROPERTIES (Or fallback when nothing is selected) */}
        {(inspectorTarget === 'layout' || (!selectedZone && !selectedBlock && inspectorTarget !== 'timeline')) ? (
          <InspectorLayoutProperties />
        ) : null}
      </div>
    </div>
  );
}
