'use client';

import React, { useState } from 'react';
import { Layers, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import LayerItemCard from './layers/LayerItemCard';

export default function LayersPanel() {
  const { zones, handleAddZone, selectedZoneId, setSelectedZoneId } = useLayoutEditor();
  const [collapsed, setCollapsed] = useState(false);
  const [panelWidth, setPanelWidth] = useState(240);
  const [isDraggingResize, setIsDraggingResize] = useState(false);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingResize(true);
    const startX = e.clientX;
    const startW = panelWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setPanelWidth(Math.min(500, Math.max(160, startW + delta)));
    };
    const onMouseUp = () => {
      setIsDraggingResize(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  return (
    <div
      style={{
        width: collapsed ? '36px' : `${panelWidth}px`,
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        zIndex: 5,
        transition: isDraggingResize ? 'none' : 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        position: 'relative',
      }}
    >
      {/* Top Header: Layers */}
      <div
        style={{
          padding: collapsed ? '10px 6px' : '10px 14px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          backgroundColor: 'var(--bg-surface-elevated)',
          minHeight: '44px',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        {!collapsed && (
          <h3 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, flex: 1 }}>
            <Layers size={14} />
            Layers
          </h3>
        )}

        {!collapsed && (
          <button
            onClick={handleAddZone}
            className="btn btn-primary"
            style={{ padding: '3px 7px', fontSize: '0.6875rem', height: 'auto', flexShrink: 0 }}
          >
            <Plus size={12} /> Baru
          </button>
        )}

        <button
          onClick={() => setCollapsed(prev => !prev)}
          title={collapsed ? 'Tampilkan panel samping' : 'Sembunyikan panel samping'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '22px',
            height: '22px',
            border: '1px solid var(--border-subtle)',
            borderRadius: '5px',
            backgroundColor: '#fff',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#f1f5f9'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#fff'; }}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Zone list */}
      {!collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1 }}>
          {zones.length === 0 ? (
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', padding: '32px 16px' }}>
              Belum ada layer. Klik &ldquo;Baru&rdquo; untuk menambahkan.
            </div>
          ) : (
            [...zones].sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((z) => (
              <LayerItemCard key={z.id} z={z} />
            ))
          )}
        </div>
      )}

      {/* Collapsed sidebar: zone dots */}
      {collapsed && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px', paddingTop: '8px' }}>
          {zones.map((z) => {
            const isSelected = z.id === selectedZoneId;
            return (
              <button
                key={z.id}
                onClick={() => setSelectedZoneId(z.id)}
                title={z.name}
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  border: isSelected ? '2px solid var(--primary-500)' : '2px solid var(--border-subtle)',
                  backgroundColor: isSelected ? 'var(--bg-surface-elevated)' : 'var(--bg-base)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: 0,
                  transition: 'all 0.1s',
                }}
              >
                <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: isSelected ? 'var(--primary-500)' : '#94a3b8' }} />
              </button>
            );
          })}
          <button
            onClick={handleAddZone}
            title="Tambah Layer Baru"
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '50%',
              border: '1px dashed var(--primary-400)',
              backgroundColor: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 0,
              marginTop: '4px',
              color: 'var(--primary-500)',
            }}
          >
            <Plus size={10} />
          </button>
        </div>
      )}

      {/* Resize Handle */}
      {!collapsed && (
        <div
          onMouseDown={handleResizeMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            width: '5px',
            cursor: 'col-resize',
            zIndex: 10,
            backgroundColor: isDraggingResize ? 'var(--primary-400)' : 'transparent',
            transition: 'background 0.15s',
          }}
          title="Tarik untuk mengubah lebar panel"
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.3)'; }}
          onMouseLeave={(e) => { if (!isDraggingResize) e.currentTarget.style.backgroundColor = 'transparent'; }}
        />
      )}
    </div>
  );
}
