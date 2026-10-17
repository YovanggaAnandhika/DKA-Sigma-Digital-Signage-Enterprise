'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, Layout, MessageSquare, Users, Volume2, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { useQueueEditor } from '../context/QueueEditorContext';

function TabLoadingSkeleton({ label }: { label: string }) {
  return (
    <div
      className="card-elevated"
      style={{
        padding: '40px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
      }}
    >
      <RefreshCw size={24} className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
      <span style={{ fontSize: '0.875rem' }}>{label}</span>
    </div>
  );
}

const TabLayoutTab = dynamic(() => import('./tabs/TabLayoutTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat editor tata letak..." />,
});

const TabMarqueeTab = dynamic(() => import('./tabs/TabMarqueeTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat editor teks berjalan..." />,
});

const TabCountersTab = dynamic(() => import('./tabs/TabCountersTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat daftar loket..." />,
});

const TabAudioTab = dynamic(() => import('./tabs/TabAudioTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat pengaturan audio chime..." />,
});

export default function QueueEditorShell({ activeTab, children }: { activeTab: string; children?: React.ReactNode }) {
  const { queue, updateField, saveQueue, saving, isNew, loading } = useQueueEditor();
  const { isFullscreen, setFullscreen } = useAppContext();

  useEffect(() => {
    setFullscreen(true);
    return () => setFullscreen(false);
  }, [setFullscreen]);

  const basePath = isNew
    ? '/studio/components/ticket/create'
    : `/studio/components/ticket/${queue.id}/edit`;

  const tabs = [
    { id: 'layout', label: 'Tata Letak', icon: Layout },
    { id: 'marquee', label: 'Running Text', icon: MessageSquare },
    { id: 'counters', label: 'Daftar Loket', icon: Users },
    { id: 'audio', label: 'Audio & Chime', icon: Volume2 },
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <TabLoadingSkeleton label="Menyiapkan editor antrian..." />
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
      }}
    >
      {/* Top Header & Tabs Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 20px',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          zIndex: 10,
          gap: '16px',
          minHeight: '56px',
        }}
      >
        {/* Left: Back button & Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
          <Link
            href="/studio/components/ticket"
            className="btn btn-outline"
            style={{ width: '30px', height: '30px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '6px', flexShrink: 0 }}
            title="Kembali ke Daftar Komponen"
          >
            <ArrowLeft size={15} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <input
              type="text"
              value={queue.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nama Layar Antrian..."
              className="form-input"
              style={{
                fontSize: '0.95rem',
                fontWeight: 700,
                padding: '3px 8px',
                width: 'auto',
                minWidth: '160px',
                maxWidth: '320px',
                backgroundColor: 'transparent',
                borderColor: 'transparent',
                color: 'var(--text-primary)',
              }}
            />
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              {queue.canvasWidth} × {queue.canvasHeight} px
            </span>
          </div>
        </div>

        {/* Center: Sleek Segmented Route Tabs */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '2px',
            backgroundColor: 'var(--bg-surface-elevated)',
            padding: '2px',
            borderRadius: '8px',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <Link
                key={t.id}
                href={`${basePath}/${t.id}`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.75rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--primary-400)' : 'var(--text-secondary)',
                  backgroundColor: isActive ? 'rgba(37, 99, 235, 0.12)' : 'transparent',
                  border: isActive ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid transparent',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                  whiteSpace: 'nowrap',
                }}
              >
                <Icon size={13} />
                <span>{t.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={() => setFullscreen(!isFullscreen)}
            className="btn btn-outline"
            style={{
              padding: '5px 10px',
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
            title={isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Mode Layar Penuh Fokus Editor'}
          >
            {isFullscreen ? <Minimize size={13} /> : <Maximize size={13} />}
            <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
          </button>

          <button
            type="button"
            onClick={saveQueue}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {saving ? (
              <>
                <RefreshCw size={13} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <Save size={13} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Full-Width Content Workspace */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: activeTab === 'layout' && !children ? 'hidden' : 'auto', width: '100%' }}>
        {children ? (
          <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}>{children}</div>
        ) : (
          <>
            {activeTab === 'layout' && <TabLayoutTab />}
            {activeTab === 'marquee' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabMarqueeTab /></div>}
            {activeTab === 'counters' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabCountersTab /></div>}
            {activeTab === 'audio' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabAudioTab /></div>}
            {!['layout', 'marquee', 'counters', 'audio'].includes(activeTab) && <TabLayoutTab />}
          </>
        )}
      </div>
    </div>
  );
}
