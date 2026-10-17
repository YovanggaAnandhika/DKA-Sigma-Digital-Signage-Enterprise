'use client';

import React, { useEffect, useRef } from 'react';
import {
  Film,
  Puzzle,
  ListMusic,
  ChevronsUp,
  ChevronsDown,
  Lock,
  Unlock,
  Maximize,
  AlignCenter,
  Copy,
  Trash2,
  PlusCircle,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Sliders,
} from 'lucide-react';
import { useLayoutEditor } from '../../context/LayoutEditorContext';

export interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
  canvasCoords?: { x: number; y: number };
  layerId?: string | null;
}

interface CanvasContextMenuProps {
  state: ContextMenuState;
  onClose: () => void;
}

export default function CanvasContextMenu({ state, onClose }: CanvasContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const {
    layers,
    setMediaPickerZoneId,
    setComponentPickerZoneId,
    setPickerZoneId,
    duplicateLayer,
    alignLayer,
    toggleLockLayer,
    bringToFront,
    sendToBack,
    handleDeleteLayer,
    handleAddLayer,
    zoomFit,
    zoomIn,
    zoomOut,
    setSelectedLayerId,
    setInspectorTarget,
    setIsInspectorCollapsed,
  } = useLayoutEditor();

  const targetLayer = state.layerId ? layers.find((l) => l.id === state.layerId) : null;
  const isLocked = targetLayer?.isLocked || false;

  useEffect(() => {
    if (!state.isOpen) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isOpen, onClose]);

  if (!state.isOpen) return null;

  // Reposition if menu overflows screen
  const menuWidth = 230;
  const menuHeight = state.layerId ? 380 : 160;
  const posX = Math.min(state.x, window.innerWidth - menuWidth - 12);
  const posY = Math.min(state.y, window.innerHeight - menuHeight - 12);

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left: `${posX}px`,
        top: `${posY}px`,
        zIndex: 999999,
        width: `${menuWidth}px`,
        backgroundColor: 'rgba(15, 23, 42, 0.94)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.14)',
        borderRadius: '10px',
        boxShadow: '0 16px 36px rgba(0,0,0,0.65), 0 2px 6px rgba(0,0,0,0.3)',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
        color: '#f8fafc',
        fontSize: '0.75rem',
        userSelect: 'none',
        animation: 'fadeInMenu 0.1s ease',
      }}
      onClick={(e) => e.stopPropagation()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {targetLayer ? (
        <>
          {/* Header Title */}
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontWeight: 700,
                color: '#93c5fd',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                maxWidth: '160px',
              }}
            >
              {targetLayer.name}
            </span>
            {isLocked && (
              <span style={{ fontSize: '0.625rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '2px' }}>
                <Lock size={10} /> Terkunci
              </span>
            )}
          </div>

          {/* Group 1: Konten */}
          <MenuItem
            icon={<Film size={14} color="#38bdf8" />}
            label="Ganti / Tambah Media"
            onClick={() => handleAction(() => setMediaPickerZoneId(targetLayer.id))}
          />
          <MenuItem
            icon={<Puzzle size={14} color="#a855f7" />}
            label="Tambah Komponen Widget"
            onClick={() => handleAction(() => setComponentPickerZoneId(targetLayer.id))}
          />
          <MenuItem
            icon={<ListMusic size={14} color="#f59e0b" />}
            label="Alokasi Playlist"
            onClick={() => handleAction(() => setPickerZoneId(targetLayer.id))}
          />

          <MenuDivider />

          {/* Group 2: Presets & Posisi */}
          <MenuItem
            icon={<Maximize size={14} color="#10b981" />}
            label="Penuhi Layar (Fit Canvas)"
            onClick={() => handleAction(() => alignLayer(targetLayer.id, 'fill'))}
          />
          <MenuItem
            icon={<AlignCenter size={14} color="#94a3b8" />}
            label="Pusatkan (Center)"
            onClick={() => handleAction(() => {
              alignLayer(targetLayer.id, 'center');
              alignLayer(targetLayer.id, 'middle');
            })}
          />
          <MenuItem
            icon={<Sliders size={14} color="#38bdf8" />}
            label="Buka Properti Layer"
            onClick={() => handleAction(() => {
              setSelectedLayerId(targetLayer.id);
              setInspectorTarget('layer');
              setIsInspectorCollapsed(false);
            })}
          />

          <MenuDivider />

          {/* Group 3: Z-Index & Kunci */}
          <MenuItem
            icon={<ChevronsUp size={14} color="#94a3b8" />}
            label="Bawa ke Paling Depan"
            onClick={() => handleAction(() => bringToFront(targetLayer.id))}
          />
          <MenuItem
            icon={<ChevronsDown size={14} color="#94a3b8" />}
            label="Kirim ke Paling Belakang"
            onClick={() => handleAction(() => sendToBack(targetLayer.id))}
          />
          <MenuItem
            icon={isLocked ? <Unlock size={14} color="#10b981" /> : <Lock size={14} color="#f59e0b" />}
            label={isLocked ? 'Buka Kunci Layer' : 'Kunci Layer'}
            onClick={() => handleAction(() => toggleLockLayer(targetLayer.id))}
          />

          <MenuDivider />

          {/* Group 4: Duplikasi & Hapus */}
          <MenuItem
            icon={<Copy size={14} color="#94a3b8" />}
            label="Duplikat Layer"
            shortcut="Ctrl+D"
            onClick={() => handleAction(() => duplicateLayer(targetLayer.id))}
          />
          <MenuItem
            icon={<Trash2 size={14} color="#f43f5e" />}
            label="Hapus Layer"
            shortcut="Del"
            danger
            onClick={() => handleAction(() => handleDeleteLayer(targetLayer.id))}
          />
        </>
      ) : (
        <>
          {/* Workspace Empty Canvas Right Click */}
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              marginBottom: '4px',
              fontSize: '0.6875rem',
              fontWeight: 700,
              color: '#94a3b8',
              textTransform: 'uppercase',
            }}
          >
            Kanvas Workspace
          </div>
          <MenuItem
            icon={<PlusCircle size={14} color="#10b981" />}
            label="Tambah Kotak Lapisan Baru"
            onClick={() => handleAction(() => handleAddLayer(state.canvasCoords))}
          />
          <MenuItem
            icon={<RotateCcw size={14} color="#38bdf8" />}
            label="Reset Zoom (100%)"
            onClick={() => handleAction(() => zoomFit())}
          />
          <MenuItem
            icon={<ZoomIn size={14} color="#94a3b8" />}
            label="Zoom In"
            onClick={() => handleAction(() => zoomIn())}
          />
          <MenuItem
            icon={<ZoomOut size={14} color="#94a3b8" />}
            label="Zoom Out"
            onClick={() => handleAction(() => zoomOut())}
          />
        </>
      )}
    </div>
  );
}

function MenuItem({
  icon,
  label,
  shortcut,
  danger,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  danger?: boolean;
  onClick: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '100%',
        padding: '6px 8px',
        borderRadius: '6px',
        border: 'none',
        background: hovered
          ? danger
            ? 'rgba(244, 63, 94, 0.2)'
            : 'rgba(56, 189, 248, 0.15)'
          : 'transparent',
        color: hovered ? (danger ? '#fca5a5' : '#ffffff') : danger ? '#f87171' : '#e2e8f0',
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
        {icon}
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      {shortcut && (
        <span style={{ fontSize: '0.625rem', color: '#64748b', fontWeight: 600, marginLeft: '8px' }}>
          {shortcut}
        </span>
      )}
    </button>
  );
}

function MenuDivider() {
  return (
    <div
      style={{
        height: '1px',
        backgroundColor: 'rgba(255, 255, 255, 0.08)',
        margin: '3px 4px',
      }}
    />
  );
}
