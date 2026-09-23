'use client';

import React, { useState } from 'react';
import { Layers, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { useLayoutEditor } from '../context/LayoutEditorContext';
import LayerItemCard from './layers/LayerItemCard';

export default function LayersPanel() {
  const { zones, handleAddZone, selectedZoneId, setSelectedZoneId, isLayersCollapsed, setIsLayersCollapsed } = useLayoutEditor();
  const collapsed = isLayersCollapsed;
  const setCollapsed = setIsLayersCollapsed;

  return (
    <div
      style={{
        width: collapsed ? '36px' : '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'var(--bg-surface)',
        zIndex: 5,
        transition: 'width 0.2s ease',
        overflow: 'hidden',
        flexShrink: 0,
        height: '100%',
      }}
    >
      {/* Top Header: Layers */}
      <div
        style={{
          padding: collapsed ? '6px 4px' : '6px 12px',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          backgroundColor: 'var(--bg-surface-elevated)',
          minHeight: '36px',
          flexShrink: 0,
          gap: '6px',
        }}
      >
        {!collapsed && (
          <h3 style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px', margin: 0, flex: 1 }}>
            <Layers size={13} />
            LAYERS
          </h3>
        )}

        {!collapsed && (
          <button
            onClick={handleAddZone}
            title="Tambah Layer / Zona Baru"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '22px',
              height: '22px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: 'var(--primary-600)',
              color: '#ffffff',
              cursor: 'pointer',
              flexShrink: 0,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-700)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-600)'; }}
          >
            <Plus size={13} />
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
            backgroundColor: 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            flexShrink: 0,
            transition: 'background 0.15s',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--hover-surface)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-surface-elevated)'; }}
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
    </div>
  );
}
