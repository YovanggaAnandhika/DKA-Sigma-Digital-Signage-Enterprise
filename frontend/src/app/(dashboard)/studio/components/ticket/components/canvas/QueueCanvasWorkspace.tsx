'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { QueueLayoutItem, injectQueueVariables } from '../../types';
import QueueCanvasItemBox from './QueueCanvasItemBox';
import QueueCanvasSnapGuides from './QueueCanvasSnapGuides';

const QueueCanvasToolbar = dynamic(() => import('./QueueCanvasToolbar'), {
  ssr: false,
});

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

  // Keyboard navigation & nudging
  useEffect(() => {
    if (!selectedItemId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
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

  const otherItems = queue.items.map((it) => ({
    id: it.id,
    x: it.x,
    y: it.y,
    width: it.width,
    height: it.height,
  }));

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
        minHeight: 0,
        height: '100%',
      }}
      onClick={() => onSelectItem(null)}
    >
      <QueueCanvasToolbar
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        isMagnetEnabled={isMagnetEnabled}
        setIsMagnetEnabled={setIsMagnetEnabled}
        selectedItem={selectedItem}
        handleAlign={handleAlign}
        callNextTicket={callNextTicket}
        currentSimNumber={simulator.currentNumber}
        zoomLevel={zoomLevel}
        setZoomLevel={setZoomLevel}
      />

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
            backgroundColor: queue.backgroundColor === 'transparent' ? 'transparent' : (queue.backgroundColor || 'transparent'),
            opacity: queue.opacity ?? 1,
            backgroundImage: queue.backgroundImageUrl
              ? `url(${queue.backgroundImageUrl})`
              : queue.backgroundColor === 'transparent'
              ? 'linear-gradient(45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.04) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.04) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.04) 75%)'
              : undefined,
            backgroundSize: queue.backgroundImageUrl ? 'cover' : '20px 20px',
            backgroundPosition: queue.backgroundImageUrl ? 'center' : '0 0, 0 10px, 10px -10px, -10px 0px',
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
          {/* Overlay Scrim */}
          {queue.overlayOpacity && queue.overlayOpacity > 0 && queue.overlayColor && queue.overlayColor !== 'transparent' ? (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: queue.overlayColor,
                opacity: queue.overlayOpacity,
                pointerEvents: 'none',
                zIndex: 1,
              }}
            />
          ) : null}

          {/* Render Elements with Rnd */}
          {queue.items
            .filter((it) => it.isVisible)
            .sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1))
            .map((item) => {
              const isSelected = item.id === selectedItemId;

              const interpolated = injectQueueVariables(item.templateContent, {
                queueNumber: simulator.currentNumber,
                queueCounter: queue.currentCounter || simulator.currentCounter,
                queuePrefix: queue.prefix,
                queueName: queue.name,
                counterLabel: queue.counterLabel,
              });

              return (
                <QueueCanvasItemBox
                  key={item.id}
                  item={item}
                  isSelected={isSelected}
                  scale={scale}
                  canvasWidth={canvasWidth}
                  canvasHeight={canvasHeight}
                  isMagnetEnabled={isMagnetEnabled}
                  otherItems={otherItems}
                  onSelectItem={onSelectItem}
                  updateLayoutItem={updateLayoutItem}
                  setSnapGuides={setSnapGuides}
                  interpolated={interpolated}
                  isChiming={simulator.isChiming}
                />
              );
            })}

          <QueueCanvasSnapGuides snapGuides={snapGuides} scale={scale} />
        </div>
      </div>
    </div>
  );
}
