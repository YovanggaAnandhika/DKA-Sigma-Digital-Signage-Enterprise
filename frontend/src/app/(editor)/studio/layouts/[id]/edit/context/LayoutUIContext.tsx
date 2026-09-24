'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { api, Playlist, MediaItem, Transition, VisualFilter } from '@/lib/services';

interface LayoutUIContextType {
  pickerZoneId: string | null;
  setPickerZoneId: React.Dispatch<React.SetStateAction<string | null>>;
  mediaPickerZoneId: string | null;
  setMediaPickerZoneId: React.Dispatch<React.SetStateAction<string | null>>;
  hiddenZones: string[];
  toggleZoneVisibility: (layerId: string) => void;
  isTimelineExpanded: boolean;
  setIsTimelineExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isLayoutMetaExpanded: boolean;
  setIsLayoutMetaExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  isFullscreen: boolean;
  toggleFullscreen: () => void;
  toast: { message: string; type: 'success' | 'error' } | null;
  showToast: (message: string, type?: 'success' | 'error') => void;
  bufferedRanges: { start: number; end: number }[];
  reportBuffer: (ranges: { start: number; end: number }[]) => void;
  leftSidebarWidth: number;
  setLeftSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  isLayersCollapsed: boolean;
  setIsLayersCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  isPlaylistCollapsed: boolean;
  setIsPlaylistCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  rightSidebarWidth: number;
  setRightSidebarWidth: React.Dispatch<React.SetStateAction<number>>;
  isInspectorCollapsed: boolean;
  setIsInspectorCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  selectedBlockId: string | null;
  setSelectedBlockId: React.Dispatch<React.SetStateAction<string | null>>;
  inspectorTarget: 'layer' | 'block' | 'timeline' | 'layout';
  setInspectorTarget: React.Dispatch<React.SetStateAction<'layer' | 'block' | 'timeline' | 'layout'>>;
  availablePlaylists: Playlist[];
  mediaList: MediaItem[];
  transitionsList: Transition[];
  visualFiltersList: VisualFilter[];
  refreshPlaylistsAndMedia: () => Promise<void>;
}

const LayoutUIContext = createContext<LayoutUIContextType | undefined>(undefined);

export function LayoutUIProvider({ children }: { children: ReactNode }) {
  const [pickerZoneId, setPickerZoneId] = useState<string | null>(null);
  const [mediaPickerZoneId, setMediaPickerZoneId] = useState<string | null>(null);
  const [hiddenZones, setHiddenZones] = useState<string[]>([]);
  const [isTimelineExpanded, setIsTimelineExpanded] = useState(true);
  const [isLayoutMetaExpanded, setIsLayoutMetaExpanded] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [bufferedRanges, setBufferedRanges] = useState<{ start: number; end: number }[]>([]);
  const [leftSidebarWidth, setLeftSidebarWidth] = useState<number>(240);
  const [isLayersCollapsed, setIsLayersCollapsed] = useState<boolean>(false);
  const [isPlaylistCollapsed, setIsPlaylistCollapsed] = useState<boolean>(false);
  const [rightSidebarWidth, setRightSidebarWidth] = useState<number>(300);
  const [isInspectorCollapsed, setIsInspectorCollapsed] = useState<boolean>(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [inspectorTarget, setInspectorTarget] = useState<'layer' | 'block' | 'timeline' | 'layout'>('layer');
  const [availablePlaylists, setAvailablePlaylists] = useState<Playlist[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [transitionsList, setTransitionsList] = useState<Transition[]>([]);
  const [visualFiltersList, setVisualFiltersList] = useState<VisualFilter[]>([]);

  const refreshPlaylistsAndMedia = useCallback(async () => {
    try {
      const [playlistsRes, mediaRes, transitionsRes, filtersRes] = await Promise.all([
        api.getPlaylists({ limit: 100 }).catch(() => ({ data: [] })),
        api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
        api.getTransitions({ limit: 100 }).catch(() => ({ data: [] })),
        api.getVisualFilters({ limit: 100 }).catch(() => ({ data: [] })),
      ]);
      setAvailablePlaylists((playlistsRes as any).data || []);
      setMediaList((mediaRes as any).data || []);
      setTransitionsList((transitionsRes as any).data || []);
      setVisualFiltersList((filtersRes as any).data || []);
    } catch {
      // Graceful catch
    }
  }, []);

  useEffect(() => {
    refreshPlaylistsAndMedia();
  }, [refreshPlaylistsAndMedia]);

  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const toggleZoneVisibility = (layerId: string) => {
    setHiddenZones((prev) => (prev.includes(layerId) ? prev.filter((id) => id !== layerId) : [...prev, layerId]));
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const reportBuffer = useCallback((ranges: { start: number; end: number }[]) => {
    setBufferedRanges(ranges);
  }, []);

  return (
    <LayoutUIContext.Provider
      value={{
        pickerZoneId,
        setPickerZoneId,
        mediaPickerZoneId,
        setMediaPickerZoneId,
        hiddenZones,
        toggleZoneVisibility,
        isTimelineExpanded,
        setIsTimelineExpanded,
        isLayoutMetaExpanded,
        setIsLayoutMetaExpanded,
        isFullscreen,
        toggleFullscreen,
        toast,
        showToast,
        bufferedRanges,
        reportBuffer,
        leftSidebarWidth,
        setLeftSidebarWidth,
        isLayersCollapsed,
        setIsLayersCollapsed,
        isPlaylistCollapsed,
        setIsPlaylistCollapsed,
        rightSidebarWidth,
        setRightSidebarWidth,
        isInspectorCollapsed,
        setIsInspectorCollapsed,
        selectedBlockId,
        setSelectedBlockId,
        inspectorTarget,
        setInspectorTarget,
        availablePlaylists,
        mediaList,
        transitionsList,
        visualFiltersList,
        refreshPlaylistsAndMedia,
      }}
    >
      {children}
    </LayoutUIContext.Provider>
  );
}

export function useLayoutUI() {
  const context = useContext(LayoutUIContext);
  if (!context) {
    throw new Error('useLayoutUI must be used within a LayoutUIProvider');
  }
  return context;
}
