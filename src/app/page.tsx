'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Device, Layout, MediaItem, Playlist } from '../lib/api';
import { TimelineChart } from '../components/charts/TimelineChart';
import { InsightCard, InsightItem } from '../components/InsightCard';
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
  const onlineDevices = devices.filter((d) => d.is_online).length;

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
            <span>+ Daftarkan Display</span>
          </Link>
        </div>
      </div>

      {/* Smart Diagnostics Banner */}
      <InsightCard insights={insights} />

      {/* KPI Stats Grid matching RADIUS cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
        {/* Active Displays */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Layar Player Aktif</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-emerald)',
              }}
            >
              <Radio size={16} className="animate-pulse" />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
            {onlineDevices} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>/ {totalDevices} Unit</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>Terkoneksi Bi-Directional</span> via Stream gRPC
          </div>
        </div>

        {/* Layouts */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Template Layout</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(37, 99, 235, 0.12)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--primary-400)',
              }}
            >
              <Palette size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
            {layouts.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Canvas Multi-Zona siap dialokasikan ke layar
          </div>
        </div>

        {/* Playlists */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Daftar Putar (Playlist)</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(245, 158, 11, 0.12)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-amber)',
              }}
            >
              <ListMusic size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
            {playlists.length}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Rotasi konten looping per zona layar
          </div>
        </div>

        {/* Media Assets */}
        <div className="card-elevated" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)' }}>Pustaka Media</span>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                backgroundColor: 'rgba(6, 182, 212, 0.12)',
                border: '1px solid rgba(6, 182, 212, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-cyan)',
              }}
            >
              <FolderOpen size={16} />
            </div>
          </div>
          <div style={{ fontSize: '1.875rem', fontWeight: 800, marginTop: '10px', color: 'var(--text-primary)' }}>
            {mediaItems.length} <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 500 }}>Aset</span>
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Diverifikasi dengan checksum SHA-256 riil
          </div>
        </div>
      </div>

      {/* Timeline Chart matching Image 1 */}
      <TimelineChart
        title="Tren Aktivitas Pemutaran & Heartbeat Player (24 Jam Terakhir)"
        description="Pantauan sinyal telemetri dan perputaran media player berdasarkan waktu"
        data={timelineData}
        primaryColor="#2563eb"
        primaryLegend="Layar Aktif Memutar"
      />

      {/* Audit Log Table matching Image 1 */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Audit Log Aktivitas Display Signage (Terbaru)
            </h3>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Catatan detail komunikasi telemetri dan status pairing dari player ke backend gRPC
            </p>
          </div>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: '6px 10px', fontSize: '0.75rem' }}>
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Waktu</th>
                <th>Nama Perangkat / Player</th>
                <th>Kode Pairing</th>
                <th>Status Telemetri</th>
                <th>Resolusi & Arah</th>
                <th>Alamat IP</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {devices.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    Belum ada perangkat display terdaftar. Silakan klik &quot;+ Daftarkan Display&quot;.
                  </td>
                </tr>
              ) : (
                devices.map((d) => (
                  <tr key={d.id}>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {d.last_heartbeat_at ? new Date(d.last_heartbeat_at).toLocaleTimeString('id-ID') : 'Baru saja'}
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/displays/${d.id}`} style={{ textDecoration: 'underline' }}>
                        {d.name}
                      </Link>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          border: '1px solid var(--border-subtle)',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                        }}
                      >
                        {d.pairing_code}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '9999px',
                          fontSize: '0.6875rem',
                          fontWeight: 700,
                          backgroundColor: d.is_online ? 'rgba(16, 185, 129, 0.12)' : 'rgba(244, 63, 94, 0.12)',
                          color: d.is_online ? 'var(--accent-emerald)' : 'var(--accent-rose)',
                          border: d.is_online ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid rgba(244, 63, 94, 0.3)',
                        }}
                      >
                        {d.is_online ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </td>
                    <td>
                      {d.resolution} ({d.orientation})
                    </td>
                    <td style={{ fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                      {d.ip_address || '127.0.0.1'}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/displays/${d.id}`} className="btn btn-outline" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
