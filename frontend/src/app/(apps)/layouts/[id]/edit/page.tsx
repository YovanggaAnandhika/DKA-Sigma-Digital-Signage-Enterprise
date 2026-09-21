'use client';

import React from 'react';
import { RefreshCw, CheckCircle, XCircle } from 'lucide-react';
import { LayoutEditorProvider, useLayoutEditor } from './context/LayoutEditorContext';
import TopToolbar from './components/TopToolbar';
import LayersPanel from './components/LayersPanel';
import CanvasWorkspace from './components/CanvasWorkspace';
import TimelineEditor from './components/TimelineEditor';
import InspectorPanel from './components/InspectorPanel';
import PlaylistPickerModal from './components/PlaylistPickerModal';
import MediaPickerModal from './components/MediaPickerModal';

function EditorContent() {
  const { loading, layout, togglePlay, isFullscreen, toast } = useLayoutEditor();

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
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LayersPanel />

        {/* Center Column: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-surface-elevated)' }}>
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
