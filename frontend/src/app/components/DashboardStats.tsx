'use client';

import React from 'react';
import { Tv, Palette, ListMusic, FolderOpen } from 'lucide-react';

interface DashboardStatsProps {
  totalDevices: number;
  onlineDevices: number;
  totalLayouts: number;
  totalPlaylists: number;
  totalMediaItems: number;
}

export default function DashboardStats({
  totalDevices,
  onlineDevices,
  totalLayouts,
  totalPlaylists,
  totalMediaItems,
}: DashboardStatsProps) {
  return (
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
          {totalLayouts}
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
          {totalPlaylists}
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
          {totalMediaItems}
        </div>
        <div style={{ marginTop: '6px', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
          Video MP4, banner gambar, web
        </div>
      </div>
    </div>
  );
}
