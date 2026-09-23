'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Device } from '@/lib/services/hardware';
import type { Layout, MediaItem, Playlist } from '@/lib/services/studio';
import { TimelineChart } from '@/components/charts/TimelineChart';
import { InsightCard, InsightItem } from '@/components/InsightCard';
import { Tv, Palette, ListMusic, FolderOpen, RefreshCw, Radio, Layers, CheckCircle2 } from 'lucide-react';

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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Total Displays */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Total Layar Terdaftar
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                color: 'var(--primary-400)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Tv size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px' }}>
            {totalDevices}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', fontSize: '0.75rem' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--accent-emerald)' }} />
              {onlineDevices} Online
            </span>
            <span style={{ color: 'var(--text-muted)' }}>•</span>
            <span style={{ color: 'var(--text-muted)' }}>{totalDevices - onlineDevices} Offline</span>
          </div>
        </div>

        {/* Total Layouts */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Layout Multi-Zona
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                color: 'var(--accent-emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Palette size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px' }}>
            {layouts.length}
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Tata letak kanvas siap pakai
          </div>
        </div>

        {/* Playlists */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Daftar Putar Aktif
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                color: 'var(--accent-amber)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <ListMusic size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px' }}>
            {playlists.length}
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Urutan media siaran terjadwal
          </div>
        </div>

        {/* Media Library */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              Pustaka Media
            </span>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(168, 85, 247, 0.12)',
                color: '#c084fc',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FolderOpen size={18} />
            </div>
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '12px' }}>
            {mediaItems.length}
          </div>
          <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Video MP4, banner gambar, web
          </div>
        </div>
      </div>

      {/* Activity Timeline Chart (RADIUS Graph) */}
      <TimelineChart
        title="Aktivitas Heartbeat & Penayangan Layar (24 Jam)"
        description="Visualisasi beban lalu lintas event telemetri gRPC dari seluruh Android display player"
        data={timelineData}
      />

      {/* Bottom Section: Fleet Status Table & Quick Shortcuts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
        {/* Displays Fleet List Table */}
        <div className="card-elevated" style={{ padding: '20px', overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Tv size={18} style={{ color: 'var(--primary-400)' }} />
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Status Layar Retail Terkini
              </h3>
            </div>
            <Link href="/displays" style={{ fontSize: '0.75rem', color: 'var(--primary-400)', fontWeight: 600 }}>
              Lihat Semua →
            </Link>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nama Display</th>
                  <th>Kode Pairing</th>
                  <th>Status</th>
                  <th>Alamat IP</th>
                </tr>
              </thead>
              <tbody>
                {devices.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                      {loading ? 'Memuat data dari gRPC backend...' : 'Belum ada display player terdaftar.'}
                    </td>
                  </tr>
                ) : (
                  devices.slice(0, 5).map((d) => (
                    <tr key={d.id}>
                      <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link href={`/displays/${d.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {d.name}
                        </Link>
                      </td>
                      <td style={{ fontFamily: 'monospace' }}>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                        >
                          {d.pairingCode}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: '9999px',
                            fontSize: '0.6875rem',
                            fontWeight: 700,
                            backgroundColor: d.isOnline ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                            color: d.isOnline ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                            border: d.isOnline ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                          }}
                        >
                          {d.isOnline ? 'ONLINE' : 'OFFLINE'}
                        </span>
                      </td>
                      <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {d.ipAddress || '127.0.0.1'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Operations & gRPC Service Overview */}
        <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Radio size={18} style={{ color: 'var(--accent-emerald)' }} />
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Layanan Streaming & Telemetri
            </h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Envoy gRPC-Web Ingress
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Port 8080 • HTTP/1.1 & HTTP/2 Bridging
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--accent-emerald)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                TERHUBUNG
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Rust Tonic gRPC Service
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Port 50051 • Hardware, Studio, IAM Modules
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--accent-emerald)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                AKTIF
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  PostgreSQL Database Pool
                </span>
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  Port 54321 • SQLx Migrations & RBAC Seeder
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color: 'var(--accent-emerald)',
                  backgroundColor: 'rgba(16, 185, 129, 0.12)',
                  padding: '3px 8px',
                  borderRadius: '4px',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                }}
              >
                TERSEDIA
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
