'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { ArrowLeft, Save, Layout, MessageSquare, Users, Volume2, RefreshCw, Maximize, Minimize, PlaySquare, Cpu, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAppContext } from '@/components/AppContext';
import { useQueueEditor } from '../context/QueueEditorContext';
import { api, Resolution } from '@/lib/services';
import { SingleSelect } from '@/components/ui/SingleSelect';

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

const TabEditorControllTab = dynamic(() => import('./tabs/TabEditorControllTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat konsol pemanggil antrian..." />,
});

const TabIotTab = dynamic(() => import('./tabs/TabIotTab'), {
  ssr: false,
  loading: () => <TabLoadingSkeleton label="Memuat integrasi perangkat IoT & tombol antrean..." />,
});

export default function QueueEditorShell({ activeTab, children }: { activeTab: string; children?: React.ReactNode }) {
  const { queue, setQueue, updateField, saveQueue, saving, isNew, loading, sectors, selectSector } = useQueueEditor();
  const { isFullscreen, setFullscreen } = useAppContext();

  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [resolutionsLoading, setResolutionsLoading] = useState(false);
  const tabScrollRef = useRef<HTMLDivElement>(null);

  // Fetch resolutions from common resolution API
  useEffect(() => {
    let isMounted = true;
    setResolutionsLoading(true);
    api.getResolutions()
      .then((items) => {
        if (isMounted) {
          setResolutions(items || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load canvas resolutions:', err);
      })
      .finally(() => {
        if (isMounted) {
          setResolutionsLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Format options for SingleSelect
  const currentResolutionValue = `${queue.canvasWidth || 1920}x${queue.canvasHeight || 1080}`;

  const resolutionOptions = useMemo(() => {
    const options = resolutions.map((r) => ({
      value: `${r.width}x${r.height}`,
      label: `${r.name} (${r.width}×${r.height})`,
      hint: r.aspectRatio || `${r.width}:${r.height}`,
    }));

    if (
      queue.canvasWidth &&
      queue.canvasHeight &&
      !options.some((o) => o.value === currentResolutionValue)
    ) {
      options.unshift({
        value: currentResolutionValue,
        label: `Kustom (${queue.canvasWidth}×${queue.canvasHeight})`,
        hint: 'Preset saat ini',
      });
    }

    return options;
  }, [resolutions, queue.canvasWidth, queue.canvasHeight, currentResolutionValue]);

  const handleResolutionChange = (val: string) => {
    const [w, h] = val.split('x').map(Number);
    if (w && h) {
      setQueue((prev) => ({
        ...prev,
        canvasWidth: w,
        canvasHeight: h,
      }));
    }
  };

  // Jangan paksa fullscreen secara default saat mount agar pengguna memegang kendali
  useEffect(() => {
    return () => setFullscreen(false);
  }, [setFullscreen]);

  // Auto-scroll the active tab into center view
  useEffect(() => {
    if (tabScrollRef.current) {
      const activeEl = tabScrollRef.current.querySelector('[data-tab-active="true"]') as HTMLElement | null;
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }
  }, [activeTab]);

  const basePath = isNew
    ? '/studio/components/ticket/create'
    : `/studio/components/ticket/${queue.id}/edit`;

  const counterLabel = queue?.counterLabel || 'Loket';

  const tabs = [
    { id: 'controll', label: 'Konsol & Monitor', icon: PlaySquare },
    { id: 'layout', label: 'Tata Letak', icon: Layout },
    { id: 'marquee', label: 'Running Text', icon: MessageSquare },
    { id: 'counters', label: `Daftar ${counterLabel}`, icon: Users },
    { id: 'audio', label: 'Audio & TTS', icon: Volume2 },
    { id: 'iot', label: 'Perangkat IoT / Tombol', icon: Cpu },
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
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        minHeight: 0,
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        position: isFullscreen ? 'fixed' : 'relative',
        top: isFullscreen ? 0 : undefined,
        left: isFullscreen ? 0 : undefined,
        right: isFullscreen ? 0 : undefined,
        bottom: isFullscreen ? 0 : undefined,
        width: isFullscreen ? '100vw' : '100%',
        height: isFullscreen ? '100vh' : '100%',
        zIndex: isFullscreen ? 99999 : undefined,
      }}
    >
      {/* Seamless Minimalist Header */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--bg-surface)',
          borderBottom: '1px solid var(--border-subtle)',
          flexShrink: 0,
          zIndex: 10,
          padding: '16px 28px 0 28px',
          gap: '16px',
        }}
      >
        {/* Row 1: Heading with Rounded Back Button & Actions */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <Link
              href="/studio/components/ticket"
              className="btn btn-outline"
              style={{
                width: '38px',
                height: '38px',
                padding: 0,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Kembali ke Daftar Komponen"
              aria-label="Kembali ke Daftar Komponen"
            >
              <ArrowLeft size={17} />
            </Link>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <h1
                style={{
                  margin: 0,
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  letterSpacing: '-0.01em',
                  color: 'var(--text-primary)',
                  lineHeight: 1.2,
                }}
              >
                {isNew ? 'Buat Komponen Layar Antrean' : (queue.name || 'Editor Layar Antrean')}
              </h1>
              <p style={{ margin: '3px 0 0 0', fontSize: '0.78125rem', color: 'var(--text-muted)' }}>
                Studio Komponen / Antrean
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => {
                if (!document.fullscreenElement) {
                  document.documentElement.requestFullscreen().catch(() => {});
                  setFullscreen(true);
                } else {
                  document.exitFullscreen().catch(() => {});
                  setFullscreen(false);
                }
              }}
              className="btn btn-outline"
              style={{
                padding: '6px 12px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: '8px',
              }}
              title={isFullscreen ? 'Keluar Fullscreen (Esc)' : 'Mode Layar Penuh Fokus Editor'}
            >
              {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>

            <button
              type="button"
              onClick={saveQueue}
              disabled={saving}
              className="btn btn-primary"
              style={{
                padding: '6px 16px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '7px',
                borderRadius: '8px',
              }}
            >
              {saving ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Row 2: 6:6 Form (Judul Queue & Resolusi Kanvas) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '20px',
            alignItems: 'flex-end',
          }}
        >
          {/* Kolom 6: Form Judul Queue */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label
              style={{
                fontSize: '0.72rem',
                fontWeight: 600,
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              Nama Layar Antrean
            </label>
            <input
              type="text"
              value={queue.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="Nama Layar Antrian..."
              className="form-input"
              style={{
                fontSize: '0.875rem',
                fontWeight: 600,
                height: '38px',
                backgroundColor: 'var(--bg-primary)',
                border: '1px solid var(--border-subtle)',
                borderRadius: '8px',
              }}
            />
          </div>

          {/* Kolom 6: Form Pilih Resolusi dari Endpoint */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <label
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                Preset Resolusi Kanvas
              </label>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                {queue.canvasWidth} × {queue.canvasHeight} px
              </span>
            </div>
            <SingleSelect
              value={currentResolutionValue}
              onChange={handleResolutionChange}
              options={resolutionOptions}
              placeholder={resolutionsLoading ? 'Memuat resolusi...' : 'Pilih Resolusi Kanvas...'}
              disabled={resolutionsLoading}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        {/* Row 3: All Tabs with Gravity Center (Minimalist Underline, Horizontal Scroll on narrow viewports) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            marginTop: '6px',
          }}
        >
          <div
            ref={tabScrollRef}
            className="no-scrollbar"
            onWheel={(e) => {
              if (e.deltaY && tabScrollRef.current) {
                tabScrollRef.current.scrollLeft += e.deltaY;
              }
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '24px',
              width: 'auto',
              maxWidth: '100%',
              overflowX: 'auto',
              overflowY: 'hidden',
              whiteSpace: 'nowrap',
              WebkitOverflowScrolling: 'touch',
              scrollBehavior: 'smooth',
              paddingBottom: '0px',
              marginBottom: '-1px',
            }}
          >
            {tabs.map((t) => {
              const Icon = t.icon;
              const isActive = activeTab === t.id;
              return (
                <Link
                  key={t.id}
                  href={`${basePath}/${t.id}`}
                  data-tab-active={isActive ? 'true' : 'false'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '10px 4px 12px 4px',
                    fontSize: '0.84rem',
                    fontWeight: isActive ? 600 : 500,
                    color: isActive ? 'var(--primary-400)' : 'var(--text-muted)',
                    borderBottom: isActive ? '2px solid var(--primary-500)' : '2px solid transparent',
                    textDecoration: 'none',
                    transition: 'all 0.15s ease',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    userSelect: 'none',
                  }}
                >
                  <Icon size={15} style={{ color: isActive ? 'var(--primary-400)' : 'var(--text-muted)' }} />
                  <span>{t.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>


      {/* Main Full-Width Content Workspace */}
      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflow: activeTab === 'layout' && !children ? 'hidden' : 'auto', width: '100%' }}>
        {children ? (
          <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}>{children}</div>
        ) : (
          <>
            {activeTab === 'controll' && <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, display: 'flex' }}><TabEditorControllTab /></div>}
            {activeTab === 'layout' && <TabLayoutTab />}
            {activeTab === 'marquee' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabMarqueeTab /></div>}
            {activeTab === 'counters' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabCountersTab /></div>}
            {activeTab === 'audio' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabAudioTab /></div>}
            {activeTab === 'iot' && <div style={{ flex: 1, padding: '24px 28px', width: '100%' }}><TabIotTab /></div>}
            {!['controll', 'layout', 'marquee', 'counters', 'audio', 'iot'].includes(activeTab) && <div style={{ flex: 1, width: '100%', height: '100%', minHeight: 0, display: 'flex' }}><TabEditorControllTab /></div>}
          </>
        )}
      </div>
    </div>
  );
}
