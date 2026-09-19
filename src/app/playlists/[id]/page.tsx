'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, Playlist } from '../../../lib/api';
import { ArrowLeft, Edit, ListMusic, RefreshCw, Clock, Film } from 'lucide-react';

export default function ViewPlaylistPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlaylist = async () => {
      try {
        setLoading(true);
        const data = await api.getPlaylist(params.id);
        setPlaylist(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat playlist');
        router.push('/playlists');
      } finally {
        setLoading(false);
      }
    };
    fetchPlaylist();
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
                <th style={{ width: '60px' }}>No</th>
                <th>ID Media Terhubung</th>
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
                playlist.items.map((item, idx) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 700, color: 'var(--text-muted)' }}>#{idx + 1}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {item.media_name || item.media_id}
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
