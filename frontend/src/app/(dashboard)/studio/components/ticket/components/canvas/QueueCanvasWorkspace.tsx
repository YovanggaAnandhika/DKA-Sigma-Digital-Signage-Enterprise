'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Rnd } from 'react-rnd';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Magnet,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  AlignLeft,
  AlignRight,
  ArrowUpToLine,
  ArrowDownToLine,
  PhoneCall,
  Sparkles,
} from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueLayoutItem, injectQueueVariables } from '../../types';
import { calculateSnap } from '@/app/(dashboard)/studio/layouts/[id]/edit/utils/snapHelper';

const Marquee = 'marquee' as any;

interface QueueCanvasWorkspaceProps {
  selectedItemId: string | null;
  onSelectItem: (item: QueueLayoutItem | null) => void;
}

export default function QueueCanvasWorkspace({
  selectedItemId,
  onSelectItem,
}: QueueCanvasWorkspaceProps) {
  const { queue, updateLayoutItem, setQueue, simulator, callNextTicket } = useQueueEditor();
  const workspaceRef = useRef<HTMLDivElement>(null);

  const [scale, setScale] = useState(0.5);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMagnetEnabled, setIsMagnetEnabled] = useState(true);
  const [snapGuides, setSnapGuides] = useState<{ x: number | null; y: number | null }>({
    x: null,
    y: null,
  });

  const canvasWidth = queue.canvasWidth || 1920;
  const canvasHeight = queue.canvasHeight || 1080;

  const selectedItem = queue.items.find((it) => it.id === selectedItemId) || null;

  // Auto-fit scale to available container size
  const updateFitScale = useCallback(() => {
    if (!workspaceRef.current) return;
    const availWidth = Math.max(100, workspaceRef.current.clientWidth - 48);
    // Deduct workspace toolbar (~52px) and canvas padding (48px) + safety clearance so canvas is 100% visible
    const availHeight = Math.max(100, workspaceRef.current.clientHeight - 110);
    const scaleX = availWidth / canvasWidth;
    const scaleY = availHeight / canvasHeight;
    const baseScale = Math.min(scaleX, scaleY);
    setScale(Math.max(0.15, Math.min(baseScale, 1.5)) * zoomLevel);
  }, [canvasWidth, canvasHeight, zoomLevel]);

  useEffect(() => {
    updateFitScale();
    window.addEventListener('resize', updateFitScale);
    return () => window.removeEventListener('resize', updateFitScale);
  }, [updateFitScale]);

  // Keyboard navigation & nudging (Arrow keys 1px, Shift+Arrow 10px, Delete, Escape)
  useEffect(() => {
    if (!selectedItemId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      const item = queue.items.find((it) => it.id === selectedItemId);
      if (!item) return;

      const step = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateLayoutItem(item.id, { x: Math.max(0, item.x - step) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateLayoutItem(item.id, { x: Math.min(canvasWidth - item.width, item.x + step) });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateLayoutItem(item.id, { y: Math.max(0, item.y - step) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateLayoutItem(item.id, { y: Math.min(canvasHeight - item.height, item.y + step) });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        setQueue((prev) => ({
          ...prev,
          items: prev.items.filter((it) => it.id !== item.id),
        }));
        onSelectItem(null);
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onSelectItem(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemId, queue.items, canvasWidth, canvasHeight, updateLayoutItem, setQueue, onSelectItem]);

  // Quick Alignment Handlers
  const handleAlign = (type: 'centerH' | 'centerV' | 'left' | 'right' | 'top' | 'bottom') => {
    if (!selectedItem) return;

    if (type === 'centerH') {
      updateLayoutItem(selectedItem.id, { x: Math.round((canvasWidth - selectedItem.width) / 2) });
    } else if (type === 'centerV') {
      updateLayoutItem(selectedItem.id, { y: Math.round((canvasHeight - selectedItem.height) / 2) });
    } else if (type === 'left') {
      updateLayoutItem(selectedItem.id, { x: 0 });
    } else if (type === 'right') {
      updateLayoutItem(selectedItem.id, { x: canvasWidth - selectedItem.width });
    } else if (type === 'top') {
      updateLayoutItem(selectedItem.id, { y: 0 });
    } else if (type === 'bottom') {
      updateLayoutItem(selectedItem.id, { y: canvasHeight - selectedItem.height });
    }
  };

  return (
    <div
      ref={workspaceRef}
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        backgroundImage: 'radial-gradient(var(--border-subtle) 1px, transparent 0)',
        backgroundSize: '20px 20px',
        minHeight: '620px',
        height: '100%',
      }}
      onClick={() => onSelectItem(null)}
    >
      {/* Studio Workspace Toolbar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 16px',
          borderBottom: '1px solid var(--border-subtle)',
          backgroundColor: 'var(--bg-surface-elevated)',
          flexWrap: 'wrap',
          gap: '10px',
          zIndex: 10,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left: Resolution Badge & Magnet Toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
              backgroundColor: '#10b981',
              color: '#ffffff',
            }}
          >
            {canvasWidth} × {canvasHeight} px
          </span>

          <button
            type="button"
            onClick={() => setIsMagnetEnabled(!isMagnetEnabled)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 10px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              backgroundColor: isMagnetEnabled ? 'rgba(6, 182, 212, 0.15)' : 'transparent',
              color: isMagnetEnabled ? '#06b6d4' : 'var(--text-muted)',
              border: isMagnetEnabled ? '1px solid rgba(6, 182, 212, 0.4)' : '1px solid var(--border-subtle)',
              cursor: 'pointer',
            }}
            title={isMagnetEnabled ? 'Magnet Snapping Aktif' : 'Magnet Snapping Nonaktif'}
          >
            <Magnet size={13} />
            Magnet Align
          </button>
        </div>

        {/* Center: Quick Alignment Tools (Disabled if no item selected) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'var(--bg-surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: '8px',
            padding: '2px',
            opacity: selectedItem ? 1 : 0.4,
            pointerEvents: selectedItem ? 'auto' : 'none',
          }}
        >
          <button
            type="button"
            onClick={() => handleAlign('left')}
            className="btn btn-outline"
            style={{ padding: '5px', border: 'none' }}
            title="Rata Kiri Kanvas"
          >
            <AlignLeft size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleAlign('centerH')}
            className="btn btn-outline"
            style={{ padding: '5px', border: 'none' }}
            title="Rata Tengah Horizontal"
          >
            <AlignHorizontalJustifyCenter size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleAlign('right')}
            className="btn btn-outline"
            style={{ padding: '5px', border: 'none' }}
            title="Rata Kanan Kanvas"
          >
            <AlignRight size={13} />
          </button>
          <div style={{ width: '1px', height: '14px', backgroundColor: 'var(--border-subtle)', margin: '0 2px' }} />
          <button
            type="button"
            onClick={() => handleAlign('top')}
            className="btn btn-outline"
            style={{ padding: '5px', border: 'none' }}
            title="Rata Atas Kanvas"
          >
            <ArrowUpToLine size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleAlign('centerV')}
            className="btn btn-outline"
            style={{ padding: '5px', border: 'none' }}
            title="Rata Tengah Vertikal"
          >
            <AlignVerticalJustifyCenter size={13} />
          </button>
          <button
            type="button"
            onClick={() => handleAlign('bottom')}
            className="btn btn-outline"
            style={{ padding: '5px', border: 'none' }}
            title="Rata Bawah Kanvas"
          >
            <ArrowDownToLine size={13} />
          </button>
        </div>

        {/* Right: Live Call Simulation & Zoom controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={callNextTicket}
            className="btn btn-primary"
            style={{ padding: '4px 12px', fontSize: '0.75rem', backgroundColor: '#059669', borderColor: '#059669' }}
          >
            <PhoneCall size={12} />
            Panggil ({simulator.currentNumber})
          </button>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '6px',
              padding: '2px',
            }}
          >
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.4, z - 0.1))}
              style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-primary)' }}
              title="Perkecil"
            >
              <ZoomOut size={12} />
            </button>
            <span style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '0 4px', color: 'var(--text-muted)', minWidth: '36px', textAlign: 'center' }}>
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(2.0, z + 0.1))}
              style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-primary)' }}
              title="Perbesar"
            >
              <ZoomIn size={12} />
            </button>
            <button
              type="button"
              onClick={() => setZoomLevel(1)}
              style={{ background: 'none', border: 'none', padding: '4px 6px', cursor: 'pointer', color: 'var(--text-muted)' }}
              title="Fit Kanvas"
            >
              <Maximize2 size={12} />
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area Container */}
      <div
        style={{
          flex: 1,
          overflow: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
        }}
      >
        <div
          style={{
            width: `${canvasWidth * scale}px`,
            height: `${canvasHeight * scale}px`,
            position: 'relative',
            backgroundColor: queue.backgroundColor,
            backgroundImage: queue.backgroundImageUrl ? `url(${queue.backgroundImageUrl})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            boxShadow: '0 25px 60px -15px rgba(0,0,0,0.6)',
            border: '1px solid var(--border-subtle)',
            overflow: 'hidden',
            flexShrink: 0,
            transition: 'width 0.1s ease, height 0.1s ease',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSelectItem(null);
            }
          }}
        >
          {/* Render Elements with Rnd */}
          {queue.items
            .filter((it) => it.isVisible)
            .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
            .map((item) => {
              const isSelected = item.id === selectedItemId;

              const interpolated = injectQueueVariables(item.templateContent, {
                queueNumber: simulator.currentNumber,
                queueCounter: queue.currentCounter,
                queuePrefix: queue.prefix,
                queueName: queue.name,
              });

              return (
                <Rnd
                  key={item.id}
                  bounds="parent"
                  size={{
                    width: item.width * scale,
                    height: item.height * scale,
                  }}
                  position={{
                    x: item.x * scale,
                    y: item.y * scale,
                  }}
                  enableResizing={{
                    top: isSelected,
                    right: isSelected,
                    bottom: isSelected,
                    left: isSelected,
                    topRight: isSelected,
                    bottomRight: isSelected,
                    bottomLeft: isSelected,
                    topLeft: isSelected,
                  }}
                  onDrag={(e, d) => {
                    if (!isMagnetEnabled) {
                      setSnapGuides({ x: null, y: null });
                      return;
                    }
                    const rawX = Math.round(d.x / scale);
                    const rawY = Math.round(d.y / scale);
                    const otherLayers = queue.items.map((it) => ({
                      id: it.id,
                      x: it.x,
                      y: it.y,
                      width: it.width,
                      height: it.height,
                    }));

                    const snap = calculateSnap({
                      currentId: item.id,
                      x: rawX,
                      y: rawY,
                      width: item.width,
                      height: item.height,
                      canvasWidth,
                      canvasHeight,
                      otherLayers,
                      threshold: 12,
                    });

                    setSnapGuides({ x: snap.guideX, y: snap.guideY });
                  }}
                  onDragStop={(e, d) => {
                    const rawX = Math.round(d.x / scale);
                    const rawY = Math.round(d.y / scale);

                    let finalX = rawX;
                    let finalY = rawY;

                    if (isMagnetEnabled) {
                      const otherLayers = queue.items.map((it) => ({
                        id: it.id,
                        x: it.x,
                        y: it.y,
                        width: it.width,
                        height: it.height,
                      }));

                      const snap = calculateSnap({
                        currentId: item.id,
                        x: rawX,
                        y: rawY,
                        width: item.width,
                        height: item.height,
                        canvasWidth,
                        canvasHeight,
                        otherLayers,
                        threshold: 12,
                      });

                      finalX = snap.x;
                      finalY = snap.y;
                    }

                    const clampedX = Math.max(0, Math.min(canvasWidth - item.width, finalX));
                    const clampedY = Math.max(0, Math.min(canvasHeight - item.height, finalY));

                    updateLayoutItem(item.id, { x: clampedX, y: clampedY });
                    setSnapGuides({ x: null, y: null });
                  }}
                  onResize={(e, direction, ref, delta, position) => {
                    if (!isMagnetEnabled) {
                      setSnapGuides({ x: null, y: null });
                      return;
                    }
                    const nextW = Math.round(ref.offsetWidth / scale);
                    const nextH = Math.round(ref.offsetHeight / scale);
                    const rawX = Math.round(position.x / scale);
                    const rawY = Math.round(position.y / scale);

                    const otherLayers = queue.items.map((it) => ({
                      id: it.id,
                      x: it.x,
                      y: it.y,
                      width: it.width,
                      height: it.height,
                    }));

                    const snap = calculateSnap({
                      currentId: item.id,
                      x: rawX,
                      y: rawY,
                      width: nextW,
                      height: nextH,
                      canvasWidth,
                      canvasHeight,
                      otherLayers,
                      threshold: 12,
                    });

                    setSnapGuides({ x: snap.guideX, y: snap.guideY });
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const nextW = Math.max(40, Math.round(ref.offsetWidth / scale));
                    const nextH = Math.max(20, Math.round(ref.offsetHeight / scale));
                    const rawX = Math.round(position.x / scale);
                    const rawY = Math.round(position.y / scale);

                    let finalX = rawX;
                    let finalY = rawY;
                    let finalW = nextW;
                    let finalH = nextH;

                    if (isMagnetEnabled) {
                      const otherLayers = queue.items.map((it) => ({
                        id: it.id,
                        x: it.x,
                        y: it.y,
                        width: it.width,
                        height: it.height,
                      }));

                      const snap = calculateSnap({
                        currentId: item.id,
                        x: rawX,
                        y: rawY,
                        width: nextW,
                        height: nextH,
                        canvasWidth,
                        canvasHeight,
                        otherLayers,
                        threshold: 12,
                      });

                      finalX = snap.x;
                      finalY = snap.y;
                    }

                    const clampedW = Math.min(canvasWidth, finalW);
                    const clampedH = Math.min(canvasHeight, finalH);
                    const clampedX = Math.max(0, Math.min(canvasWidth - clampedW, finalX));
                    const clampedY = Math.max(0, Math.min(canvasHeight - clampedH, finalY));

                    updateLayoutItem(item.id, {
                      width: clampedW,
                      height: clampedH,
                      x: clampedX,
                      y: clampedY,
                    });
                    setSnapGuides({ x: null, y: null });
                  }}
                  resizeHandleStyles={{
                    bottomRight: { display: isSelected ? 'block' : 'none', width: 9, height: 9, backgroundColor: '#ffffff', border: '2px solid #06b6d4', right: -5, bottom: -5, borderRadius: '50%', zIndex: 12 },
                    bottomLeft: { display: isSelected ? 'block' : 'none', width: 9, height: 9, backgroundColor: '#ffffff', border: '2px solid #06b6d4', left: -5, bottom: -5, borderRadius: '50%', zIndex: 12 },
                    topRight: { display: isSelected ? 'block' : 'none', width: 9, height: 9, backgroundColor: '#ffffff', border: '2px solid #06b6d4', right: -5, top: -5, borderRadius: '50%', zIndex: 12 },
                    topLeft: { display: isSelected ? 'block' : 'none', width: 9, height: 9, backgroundColor: '#ffffff', border: '2px solid #06b6d4', left: -5, top: -5, borderRadius: '50%', zIndex: 12 },
                    top: { display: isSelected ? 'flex' : 'none', height: 8, top: -4, cursor: 'ns-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
                    bottom: { display: isSelected ? 'flex' : 'none', height: 8, bottom: -4, cursor: 'ns-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
                    left: { display: isSelected ? 'flex' : 'none', width: 8, left: -4, cursor: 'ew-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
                    right: { display: isSelected ? 'flex' : 'none', width: 8, right: -4, cursor: 'ew-resize', zIndex: 11, alignItems: 'center', justifyContent: 'center' },
                  }}
                  resizeHandleComponent={isSelected ? {
                    top: <div style={{ width: 18, height: 3, backgroundColor: '#ffffff', border: '1px solid #06b6d4', borderRadius: 2 }} />,
                    bottom: <div style={{ width: 18, height: 3, backgroundColor: '#ffffff', border: '1px solid #06b6d4', borderRadius: 2 }} />,
                    left: <div style={{ width: 3, height: 18, backgroundColor: '#ffffff', border: '1px solid #06b6d4', borderRadius: 2 }} />,
                    right: <div style={{ width: 3, height: 18, backgroundColor: '#ffffff', border: '1px solid #06b6d4', borderRadius: 2 }} />,
                  } : undefined}
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onSelectItem(item);
                  }}
                  style={{
                    zIndex: isSelected ? 9999 : item.zIndex || 1,
                    border: isSelected ? '1.5px solid #06b6d4' : 'none',
                    cursor: 'move',
                    borderRadius: `${(item.config?.borderRadius || 0) * scale}px`,
                  }}
                >
                  {/* Floating tag badge above selected item */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: -20,
                        left: 0,
                        backgroundColor: '#0891b2',
                        color: '#ffffff',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '1px 6px',
                        borderRadius: '3px',
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 9999,
                      }}
                    >
                      {item.name} • {item.width}×{item.height}
                    </div>
                  )}

                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      backgroundColor: item.backgroundColor === 'transparent' || !item.backgroundColor ? 'transparent' : item.backgroundColor,
                      color: item.textColor,
                      borderRadius: item.backgroundColor && item.backgroundColor !== 'transparent' ? `${(item.config?.borderRadius || 0) * scale}px` : 0,
                      border: item.backgroundColor && item.backgroundColor !== 'transparent' && item.config?.borderWidth
                        ? `${item.config.borderWidth}px solid ${item.config.borderColor || 'rgba(0,0,0,0.1)'}`
                        : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent:
                        item.textAlign === 'center'
                          ? 'center'
                          : item.textAlign === 'right'
                          ? 'flex-end'
                          : 'flex-start',
                      padding: item.backgroundColor && item.backgroundColor !== 'transparent' ? '2px 8px' : '0px',
                      overflow: 'hidden',
                      userSelect: 'none',
                      boxShadow:
                        item.itemType === 'ticket_number' && simulator.isChiming
                          ? '0 0 40px rgba(59, 130, 246, 0.7)'
                          : undefined,
                      transform:
                        item.itemType === 'ticket_number' && simulator.isChiming ? 'scale(1.02)' : 'none',
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                  >
                    {item.itemType === 'marquee' ? (
                      <Marquee
                        behavior="scroll"
                        direction={item.config?.direction || 'left'}
                        scrollamount={item.config?.speed === 'fast' ? 12 : item.config?.speed === 'slow' ? 4 : 8}
                        style={{
                          width: '100%',
                          color: item.textColor,
                          fontSize: `${(item.fontSize || 24) * scale}px`,
                          fontWeight: item.fontWeight || 'bold',
                        }}
                      >
                        {interpolated}
                      </Marquee>
                    ) : (
                      <span
                        style={{
                          fontSize: `${(item.fontSize || 36) * scale}px`,
                          fontWeight: item.fontWeight || 'bold',
                          textAlign: item.textAlign,
                          width: '100%',
                          lineHeight: 1.1,
                          letterSpacing: item.itemType === 'ticket_number' ? '0.02em' : 'normal',
                        }}
                      >
                        {interpolated}
                      </span>
                    )}
                  </div>
                </Rnd>
              );
            })}

          {/* Visual Prediction Magnet Align Guides (Cyan Glow) */}
          {snapGuides.x !== null && (
            <div
              style={{
                position: 'absolute',
                left: `${snapGuides.x * scale}px`,
                top: 0,
                bottom: 0,
                width: '1px',
                backgroundColor: '#06b6d4',
                boxShadow: '0 0 8px 1.5px rgba(6, 182, 212, 0.85)',
                pointerEvents: 'none',
                zIndex: 99999,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  left: 4,
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  backgroundColor: '#0891b2',
                  color: '#ffffff',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                X: {Math.round(snapGuides.x)}px
              </div>
            </div>
          )}

          {snapGuides.y !== null && (
            <div
              style={{
                position: 'absolute',
                top: `${snapGuides.y * scale}px`,
                left: 0,
                right: 0,
                height: '1px',
                backgroundColor: '#06b6d4',
                boxShadow: '0 0 8px 1.5px rgba(6, 182, 212, 0.85)',
                pointerEvents: 'none',
                zIndex: 99999,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 8,
                  top: 4,
                  fontSize: '9px',
                  fontWeight: 700,
                  fontFamily: 'monospace',
                  backgroundColor: '#0891b2',
                  color: '#ffffff',
                  padding: '1px 5px',
                  borderRadius: '3px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  whiteSpace: 'nowrap',
                }}
              >
                Y: {Math.round(snapGuides.y)}px
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
