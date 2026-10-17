'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api, Layout, Layer as ApiLayer } from '@/lib/services';
import { ensureUuid, isUuid, resolveWidgetInfo } from '@/lib/services/studio/widgetHelper';

export interface Layer extends ApiLayer {
  timeline_start?: number;
  timeline_width?: number;
  isLocked?: boolean;
}

interface LayoutStateContextType {
  layout: Layout | null;
  layoutName: string;
  setLayoutName: (name: string) => void;
  layers: Layer[];
  setLayers: React.Dispatch<React.SetStateAction<Layer[]>>;
  selectedLayerId: string | null;
  setSelectedLayerId: (id: string | null) => void;
  loading: boolean;
  saving: boolean;
  handleSave: (showToast: (msg: string, type?: 'success' | 'error') => void) => Promise<void>;
  handleAddLayer: (customCoords?: { x: number; y: number } | any) => Promise<void>;
  handleDeleteLayer: (layerId: string) => void;
  updateSelectedLayer: (field: keyof Layer, value: any) => void;
  reorderLayers: (sourceId: string, targetId: string) => void;
  duplicateLayer: (layerId: string) => Promise<void>;
  alignLayer: (layerId: string, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'fill' | 'split-left' | 'split-right' | 'ticker-bottom' | 'header-top') => void;
  toggleLockLayer: (layerId: string) => void;
  bringToFront: (layerId: string) => void;
  sendToBack: (layerId: string) => void;
}

const LayoutStateContext = createContext<LayoutStateContextType | undefined>(undefined);

export function LayoutStateProvider({ children }: { children: ReactNode }) {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [layout, setLayout] = useState<Layout | null>(null);
  const [layoutName, setLayoutName] = useState('');
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [deletedLayerIds, setDeletedLayerIds] = useState<string[]>([]);
  const [deletedBlockIds, setDeletedBlockIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const data = await api.getLayout(params.id);
        setLayout(data);
        setLayoutName(data.name);

        const rawLayers = data.layersList || [];
        const sanitizedLayers = rawLayers.map((z: any) => {
          const rawBlocks = z.blocksList || [];
          const blocks = rawBlocks.map((b: any) => {
            const widgetInfo = resolveWidgetInfo(b);
            return {
              ...b,
              id: b.id,
              layerId: b.layerId || b.layer_id,
              playlistId: b.playlistId || '',
              mediaItemId: b.mediaItemId || '',
              playlist: b.playlist,
              mediaItem: b.mediaItem,
              startTimeSeconds: b.startTimeSeconds ?? 0,
              durationSeconds: b.durationSeconds ?? 10,
              transitionId: b.transitionId,
              transition: b.transition,
              orderIndex: b.orderIndex ?? b.position ?? 0,
              isMuted: b.isMuted ?? b.is_muted ?? false,
              itemOverridesList: (b.itemOverridesList || []).map((o: any) => ({
                id: o.id,
                layerPlaylistId: o.layerPlaylistId || o.layer_playlist_id,
                playlistItemId: o.playlistItemId,
                isMuted: o.isMuted ?? false,
              })),
              ...widgetInfo,
            };
          });

          return {
            ...z,
            id: z.id,
            layoutId: z.layoutId || params.id,
            name: z.name,
            x: Number(z.x) || 0,
            y: Number(z.y) || 0,
            width: Number(z.width) || 200,
            height: Number(z.height) || 200,
            zIndex: Number(z.zIndex) || 1,
            backgroundColor: z.backgroundColor || '',
            blocksList: blocks,
          };
        });

        sanitizedLayers.sort((a: any, b: any) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
        setLayers(sanitizedLayers);
        if (sanitizedLayers.length > 0) {
          setSelectedLayerId(sanitizedLayers[0].id);
        }
      } catch (err: any) {
        alert(err.message || 'Gagal memuat layout');
        router.push('/layouts');
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [params.id, router]);

  const handleSave = async (showToast: (msg: string, type?: 'success' | 'error') => void) => {
    if (!layout) return;
    try {
      setSaving(true);

      if (layoutName !== layout.name) {
        await api.updateLayout(params.id, { name: layoutName });
      }

      for (const delId of deletedLayerIds) {
        await api.deleteLayer(delId, params.id);
      }
      setDeletedLayerIds([]);

      for (const delBId of deletedBlockIds) {
        await api.removePlaylistBlock(delBId);
      }
      setDeletedBlockIds([]);

      for (const z of layers) {
        const x = Math.round(Number(z.x) || 0);
        const y = Math.round(Number(z.y) || 0);
        const width = Math.round(Number(z.width) || 200);
        const height = Math.round(Number(z.height) || 200);
        const z_index = Math.round(Number(z.zIndex) || 1);

        let realLayerId = z.id;
        if (z.id.startsWith('z-')) {
          const newZ = await api.createLayer({
            layoutId: params.id,
            name: z.name,
            x,
            y,
            width,
            height,
            zIndex: z_index,
            backgroundColor: z.backgroundColor,
          });
          realLayerId = newZ.id;
        } else {
          await api.updateLayer(z.id, {
            name: z.name,
            x,
            y,
            width,
            height,
            zIndex: z_index,
            backgroundColor: z.backgroundColor,
          });
        }

        for (const b of (z.blocksList || [])) {
          if (b.id.startsWith('temp-') || b.id.startsWith('wb-') || !isUuid(b.id)) {
            if (b.widgetType && b.widgetId) {
              const wid = ensureUuid(b.widgetId);
              await api.addWidgetBlock(realLayerId, b.widgetType, wid, b.startTimeSeconds, b.durationSeconds).catch((err) => {
                console.error('Gagal menambahkan widget block:', err);
              });
            } else if (b.mediaItemId && isUuid(b.mediaItemId)) {
              await api.addMediaBlock(realLayerId, b.mediaItemId, b.startTimeSeconds, b.durationSeconds).catch(() => null);
            } else if (b.playlistId && isUuid(b.playlistId)) {
              await api.addPlaylistBlock(realLayerId, b.playlistId, b.startTimeSeconds, b.durationSeconds).catch(() => null);
            }
          } else {
            const blockMuted = b.isMuted ?? b.itemOverridesList?.find((o: any) => o.playlistItemId === b.id)?.isMuted;
            await api.updatePlaylistBlock(b.id, {
              startTimeSeconds: b.startTimeSeconds,
              durationSeconds: b.durationSeconds,
              transitionId: b.transitionId,
              isMuted: blockMuted !== undefined ? blockMuted : false,
              volumeLevel: b.volumeLevel !== undefined ? b.volumeLevel : 100,
            }).catch(() => null);
          }
        }
      }

      const data = await api.getLayout(params.id);
      setLayout(data);
      setLayoutName(data.name);

      const prevLayers = layers;
      const rawLayers = data.layersList || [];
      const sanitizedLayers = rawLayers.map((z: any) => {
        const prevLayer = prevLayers.find((pz) => pz.id === z.id);
        const rawBlocks = z.blocksList || [];
        const blocks = rawBlocks.map((b: any, bIdx: number) => {
          let prevBlock = prevLayer?.blocksList?.find((pb) => pb.id === b.id);
          if (!prevBlock && prevLayer?.blocksList) {
            prevBlock = prevLayer.blocksList[bIdx];
          }
          const widgetInfo = resolveWidgetInfo(b, prevBlock);
          return {
            ...b,
            id: b.id,
            layerId: b.layerId || b.layer_id,
            playlistId: b.playlistId || '',
            mediaItemId: b.mediaItemId || '',
            playlist: b.playlist,
            mediaItem: b.mediaItem,
            startTimeSeconds: b.startTimeSeconds ?? 0,
            durationSeconds: b.durationSeconds ?? 10,
            transitionId: b.transitionId,
            transition: b.transition,
            orderIndex: b.orderIndex ?? b.position ?? 0,
            volumeLevel: b.volumeLevel ?? prevBlock?.volumeLevel ?? 100,
            isMuted: b.isMuted ?? b.is_muted ?? prevBlock?.isMuted ?? false,
            itemOverridesList: prevBlock?.itemOverridesList || (b.itemOverridesList || []).map((o: any) => ({
              id: o.id,
              layerPlaylistId: o.layerPlaylistId || o.layer_playlist_id,
              playlistItemId: o.playlistItemId,
              isMuted: o.isMuted ?? false,
            })),
            ...widgetInfo,
          };
        });
        return {
          ...z,
          id: z.id,
          layoutId: z.layoutId || params.id,
          name: z.name,
          x: Number(z.x) || 0,
          y: Number(z.y) || 0,
          width: Number(z.width) || 200,
          height: Number(z.height) || 200,
          zIndex: Number(z.zIndex) || 1,
          backgroundColor: z.backgroundColor || '',
          blocksList: blocks,
        };
      });
      setLayers(sanitizedLayers);
      showToast('Template layout dan seluruh posisi layer berhasil disimpan!');
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan layout', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddLayer = async (customCoords?: any) => {
    if (!layout) return;
    try {
      const posX = (customCoords && typeof customCoords.x === 'number') ? customCoords.x : 100;
      const posY = (customCoords && typeof customCoords.y === 'number') ? customCoords.y : 100;
      const newZ = await api.createLayer({
        layoutId: layout.id,
        name: `Kotak Lapisan ${layers.length + 1}`,
        x: posX,
        y: posY,
        width: Math.round(layout.canvasWidth * 0.4),
        height: Math.round(layout.canvasHeight * 0.4),
        zIndex: layers.length + 1,
        backgroundColor: '#1e293b',
      });
      const newLayer: Layer = {
        id: newZ.id,
        layoutId: layout.id,
        name: newZ.name,
        x: Number(newZ.x) || posX,
        y: Number(newZ.y) || posY,
        width: Number(newZ.width) || Math.round(layout.canvasWidth * 0.4),
        height: Number(newZ.height) || Math.round(layout.canvasHeight * 0.4),
        zIndex: Number(newZ.zIndex) || (layers.length + 1),
        blocksList: [],
        backgroundColor: newZ.backgroundColor || '#1e293b',
        isLocked: false,
        createdAt: newZ.createdAt || new Date().toISOString(),
        updatedAt: newZ.updatedAt || new Date().toISOString(),
      };
      setLayers([newLayer, ...layers]);
      setSelectedLayerId(newLayer.id);
    } catch (err: any) {
      console.error('Failed to create layer:', err);
    }
  };

  const handleDeleteLayer = (layerId: string) => {
    if (!layerId.startsWith('z-')) {
      setDeletedLayerIds((prev) => [...prev, layerId]);
    }
    const updated = layers.filter((z) => z.id !== layerId);
    setLayers(updated);
    if (selectedLayerId === layerId) {
      setSelectedLayerId(updated.length > 0 ? updated[0].id : null);
    }
  };

  const updateSelectedLayer = (field: keyof Layer, value: any) => {
    if (!selectedLayerId) return;

    if (field === 'blocksList') {
      const currentBlocks = layers.find((z) => z.id === selectedLayerId)?.blocksList || [];
      const newBlocks = (value || []) as any[];
      const newBlockIds = newBlocks.map((b) => b.id);
      const removedBlocks = currentBlocks.filter((b) => !newBlockIds.includes(b.id) && !b.id.startsWith('temp-'));
      if (removedBlocks.length > 0) {
        setDeletedBlockIds((prev) => [...prev, ...removedBlocks.map((b) => b.id)]);
      }
    }

    setLayers((prev) =>
      prev.map((z) => {
        if (z.id === selectedLayerId) {
          return { ...z, [field]: value };
        }
        return z;
      })
    );
  };

  const reorderLayers = (sourceId: string, targetId: string) => {
    if (!sourceId || !targetId || sourceId === targetId) return;
    setLayers((prev) => {
      const sorted = [...prev].sort((a, b) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
      const sourceIdx = sorted.findIndex((l) => l.id === sourceId);
      const targetIdx = sorted.findIndex((l) => l.id === targetId);
      if (sourceIdx === -1 || targetIdx === -1) return prev;

      const updated = [...sorted];
      const [moved] = updated.splice(sourceIdx, 1);
      updated.splice(targetIdx, 0, moved);

      const total = updated.length;
      return updated.map((layer, index) => ({
        ...layer,
        zIndex: total - index,
      }));
    });
  };

  const duplicateLayer = async (layerId: string) => {
    if (!layout) return;
    const target = layers.find((l) => l.id === layerId);
    if (!target) return;
    try {
      const offsetX = Math.min(layout.canvasWidth - 100, (Number(target.x) || 0) + 30);
      const offsetY = Math.min(layout.canvasHeight - 100, (Number(target.y) || 0) + 30);
      const newZ = await api.createLayer({
        layoutId: layout.id,
        name: `${target.name} (Salinan)`,
        x: offsetX,
        y: offsetY,
        width: Number(target.width) || 400,
        height: Number(target.height) || 300,
        zIndex: layers.length + 1,
        backgroundColor: target.backgroundColor || '#1e293b',
      });
      const duplicatedLayer: Layer = {
        id: newZ.id,
        layoutId: layout.id,
        name: newZ.name,
        x: Number(newZ.x) || offsetX,
        y: Number(newZ.y) || offsetY,
        width: Number(newZ.width) || Number(target.width) || 400,
        height: Number(newZ.height) || Number(target.height) || 300,
        zIndex: layers.length + 1,
        blocksList: (target.blocksList || []).map((b) => ({
          ...b,
          id: 'temp-' + crypto.randomUUID(),
          layerId: newZ.id,
        })),
        backgroundColor: newZ.backgroundColor || target.backgroundColor || '#1e293b',
        isLocked: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setLayers([duplicatedLayer, ...layers]);
      setSelectedLayerId(duplicatedLayer.id);
    } catch (err) {
      console.error('Failed to duplicate layer:', err);
    }
  };

  const alignLayer = (layerId: string, alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | 'fill' | 'split-left' | 'split-right' | 'ticker-bottom' | 'header-top') => {
    if (!layout) return;
    setLayers((prev) =>
      prev.map((l) => {
        if (l.id !== layerId) return l;
        const w = Number(l.width) || 200;
        const h = Number(l.height) || 200;
        const cW = layout.canvasWidth;
        const cH = layout.canvasHeight;
        let nextX = Number(l.x) || 0;
        let nextY = Number(l.y) || 0;
        let nextW = w;
        let nextH = h;

        switch (alignment) {
          case 'left':
            nextX = 0;
            break;
          case 'center':
            nextX = Math.round((cW - w) / 2);
            break;
          case 'right':
            nextX = Math.round(cW - w);
            break;
          case 'top':
            nextY = 0;
            break;
          case 'middle':
            nextY = Math.round((cH - h) / 2);
            break;
          case 'bottom':
            nextY = Math.round(cH - h);
            break;
          case 'fill':
            nextX = 0;
            nextY = 0;
            nextW = cW;
            nextH = cH;
            break;
          case 'split-left':
            nextX = 0;
            nextY = 0;
            nextW = Math.round(cW / 2);
            nextH = cH;
            break;
          case 'split-right':
            nextX = Math.round(cW / 2);
            nextY = 0;
            nextW = Math.round(cW / 2);
            nextH = cH;
            break;
          case 'ticker-bottom':
            nextX = 0;
            nextY = Math.round(cH * 0.88);
            nextW = cW;
            nextH = Math.round(cH * 0.12);
            break;
          case 'header-top':
            nextX = 0;
            nextY = 0;
            nextW = cW;
            nextH = Math.round(cH * 0.15);
            break;
        }
        return { ...l, x: nextX, y: nextY, width: nextW, height: nextH };
      })
    );
  };

  const toggleLockLayer = (layerId: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === layerId ? { ...l, isLocked: !l.isLocked } : l))
    );
  };

  const bringToFront = (layerId: string) => {
    const sorted = [...layers].sort((a, b) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
    if (sorted.length > 0 && sorted[0].id !== layerId) {
      reorderLayers(layerId, sorted[0].id);
    }
  };

  const sendToBack = (layerId: string) => {
    const sorted = [...layers].sort((a, b) => (Number(b.zIndex) || 0) - (Number(a.zIndex) || 0));
    if (sorted.length > 0 && sorted[sorted.length - 1].id !== layerId) {
      reorderLayers(layerId, sorted[sorted.length - 1].id);
    }
  };

  return (
    <LayoutStateContext.Provider
      value={{
        layout,
        layoutName,
        setLayoutName,
        layers,
        setLayers,
        selectedLayerId,
        setSelectedLayerId,
        loading,
        saving,
        handleSave,
        handleAddLayer,
        handleDeleteLayer,
        updateSelectedLayer,
        reorderLayers,
        duplicateLayer,
        alignLayer,
        toggleLockLayer,
        bringToFront,
        sendToBack,
      }}
    >
      {children}
    </LayoutStateContext.Provider>
  );
}

export function useLayoutState() {
  const context = useContext(LayoutStateContext);
  if (!context) {
    throw new Error('useLayoutState must be used within a LayoutStateProvider');
  }
  return context;
}
