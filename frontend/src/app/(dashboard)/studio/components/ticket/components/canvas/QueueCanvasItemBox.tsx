'use client';

import React from 'react';
import { Rnd } from 'react-rnd';
import { QueueLayoutItem } from '../../types';
import { calculateSnap } from '@/app/(dashboard)/studio/layouts/data/[id]/edit/utils/snapHelper';

const Marquee = 'marquee' as any;

interface QueueCanvasItemBoxProps {
  item: QueueLayoutItem;
  isSelected: boolean;
  scale: number;
  canvasWidth: number;
  canvasHeight: number;
  isMagnetEnabled: boolean;
  otherItems: { id: string; x: number; y: number; width: number; height: number }[];
  onSelectItem: (item: QueueLayoutItem) => void;
  updateLayoutItem: (id: string, updates: Partial<QueueLayoutItem>) => void;
  setSnapGuides: (guides: { x: number | null; y: number | null }) => void;
  interpolated: string;
  isChiming: boolean;
}

export default function QueueCanvasItemBox({
  item,
  isSelected,
  scale,
  canvasWidth,
  canvasHeight,
  isMagnetEnabled,
  otherItems,
  onSelectItem,
  updateLayoutItem,
  setSnapGuides,
  interpolated,
  isChiming,
}: QueueCanvasItemBoxProps) {
  return (
    <Rnd
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

        const snap = calculateSnap({
          currentId: item.id,
          x: rawX,
          y: rawY,
          width: item.width,
          height: item.height,
          canvasWidth,
          canvasHeight,
          otherLayers: otherItems,
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
          const snap = calculateSnap({
            currentId: item.id,
            x: rawX,
            y: rawY,
            width: item.width,
            height: item.height,
            canvasWidth,
            canvasHeight,
            otherLayers: otherItems,
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

        const snap = calculateSnap({
          currentId: item.id,
          x: rawX,
          y: rawY,
          width: nextW,
          height: nextH,
          canvasWidth,
          canvasHeight,
          otherLayers: otherItems,
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
          const snap = calculateSnap({
            currentId: item.id,
            x: rawX,
            y: rawY,
            width: nextW,
            height: nextH,
            canvasWidth,
            canvasHeight,
            otherLayers: otherItems,
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
          opacity: item.opacity ?? 1,
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          color: item.textColor,
          borderRadius: item.backgroundColor && item.backgroundColor !== 'transparent' ? `${(item.borderRadius || item.config?.borderRadius || 0) * scale}px` : 0,
          border: item.backgroundColor && item.backgroundColor !== 'transparent' && (item.borderWidth || item.config?.borderWidth)
            ? `${item.borderWidth || item.config?.borderWidth}px solid ${item.borderColor || item.config?.borderColor || 'rgba(0,0,0,0.1)'}`
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
            item.itemType === 'ticket_number' && isChiming
              ? '0 0 40px rgba(59, 130, 246, 0.7)'
              : undefined,
          transform:
            item.itemType === 'ticket_number' && isChiming ? 'scale(1.02)' : 'none',
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
}
