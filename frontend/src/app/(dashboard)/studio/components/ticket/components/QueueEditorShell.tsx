'use client';

import React from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, Layout, MessageSquare, Users, Volume2, RefreshCw, Maximize, Minimize } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { useQueueEditor } from '../context/QueueEditorContext';
import QueuePreviewMonitor from './QueuePreviewMonitor';

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

export default function QueueEditorShell({ activeTab }: { activeTab: string }) {
  const { queue, updateField, saveQueue, saving, isNew, loading } = useQueueEditor();
  const { isFullscreen, setFullscreen } = useAppContext();

  const basePath = isNew
    ? '/studio/components/ticket/create'
    : `/studio/components/ticket/${queue.id}/edit`;

  const tabs = [
    { id: 'layout', label: 'Tata Letak', icon: Layout },
    { id: 'marquee', label: 'Running Text', icon: MessageSquare },
    { id: 'counters', label: `Daftar Loket (${queue.counters.length})`, icon: Users },
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
        padding: isFullscreen ? '14px 20px' : '20px 28px',
        display: 'flex',
        flexDirection: 'column',
        gap: isFullscreen ? '12px' : '18px',
        flex: 1,
        minHeight: 0,
      }}
    >
      {/* Top Header Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1, minWidth: '280px' }}>
          <Link
            href="/studio/components/ticket"
            className="btn btn-secondary"
            style={{ padding: '8px', borderRadius: '10px' }}
            title="Kembali ke Daftar Komponen Antrian"
          >
            <ArrowLeft size={18} />
          </Link>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="text"
                value={queue.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Nama Layar Antrian..."
                className="form-input"
                style={{
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  padding: '4px 10px',
                  maxWidth: '480px',
                  backgroundColor: 'transparent',
                  borderColor: 'transparent',
                }}
              />
            </div>
            <p style={{ margin: '2px 0 0 10px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              {isNew ? 'Layar antrian baru' : queue.id} · {queue.canvasWidth} × {queue.canvasHeight} px
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => setFullscreen(!isFullscreen)}
            className="btn btn-outline"
            style={{
              padding: '9px 14px',
              fontSize: '0.8125rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              borderColor: isFullscreen ? 'var(--primary-500)' : undefined,
              color: isFullscreen ? 'var(--primary-500)' : undefined,
            }}
            title={isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Mode Layar Penuh Fokus Editor'}
          >
            {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            <span>{isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh'}</span>
          </button>

          <button
            type="button"
            onClick={saveQueue}
            disabled={saving}
            className="btn btn-primary"
            style={{ padding: '10px 24px', fontSize: '0.875rem' }}
          >
            {saving ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                <Save size={16} />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </div>

      {/* Modern Dynamic Tab Route Navigation Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '1px solid var(--border-subtle)',
          paddingBottom: '12px',
          overflowX: 'auto',
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
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
                border: isActive ? '1px solid var(--primary-600)' : '1px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.15s ease',
                whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {t.label}
            </Link>
          );
        })}
      </div>

      {/* Main Full-Width Content */}
      <div style={{ width: '100%' }}>
        {activeTab === 'layout' && <TabLayoutTab />}
        {activeTab === 'marquee' && <TabMarqueeTab />}
        {activeTab === 'counters' && <TabCountersTab />}
        {activeTab === 'audio' && <TabAudioTab />}
        {!['layout', 'marquee', 'counters', 'audio'].includes(activeTab) && <TabLayoutTab />}
      </div>
    </div>
  );
}
