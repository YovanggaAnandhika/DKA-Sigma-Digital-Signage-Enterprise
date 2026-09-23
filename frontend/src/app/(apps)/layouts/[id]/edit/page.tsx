'use client';

import React from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { LayoutEditorProvider, useLayoutEditor } from './context/LayoutEditorContext';
import TopToolbar from './components/TopToolbar';
import LayersPanel from './components/LayersPanel';
import CanvasWorkspace from './components/CanvasWorkspace';
import TimelineEditor from './components/TimelineEditor';
import InspectorPanel from './components/InspectorPanel';
import LayerBlockList from './components/layers/LayerBlockList';
import PlaylistPickerModal from './components/PlaylistPickerModal';
import MediaPickerModal from './components/MediaPickerModal';

function EditorContent() {
  const {
    loading,
    layout,
    togglePlay,
    isFullscreen,
    toast,
    leftSidebarWidth,
    setLeftSidebarWidth,
    isLayersCollapsed,
    isPlaylistCollapsed,
  } = useLayoutEditor();
  const [isDraggingSidebar, setIsDraggingSidebar] = React.useState(false);

  const areBothCollapsed = isLayersCollapsed && isPlaylistCollapsed;
  const currentSidebarWidth = areBothCollapsed ? 36 : leftSidebarWidth;

  const [playlistHeight, setPlaylistHeight] = React.useState<number>(260);
  const [isDraggingVertical, setIsDraggingVertical] = React.useState(false);

  const handleVerticalResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingVertical(true);
    const startY = e.clientY;
    const startH = playlistHeight;

    const onMouseMove = (ev: MouseEvent) => {
      // Moving up increases playlistHeight, moving down decreases playlistHeight
      const delta = startY - ev.clientY;
      setPlaylistHeight(Math.min(600, Math.max(120, startH + delta)));
    };
    const onMouseUp = () => {
      setIsDraggingVertical(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  const handleSidebarResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDraggingSidebar(true);
    const startX = e.clientX;
    const startW = leftSidebarWidth;

    const onMouseMove = (ev: MouseEvent) => {
      const delta = ev.clientX - startX;
      setLeftSidebarWidth(Math.min(500, Math.max(180, startW + delta)));
    };
    const onMouseUp = () => {
      setIsDraggingSidebar(false);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay]);

  if (loading || !layout) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat Canvas Designer...</span>
      </div>
    );
  }

  return (
    <div
      id="layout-editor-container"
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        height: '100%',
        minHeight: 0,
        backgroundColor: 'var(--bg-surface-elevated)',
        overflow: 'hidden',
        position: 'relative',
        ...(isFullscreen ? {
          position: 'fixed' as const,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 99999,
        } : {})
      }}
    >
      <TopToolbar />

      {/* Main Workspace */}
      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
        {/* Left Stacked Column: Top (Layers) and Bottom (Alokasi Playlist) with unified resize */}
        <div
          style={{
            width: `${currentSidebarWidth}px`,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            flexShrink: 0,
            borderRight: '1px solid var(--border-subtle)',
            backgroundColor: 'var(--bg-surface)',
            position: 'relative',
            zIndex: 5,
            transition: isDraggingSidebar ? 'none' : 'width 0.2s ease',
          }}
        >
          <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <LayersPanel />
          </div>

          {/* Horizontal drag separator between Layers and Alokasi Playlist (when playlist is not collapsed) */}
          {!isPlaylistCollapsed && (
            <div
              onMouseDown={handleVerticalResizeMouseDown}
              style={{
                height: '5px',
                cursor: 'row-resize',
                backgroundColor: isDraggingVertical ? 'var(--primary-400)' : 'var(--border-subtle)',
                position: 'relative',
                zIndex: 10,
                flexShrink: 0,
                transition: 'background 0.15s',
              }}
              title="Tarik atas/bawah untuk mengubah tinggi Alokasi Playlist"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--primary-400)'; }}
              onMouseLeave={(e) => { if (!isDraggingVertical) e.currentTarget.style.backgroundColor = 'var(--border-subtle)'; }}
            />
          )}

          {/* Bottom container: Alokasi Playlist with adjustable height */}
          <div
            style={{
              height: isPlaylistCollapsed ? 'auto' : `${playlistHeight}px`,
              maxHeight: isPlaylistCollapsed ? 'none' : '70%',
              minHeight: isPlaylistCollapsed ? 'auto' : '120px',
              display: 'flex',
              flexDirection: 'column',
              flexShrink: 0,
              overflow: 'hidden',
            }}
          >
            <LayerBlockList />
          </div>

          {/* Unified continuous resize handle on the right edge (only when not both collapsed) */}
          {!areBothCollapsed && (
            <div
              onMouseDown={handleSidebarResizeMouseDown}
              style={{
                position: 'absolute',
                top: 0,
                right: -3,
                bottom: 0,
                width: '6px',
                cursor: 'col-resize',
                zIndex: 20,
                backgroundColor: isDraggingSidebar ? 'var(--primary-400)' : 'transparent',
                transition: 'background 0.15s',
              }}
              title="Tarik untuk mengubah lebar panel sidebar"
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(14,165,233,0.3)'; }}
              onMouseLeave={(e) => { if (!isDraggingSidebar) e.currentTarget.style.backgroundColor = 'transparent'; }}
            />
          )}
        </div>

        {/* Center Column: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, overflow: 'hidden', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <CanvasWorkspace />
        </div>

        <InspectorPanel />
      </div>

      {/* Timeline spans full width at the bottom */}
      <TimelineEditor />

      <PlaylistPickerModal />
      <MediaPickerModal />

      {/* Toast Notification — rendered inside container, safe for fullscreen */}
      {toast && (
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '12px 20px',
          borderRadius: '10px',
          backgroundColor: toast.type === 'success' ? '#10b981' : '#f43f5e',
          color: '#fff',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: '0 8px 30px rgba(0,0,0,0.35)',
          whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}

export default function EditLayoutCanvasPage() {
  return (
    <LayoutEditorProvider>
      <EditorContent />
    </LayoutEditorProvider>
  );
}
