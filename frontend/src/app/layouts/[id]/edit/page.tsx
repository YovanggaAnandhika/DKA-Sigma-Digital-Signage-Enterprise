'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { LayoutEditorProvider, useLayoutEditor } from './context/LayoutEditorContext';
import TopToolbar from './components/TopToolbar';
import LayersPanel from './components/LayersPanel';
import CanvasWorkspace from './components/CanvasWorkspace';
import TimelineEditor from './components/TimelineEditor';
import InspectorPanel from './components/InspectorPanel';
import PlaylistPickerModal from './components/PlaylistPickerModal';
import MediaPickerModal from './components/MediaPickerModal';

function EditorContent() {
  const { loading, layout, togglePlay } = useLayoutEditor();

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault(); // Prevent scrolling down
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
    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
      <TopToolbar />
      
      {/* Main Workspace (Docked Layout) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LayersPanel />
        
        {/* Center Column: Canvas */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: 'var(--bg-base)' }}>
          <CanvasWorkspace />
        </div>
        
        <InspectorPanel />
      </div>

      {/* Timeline spans full width at the bottom */}
      <TimelineEditor />

      <PlaylistPickerModal />
      <MediaPickerModal />
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
