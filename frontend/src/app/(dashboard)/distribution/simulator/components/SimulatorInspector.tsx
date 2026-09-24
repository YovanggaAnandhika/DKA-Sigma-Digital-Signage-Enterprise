'use client';

import React from 'react';
import { Layers, Radio } from 'lucide-react';
import { Layout, Playlist } from '@/lib/services';

interface SimulatorInspectorProps {
  layouts: Layout[];
  playlists: Playlist[];
}

export default function SimulatorInspector({
  layouts,
  playlists,
}: SimulatorInspectorProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
      <div className="card-elevated" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Layers size={16} style={{ color: 'var(--primary-400)' }} />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Layout Database Aktif (Tonic gRPC)
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {layouts.length > 0 ? (
            <>
              Terdeteksi <strong style={{ color: 'var(--text-primary)' }}>{layouts.length} layout terdaftar</strong> di database PostgreSQL.
            </>
          ) : (
            'Belum ada layout custom, simulator menggunakan default 3-zone split layout.'
          )}
        </p>
      </div>

      <div className="card-elevated" style={{ padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Radio size={16} style={{ color: 'var(--accent-emerald)' }} />
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Sinkronisasi Playlist Database
          </h3>
        </div>
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
          {playlists.length > 0 ? (
            <>
              Terhubung dengan <strong style={{ color: 'var(--text-primary)' }}>{playlists.length} playlist aktif</strong> dari Postgres.
            </>
          ) : (
            'Menggunakan loop rotasi visual DKASigma Retail Demo.'
          )}
        </p>
      </div>
    </div>
  );
}
