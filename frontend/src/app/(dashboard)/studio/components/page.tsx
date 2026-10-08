'use client';

import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Layers,
  ListMusic,
  Globe,
  Images,
  Ticket,
  MessageSquareText,
  Clock,
  Sparkles,
} from 'lucide-react';

function ComponentTabSkeleton({ label }: { label: string }) {
  return (
    <div
      className="card-elevated"
      style={{
        padding: '60px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        color: 'var(--text-muted)',
      }}
    >
      <Sparkles size={24} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

// Dynamic Lazy-Loaded Component Tabs
const PlaylistManagerTab = dynamic(() => import('./tabs/PlaylistManagerTab'), {
  ssr: false,
  loading: () => <ComponentTabSkeleton label="Memuat Komponen Daftar Putar..." />,
});

const WebViewManagerTab = dynamic(() => import('./tabs/WebViewManagerTab'), {
  ssr: false,
  loading: () => <ComponentTabSkeleton label="Memuat Komponen Web View..." />,
});

const PhotoAlbumManagerTab = dynamic(() => import('./tabs/PhotoAlbumManagerTab'), {
  ssr: false,
  loading: () => <ComponentTabSkeleton label="Memuat Komponen Album Foto..." />,
});

const QueueTicketManagerTab = dynamic(() => import('./tabs/QueueTicketManagerTab'), {
  ssr: false,
  loading: () => <ComponentTabSkeleton label="Memuat Komponen Antrian & Tiket..." />,
});

const TickerManagerTab = dynamic(() => import('./tabs/TickerManagerTab'), {
  ssr: false,
  loading: () => <ComponentTabSkeleton label="Memuat Komponen Teks Berjalan..." />,
});

const ClockWeatherManagerTab = dynamic(() => import('./tabs/ClockWeatherManagerTab'), {
  ssr: false,
  loading: () => <ComponentTabSkeleton label="Memuat Komponen Jam & Cuaca..." />,
});

type TabType = 'playlist' | 'webview' | 'album' | 'ticket' | 'ticker' | 'clock';

interface TabItem {
  id: TabType;
  label: string;
  badge?: string;
  icon: React.ComponentType<any>;
}

const TABS: TabItem[] = [
  { id: 'playlist', label: 'Daftar Putar', icon: ListMusic },
  { id: 'webview', label: 'Web View', badge: 'Auto-Refresh', icon: Globe },
  { id: 'album', label: 'Album Foto', badge: 'Ken Burns', icon: Images },
  { id: 'ticket', label: 'Nomor Antrian', badge: 'Audio Chime', icon: Ticket },
  { id: 'ticker', label: 'Teks Berjalan', icon: MessageSquareText },
  { id: 'clock', label: 'Jam & Cuaca', icon: Clock },
];

function ComponentsPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const tabQuery = (searchParams?.get('tab') as TabType) || 'playlist';
  const [activeTab, setActiveTab] = useState<TabType>(tabQuery);

  useEffect(() => {
    if (tabQuery && TABS.some((t) => t.id === tabQuery)) {
      setActiveTab(tabQuery);
    }
  }, [tabQuery]);

  const handleTabChange = (tabId: TabType) => {
    setActiveTab(tabId);
    router.replace(`/studio/components?tab=${tabId}`, { scroll: false });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              padding: '12px',
              borderRadius: '16px',
              backgroundColor: 'rgba(59, 130, 246, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
            }}
          >
            <Layers size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Komponen Konten Layar
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Pusat pengelolaan widget dan komponen promosi: Daftar Putar, Web View, Album Foto, Nomor Antrian, Teks Berjalan, dan Jam & Cuaca.
            </p>
          </div>
        </div>
      </div>

      {/* Modern Tab Bar */}
      <div
        className="card-elevated"
        style={{
          padding: '6px',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          overflowX: 'auto',
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '12px',
        }}
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
                backgroundColor: isActive ? 'var(--primary-600)' : 'transparent',
                color: isActive ? '#ffffff' : 'var(--text-secondary)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '0.8125rem',
                boxShadow: isActive ? '0 2px 8px rgba(37, 99, 235, 0.3)' : 'none',
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  style={{
                    fontSize: '0.625rem',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '9999px',
                    backgroundColor: isActive ? 'rgba(255, 255, 255, 0.25)' : 'rgba(59, 130, 246, 0.15)',
                    color: isActive ? '#ffffff' : 'var(--primary-400)',
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels (Lazy Loaded Dynamic Render) */}
      <div style={{ marginTop: '4px' }}>
        {activeTab === 'playlist' && <PlaylistManagerTab />}
        {activeTab === 'webview' && <WebViewManagerTab />}
        {activeTab === 'album' && <PhotoAlbumManagerTab />}
        {activeTab === 'ticket' && <QueueTicketManagerTab />}
        {activeTab === 'ticker' && <TickerManagerTab />}
        {activeTab === 'clock' && <ClockWeatherManagerTab />}
      </div>
    </div>
  );
}

export default function ComponentsPage() {
  return (
    <Suspense fallback={<ComponentTabSkeleton label="Memuat Komponen..." />}>
      <ComponentsPageContent />
    </Suspense>
  );
}
