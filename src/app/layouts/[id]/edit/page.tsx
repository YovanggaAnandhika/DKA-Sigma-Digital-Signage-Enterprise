'use client';

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { LayoutEditorProvider, useLayoutEditor } from './context/LayoutEditorContext';
import TopToolbar from './components/TopToolbar';
import LayersPanel from './components/LayersPanel';
import CanvasWorkspace from './components/CanvasWorkspace';
import TimelineEditor from './components/TimelineEditor';
import InspectorPanel from './components/InspectorPanel';

function EditorContent() {
  const { loading, layout } = useLayoutEditor();

  if (loading || !layout) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat Canvas Designer...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)', margin: '-24px', backgroundColor: 'var(--bg-base)', overflow: 'hidden' }}>
      <TopToolbar />
      
      {/* Main Workspace (Docked Layout) */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        <LayersPanel />
        
        {/* Center Column: Canvas + Timeline */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', backgroundColor: '#e2e8f0' }}>
          <CanvasWorkspace />
          <TimelineEditor />
        </div>
        
        <InspectorPanel />
      </div>
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
