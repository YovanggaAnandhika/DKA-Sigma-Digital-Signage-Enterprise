'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { api } from '@/lib/services';
import type { Device } from '@/lib/services/hardware';
import type { Layout, MediaItem, Playlist } from '@/lib/services/studio';
import { InsightCard, InsightItem } from '@/components/InsightCard';
import { Tv, RefreshCw } from 'lucide-react';
import DashboardStats from './components/DashboardStats';
import DashboardDeviceList from './components/DashboardDeviceList';
import DashboardServiceStatus from './components/DashboardServiceStatus';

// Load the chart dynamically to save initial bundle size
const TimelineChart = dynamic(() => import('@/components/charts/TimelineChart').then((mod) => mod.TimelineChart), {
  ssr: false,
});

export default function DashboardPage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [devRes, layRes, playRes, medRes] = await Promise.all([
        api.getDevices({ limit: 100 }),
        api.getLayouts({ limit: 100 }),
        api.getPlaylists({ limit: 100 }),
        api.getMedia({ limit: 100 }),
      ]);
      setDevices(devRes.data || []);
      setLayouts(layRes.data || []);
      setPlaylists(playRes.data || []);
      setMediaItems(medRes.data || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s live poll
    return () => clearInterval(interval);
  }, [loadData]);

  const totalDevices = devices.length;
  const onlineDevices = devices.filter((d) => d.isOnline).length;

  const insights: InsightItem[] = [
    {
      id: 'ins-1',
      title: 'Konektivitas Display Player Optimal',
      category: 'Fleet Health',
      description: `${onlineDevices} dari ${totalDevices} unit display Android player aktif mendengarkan stream gRPC bi-directional secara real-time.`,
      level: 'success',
    },
    {
      id: 'ins-2',
      title: 'Rollout Canary Distribusi Aktif',
      category: 'Canary Tier',
      description: 'Grup rollout bertahap aktif pada alokasi layout promosi multi-cabang tanpa interupsi layar.',
      level: 'info',
    },
  ];

  // Hourly playback & heartbeat simulation data matching Image 1
  const timelineData = [
    { label: '01:00', value: Math.max(1, onlineDevices) },
    { label: '03:00', value: Math.max(1, onlineDevices) },
    { label: '05:00', value: Math.max(1, onlineDevices - 1) },
    { label: '07:00', value: Math.max(2, onlineDevices) },
    { label: '09:00', value: Math.max(3, onlineDevices) },
    { label: '11:00', value: Math.max(3, onlineDevices) },
    { label: '13:00', value: Math.max(2, onlineDevices) },
    { label: '15:00', value: Math.max(4, onlineDevices) },
    { label: '17:00', value: Math.max(5, onlineDevices + 1) },
    { label: '19:00', value: Math.max(3, onlineDevices) },
    { label: '21:00', value: Math.max(2, onlineDevices) },
    { label: '23:00', value: Math.max(1, onlineDevices) },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Banner & Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Ikhtisar Operasi Layar Retail
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Pemantauan status display player, pustaka playlist, dan audit aktivitas gRPC secara real-time.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={loadData}
            className="btn btn-secondary"
            title="Segarkan data langsung dari backend gRPC"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan Data</span>
          </button>
          <Link href="/displays/create" className="btn btn-primary">
            <Tv size={16} />
            <span>Tambah Layar Baru</span>
          </Link>
        </div>
      </div>

      {/* DKA RADIUS Style Diagnostics / Smart Insight Banner */}
      <InsightCard insights={insights} />

      {/* KPI Cards Grid */}
      <DashboardStats
        totalDevices={totalDevices}
        onlineDevices={onlineDevices}
        totalLayouts={layouts.length}
        totalPlaylists={playlists.length}
        totalMediaItems={mediaItems.length}
      />

      {/* Activity Timeline Chart (RADIUS Graph) */}
      <TimelineChart
        title="Aktivitas Heartbeat & Penayangan Layar (24 Jam)"
        description="Visualisasi beban lalu lintas event telemetri gRPC dari seluruh Android display player"
        data={timelineData}
      />

      {/* Bottom Section: Fleet Status Table & Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Displays Fleet List Table */}
        <DashboardDeviceList devices={devices} loading={loading} />

        {/* Quick Operations & gRPC Service Overview */}
        <DashboardServiceStatus />
      </div>
    </div>
  );
}
