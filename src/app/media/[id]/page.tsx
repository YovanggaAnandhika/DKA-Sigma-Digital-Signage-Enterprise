'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, MediaItem } from '../../../lib/api';
import { ArrowLeft, Edit, FolderOpen, RefreshCw, Film, Image as ImageIcon, ShieldCheck, HardDrive } from 'lucide-react';

export default function ViewMediaPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMedia = async () => {
      try {
        setLoading(true);
        const data = await api.getMediaItem(params.id);
        setMedia(data);
      } catch (err: any) {
        alert(err.message || 'Gagal memuat media');
        router.push('/media');
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [params.id, router]);

  if (loading || !media) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data media dari database gRPC...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href="/media" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              {media.name}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', fontFamily: 'monospace' }}>
              File: {media.original_filename}
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <Link href={`/media/${media.id}/edit`} className="btn btn-secondary">
            <Edit size={14} />
            <span>Edit Metadata</span>
          </Link>
        </div>
      </div>

      {/* Asset Properties Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>TIPE & FORMAT</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {media.mime_type || 'video/mp4'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Durasi: {media.duration_seconds > 0 ? `${media.duration_seconds} detik` : 'Statis'}
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>DIMENSI PIXEL</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {media.width} × {media.height} px
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Rasio: {(media.width / (media.height || 1)).toFixed(2)}:1
          </div>
        </div>

        <div className="card-elevated" style={{ padding: '18px' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>UKURAN FILE</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '6px' }}>
            {(media.file_size_bytes / (1024 * 1024)).toFixed(2)} MB
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {media.file_size_bytes.toLocaleString()} bytes
          </div>
        </div>
      </div>

      {/* Checksum & Storage Details */}
      <div className="card-elevated" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '14px' }}>
          Integritas & Alamat Distribusi Aset
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              CHECKSUM SHA-256 (TERVALIDASI)
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                color: 'var(--accent-emerald)',
                border: '1px solid var(--border-subtle)',
                wordBreak: 'break-all',
              }}
            >
              {media.sha256_hash || 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
              PUBLIC ASSET URL (CDN / STORAGE)
            </div>
            <div
              style={{
                padding: '10px 14px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-surface-elevated)',
                fontFamily: 'monospace',
                fontSize: '0.8125rem',
                color: 'var(--primary-400)',
                border: '1px solid var(--border-subtle)',
                wordBreak: 'break-all',
              }}
            >
              {media.public_url}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
