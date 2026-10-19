'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import {
  DisplayDetailProvider,
  useDisplayDetail,
} from './context/DisplayDetailContext';
import DisplayCommandToolbar from './components/DisplayCommandToolbar';
import DisplayTelemetryCard from './components/DisplayTelemetryCard';

const DisplayPlaybackDiagnostics = dynamic(
  () => import('./components/DisplayPlaybackDiagnostics'),
  {
    loading: () => (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
        <span style={{ fontSize: '0.8125rem' }}>Memuat diagnostik media...</span>
      </div>
    ),
    ssr: false,
  }
);

const DisplayAnalyticsChart = dynamic(
  () => import('./components/DisplayAnalyticsChart'),
  {
    loading: () => (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
        <span style={{ fontSize: '0.8125rem' }}>Memuat grafik telemetri...</span>
      </div>
    ),
    ssr: false,
  }
);

const DisplayPlaybackAuditTable = dynamic(
  () => import('./components/DisplayPlaybackAuditTable'),
  {
    loading: () => (
      <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={18} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
        <span style={{ fontSize: '0.8125rem' }}>Memuat tabel audit tayang...</span>
      </div>
    ),
    ssr: false,
  }
);

const DisplayScreenshotModal = dynamic(
  () => import('./components/DisplayScreenshotModal'),
  { ssr: false }
);

function DisplayDetailView() {
  const { device, loading } = useDisplayDetail();

  if (loading || !device) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data display...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <DisplayCommandToolbar />
      <DisplayTelemetryCard />
      <DisplayPlaybackDiagnostics />
      <DisplayAnalyticsChart />
      <DisplayPlaybackAuditTable />
      <DisplayScreenshotModal />
    </div>
  );
}

export default function ViewDisplayPage() {
  const params = useParams() as { id: string };

  return (
    <DisplayDetailProvider deviceId={params.id}>
      <DisplayDetailView />
    </DisplayDetailProvider>
  );
}
