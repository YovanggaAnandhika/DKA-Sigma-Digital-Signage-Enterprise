'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Playlist, MediaItem } from '@/lib/api';
import { ArrowLeft, Edit, ListMusic, RefreshCw, Clock, Film, Image as ImageIcon } from 'lucide-react';

export default function ViewPlaylistPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylistAndMedia = async () => {
      try {
        setLoading(true);
        const [pData, mData] = await Promise.all([
          api.getPlaylist(params.id),
          api.getMedia({ limit: 100 }).catch(() => ({ data: [] })),
        ]);
        setPlaylist(pData);
        setMediaList(mData.data || []);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat playlist');
        router.push('/playlists');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylistAndMedia();
  }, [params.id, router]);

  if (loading || !playlist) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data playlist dari database gRPC...</span>
      </div>
    );
  }

  const totalDuration = playlist.items?.reduce((acc, i) => acc + i.duration_seconds, 0) || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/playlists" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {playlist.name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              {playlist.description || 'Tidak ada deskripsi'} &bull; {playlist.items?.length || 0} Item Media ({totalDuration} detik total)
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/playlists/${playlist.id}/edit`} className="btn btn-primary">
            <Edit size={14} />
            <span>Edit Susunan Item</span>
          </Link>
        </div>
      </div>

      {/* Items Sequence Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <h3 style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Urutan Rotasi Media (Playback Sequence)
          </h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>No</th>
                <th>Konten Media</th>
                <th>Durasi Tayang</th>
                <th>Transisi Layar</th>
                <th>Posisi Urutan</th>
              </tr>
            </thead>
            <tbody>
              {(!playlist.items || playlist.items.length === 0) ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                    Belum ada item media dalam playlist ini. Klik &quot;Edit Susunan Item&quot; untuk menambahkan.
                  </td>
                </tr>
              ) : (
                playlist.items.map((item, idx) => {
                  const matchedMedia = mediaList.find((m) => m.id === item.media_item_id);
                  const isVideo = matchedMedia?.media_type === 2;

                  return (
                    <tr key={item.id}>
                      <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '6px',
                              overflow: 'hidden',
                              backgroundColor: '#0f172a',
                              border: '1px solid var(--border-subtle)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {matchedMedia?.public_url && !isVideo ? (
                              <img
                                src={matchedMedia.public_url}
                                alt={matchedMedia.name}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                onError={(e) => {
                                  (e.target as HTMLElement).style.display = 'none';
                                }}
                              />
                            ) : isVideo ? (
                              <Film size={18} color="var(--accent-amber)" />
                            ) : (
                              <ImageIcon size={18} color="var(--primary-500)" />
                            )}
                          </div>
                          <div>
                            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                              {matchedMedia?.name || item.media_name || `Media ${item.media_item_id.substring(0, 8)}...`}
                            </div>
                            <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                              ID: {item.media_item_id.substring(0, 16)}...
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontWeight: 600 }}>
                          <Clock size={12} /> {item.duration_seconds} detik
                        </span>
                      </td>
                      <td style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.transition_type || 'Fade'}
                      </td>
                      <td>Index ke-{item.order_index}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
