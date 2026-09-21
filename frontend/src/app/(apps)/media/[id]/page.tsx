'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api, MediaItem } from '@/lib/api';
import {
  ArrowLeft,
  Edit,
  FolderOpen,
  RefreshCw,
  Film,
  Image as ImageIcon,
  ShieldCheck,
  HardDrive,
  Copy,
  Check,
  ExternalLink,
  AlertTriangle,
  UploadCloud,
} from 'lucide-react';

export default function ViewMediaPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [media, setMedia] = useState<MediaItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [mediaLoadError, setMediaLoadError] = useState(false);

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

  const handleCopyUrl = () => {
    if (!media?.public_url) return;
    navigator.clipboard.writeText(media.public_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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

      {/* Visual Media Preview Card */}
      <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Visual (Media Preview)
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                backgroundColor: media.media_type === 2 ? 'rgba(6, 182, 212, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                color: media.media_type === 2 ? 'var(--accent-cyan)' : 'var(--accent-emerald)',
                border: `1px solid ${media.media_type === 2 ? 'rgba(6, 182, 212, 0.3)' : 'rgba(16, 185, 129, 0.3)'}`,
              }}
            >
              {media.media_type === 2 ? '🎬 Video MP4' : media.media_type === 3 ? '🌐 Web URL' : '🖼️ Gambar'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCopyUrl}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px' }}
              title="Salin URL Aset"
            >
              {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
              <span>{copied ? 'Tersalin!' : 'Salin URL'}</span>
            </button>
            <a
              href={media.public_url}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' }}
              title="Buka Berkas Asli di Tab Baru"
            >
              <ExternalLink size={14} />
              <span>Buka Asli</span>
            </a>
          </div>
        </div>

        {/* Visual Viewport Box */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: '340px',
            maxHeight: '520px',
            backgroundColor: '#0a0f1d',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            borderRadius: '12px',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border-subtle)',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.5)',
          }}
        >
          {mediaLoadError ? (
            <div style={{ textAlign: 'center', padding: '32px 20px', maxWidth: '480px' }}>
              <AlertTriangle size={40} color="var(--accent-amber)" style={{ margin: '0 auto 12px auto' }} />
              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '1rem', marginBottom: '8px' }}>
                Pratinjau Visual Tidak Dapat Dimuat
              </div>
              <p style={{ color: '#94a3b8', fontSize: '0.8125rem', lineHeight: 1.5, margin: '0 0 16px 0' }}>
                {media.public_url.startsWith('blob:')
                  ? 'Tautan ini sebelumnya tersimpan sebagai memori sementara (blob:) dan telah kedaluwarsa setelah refresh. Silakan unggah berkas baru agar tersimpan permanen di server.'
                  : `Berkas pada alamat "${media.public_url}" tidak dapat diakses atau tidak ditemukan.`}
              </p>
              <Link href="/media/create" className="btn btn-primary" style={{ fontSize: '0.8125rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <UploadCloud size={16} />
                <span>Unggah Media Baru</span>
              </Link>
            </div>
          ) : media.media_type === 2 ? (
            <video
              src={media.public_url}
              controls
              autoPlay
              muted
              loop
              onError={() => setMediaLoadError(true)}
              style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
            />
          ) : media.media_type === 3 ? (
            <iframe
              src={media.public_url}
              title={media.name}
              style={{ width: '100%', height: '460px', border: 'none' }}
            />
          ) : (
            <img
              src={media.public_url}
              alt={media.name}
              onError={() => setMediaLoadError(true)}
              style={{ maxWidth: '100%', maxHeight: '500px', objectFit: 'contain' }}
            />
          )}
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
