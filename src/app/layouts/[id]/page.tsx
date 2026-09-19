'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Layout } from '../../../lib/api';
import { ArrowLeft, Edit, Palette, RefreshCw, Layers } from 'lucide-react';

export default function ViewLayoutPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const data = await api.getLayout(params.id);
        setLayout(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat layout');
        router.push('/layouts');
      } finally {
        setLoading(false);
      }
    };
    fetchLayout();
  }, [params.id, router]);

  if (loading || !layout) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data layout dari gRPC backend...</span>
      </div>
    );
  }

  const scale = 540 / layout.canvas_width;
  const previewHeight = layout.canvas_height * scale;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/layouts" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {layout.name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Resolusi: {layout.canvas_width} × {layout.canvas_height} px ({layout.orientation}) &bull; {layout.zones?.length || 0} Zona Kotak
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/layouts/${layout.id}/edit`} className="btn btn-primary">
            <Edit size={14} />
            <span>Buka Canvas Designer</span>
          </Link>
        </div>
      </div>

      {/* Interactive Visual Canvas Preview */}
      <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px', alignSelf: 'flex-start' }}>
          Visual Canvas Geometry Preview
        </h3>

        <div
          style={{
            width: '540px',
            height: `${previewHeight}px`,
            backgroundColor: '#000000',
            border: '2px solid var(--border-subtle)',
            borderRadius: '8px',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
          }}
        >
          {layout.zones?.map((z, idx) => {
            const zColors = ['#2563eb', '#06b6d4', '#10b981', '#f59e0b', '#ec4899'];
            const color = zColors[idx % zColors.length];

            return (
              <div
                key={z.id}
                style={{
                  position: 'absolute',
                  left: `${z.x * scale}px`,
                  top: `${z.y * scale}px`,
                  width: `${z.width * scale}px`,
                  height: `${z.height * scale}px`,
                  backgroundColor: `${color}22`,
                  border: `2px solid ${color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ffffff', textAlign: 'center' }}>
                  {z.name}
                </div>
                <div style={{ fontSize: '0.625rem', color: color, marginTop: '2px', fontWeight: 600 }}>
                  {z.width} × {z.height} px
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Zones List Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Daftar Zona Kotak Layar
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Zona</th>
                <th>Posisi (X, Y)</th>
                <th>Ukuran (W × H)</th>
                <th>Z-Index Layer</th>
                <th>Playlist Dialokasikan</th>
              </tr>
            </thead>
            <tbody>
              {(!layout.zones || layout.zones.length === 0) ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Belum ada zona ditambahkan pada template layout ini.
                  </td>
                </tr>
              ) : (
                layout.zones.map((z) => (
                  <tr key={z.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{z.name}</td>
                    <td style={{ fontFamily: 'monospace' }}>
                      ({z.x}, {z.y}) px
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {z.width} × {z.height} px
                    </td>
                    <td>Layer #{z.z_index}</td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: 'var(--bg-surface-elevated)',
                          fontSize: '0.75rem',
                          color: 'var(--primary-400)',
                          border: '1px solid var(--border-subtle)',
                        }}
                      >
                        {z.playlist_name || 'Rotasi Default'}
                      </span>
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
