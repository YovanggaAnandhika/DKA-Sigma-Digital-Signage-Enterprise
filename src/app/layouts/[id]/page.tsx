'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Layout, Playlist, MediaItem } from '../../../lib/api';
import { ArrowLeft, Edit, Palette, RefreshCw, Layers, Film, Image as ImageIcon } from 'lucide-react';

export default function ViewLayoutPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [layout, setLayout] = useState<Layout | null>(null);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLayout = async () => {
      try {
        setLoading(true);
        const [layoutData, playlistsRes, mediaRes] = await Promise.all([
          api.getLayout(params.id),
          api.getPlaylists({ limit: 100 }).catch(() => ({ data: [] })),
          api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        setLayout(layoutData);
        setPlaylists((playlistsRes as any).data || []);
        setMediaList((mediaRes as any).data || []);
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
            const hasBlocks = z.blocks && z.blocks.length > 0;
            const firstBlock = hasBlocks ? z.blocks[0] : null;
            const assignedPl = firstBlock ? playlists.find((p) => p.id === firstBlock.playlist_id) : null;
            const firstItem = assignedPl?.items?.[0];
            const zoneMedia = firstItem ? mediaList.find((m) => m.id === firstItem.media_item_id) : null;
            const isVideo = zoneMedia?.media_type === 2;

            return (
              <div
                key={z.id}
                style={{
                  position: 'absolute',
                  left: `${(Number(z.x) || 0) * scale}px`,
                  top: `${(Number(z.y) || 0) * scale}px`,
                  width: `${(Number(z.width) || 200) * scale}px`,
                  height: `${(Number(z.height) || 200) * scale}px`,
                  backgroundColor: `${color}22`,
                  border: `2px solid ${color}`,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '6px',
                  boxSizing: 'border-box',
                  overflow: 'hidden',
                  zIndex: z.z_index || 1,
                }}
              >
                {zoneMedia?.public_url && (
                  isVideo ? (
                    <video
                      src={zoneMedia.public_url}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                      }}
                    />
                  ) : (
                    <img
                      src={zoneMedia.public_url}
                      alt={zoneMedia.name}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        zIndex: 0,
                      }}
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  )
                )}

                {/* Non-intrusive metadata rendering */}
                {zoneMedia?.public_url ? (
                  <>
                    {/* Top-left corner tag */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '6px',
                        left: '6px',
                        zIndex: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        backgroundColor: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(4px)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.5)',
                        maxWidth: '85%',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.625rem',
                          fontWeight: 700,
                          color: '#ffffff',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {z.name}
                      </span>
                      {hasBlocks && (
                        <span
                          style={{
                            fontSize: '0.5625rem',
                            color: '#fef08a',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                            borderLeft: '1px solid rgba(255,255,255,0.2)',
                            paddingLeft: '4px',
                          }}
                        >
                          🎬 {assignedPl?.name || 'Playlist'}
                        </span>
                      )}
                    </div>

                    {/* Bottom-right dimension tag */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '6px',
                        right: '6px',
                        zIndex: 2,
                        backgroundColor: 'rgba(15, 23, 42, 0.8)',
                        backdropFilter: 'blur(4px)',
                        padding: '2px 5px',
                        borderRadius: '4px',
                        fontSize: '0.5625rem',
                        fontWeight: 600,
                        color: '#93c5fd',
                        border: '1px solid rgba(56, 189, 248, 0.35)',
                      }}
                    >
                      {Number(z.width) || 200} × {Number(z.height) || 200} px
                    </div>
                  </>
                ) : (
                  /* Fallback centered label for empty zones without media */
                  <div
                    style={{
                      position: 'relative',
                      zIndex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#ffffff',
                        textAlign: 'center',
                        textShadow: '0 1px 3px rgba(0,0,0,0.9)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: '100%',
                      }}
                    >
                      {z.name}
                    </div>
                    <div
                      style={{
                        fontSize: '0.625rem',
                        color: color,
                        marginTop: '2px',
                        fontWeight: 600,
                      }}
                    >
                      {Number(z.width) || 200} × {Number(z.height) || 200} px
                    </div>
                  </div>
                )}
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
                      ({Number(z.x) || 0}, {Number(z.y) || 0}) px
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>
                      {Number(z.width) || 200} × {Number(z.height) || 200} px
                    </td>
                    <td>Layer #{z.z_index}</td>
                    <td>
                      {(() => {
                        const hasBlocks = z.blocks && z.blocks.length > 0;
                        const firstBlock = hasBlocks ? z.blocks[0] : null;
                        const assignedPl = firstBlock ? playlists.find((p) => p.id === firstBlock.playlist_id) : null;
                        const firstItem = assignedPl?.items?.[0];
                        const m = firstItem ? mediaList.find((item) => item.id === firstItem.media_item_id) : null;
                        const isVideo = m?.media_type === 2;

                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            {m?.public_url && (
                              <div
                                style={{
                                  width: '28px',
                                  height: '22px',
                                  borderRadius: '4px',
                                  overflow: 'hidden',
                                  backgroundColor: '#0f172a',
                                  flexShrink: 0,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  border: '1px solid var(--border-subtle)',
                                }}
                              >
                                {!isVideo ? (
                                  <img src={m.public_url} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                ) : (
                                  <Film size={12} color="var(--accent-amber)" />
                                )}
                              </div>
                            )}
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: '6px',
                                backgroundColor: 'var(--bg-surface-elevated)',
                                fontSize: '0.75rem',
                                color: hasBlocks ? 'var(--primary-400)' : 'var(--text-muted)',
                                border: '1px solid var(--border-subtle)',
                              }}
                            >
                              {assignedPl?.name || 'Rotasi Default'}
                            </span>
                          </div>
                        );
                      })()}
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
