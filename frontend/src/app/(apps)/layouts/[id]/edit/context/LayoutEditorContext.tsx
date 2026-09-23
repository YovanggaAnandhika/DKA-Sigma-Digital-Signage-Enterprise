'use client';

import React, { ReactNode } from 'react';
import { LayoutStateProvider, useLayoutState, Zone } from './LayoutStateContext';
import { LayoutPlaybackProvider, useLayoutPlayback } from './LayoutPlaybackContext';
import { LayoutCanvasProvider, useLayoutCanvas } from './LayoutCanvasContext';
import { LayoutUIProvider, useLayoutUI } from './LayoutUIContext';

export type { Zone };
export { useLayoutState, useLayoutPlayback, useLayoutCanvas, useLayoutUI };

function LayoutEditorInnerProvider({ children }: { children: ReactNode }) {
  const { zones, layout } = useLayoutState();

  return (
    <LayoutPlaybackProvider zones={zones}>
      <LayoutCanvasProvider layout={layout}>
        <LayoutUIProvider>{children}</LayoutUIProvider>
      </LayoutCanvasProvider>
    </LayoutPlaybackProvider>
  );
}

export function LayoutEditorProvider({ children }: { children: ReactNode }) {
  return (
    <LayoutStateProvider>
      <LayoutEditorInnerProvider>{children}</LayoutEditorInnerProvider>
    </LayoutStateProvider>
  );
}

export function useLayoutEditor() {
  const state = useLayoutState();
  const playback = useLayoutPlayback();
  const canvas = useLayoutCanvas();
  const ui = useLayoutUI();

  return {
    ...state,
    ...playback,
    ...canvas,
    ...ui,
    handleSave: () => state.handleSave(ui.showToast),
  };
}
