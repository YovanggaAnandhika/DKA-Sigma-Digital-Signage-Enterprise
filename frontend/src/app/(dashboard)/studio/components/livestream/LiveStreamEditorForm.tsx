'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Radio,
  Check,
  Server,
  Globe,
  Tv,
  Zap,
  RefreshCw,
} from 'lucide-react';
import {
  createLiveStream,
  getLiveStream,
  updateLiveStream,
} from '@/lib/services';
import {
  StreamMode,
  StreamSourceType,
  toYoutubeEmbedUrl,
} from './types';

interface LiveStreamEditorFormProps {
  streamId?: string;
}

export default function LiveStreamEditorForm({ streamId }: LiveStreamEditorFormProps) {
  const router = useRouter();
  const isEdit = Boolean(streamId);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [streamMode, setStreamMode] = useState<StreamMode>('EXTERNAL_EMBED');
  const [sourceType, setSourceType] = useState<StreamSourceType>('HLS');
  const [sourceUrl, setSourceUrl] = useState('');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [lowLatencyMode, setLowLatencyMode] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [posterImageUrl, setPosterImageUrl] = useState('');
  const [isRelayActive, setIsRelayActive] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!streamId) return;
    getLiveStream(streamId)
      .then((item) => {
        setName(item.name);
        setDescription(item.description);
        setStreamMode(item.streamMode);
        setSourceType(item.sourceType);
        setSourceUrl(item.sourceUrl);
        setAutoReconnect(item.autoReconnect);
        setLowLatencyMode(item.lowLatencyMode);
        setIsMuted(item.isMuted);
        setPosterImageUrl(item.posterImageUrl);
        setIsRelayActive(item.isRelayActive);
      })
      .catch(() => router.push('/studio/components/livestream'));
  }, [streamId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !sourceUrl.trim()) return;

    setSaving(true);
    try {
      if (isEdit && streamId) {
        await updateLiveStream({
          id: streamId,
          name: name.trim(),
          description: description.trim(),
          streamMode,
          sourceType,
          sourceUrl: sourceUrl.trim(),
          serverHlsEndpoint:
            streamMode === 'SERVER_HOSTED_HLS' ? `/streams/${streamId}/live.m3u8` : '',
          isRelayActive: streamMode === 'SERVER_HOSTED_HLS' ? isRelayActive : false,
          autoReconnect,
          lowLatencyMode,
          isMuted,
          posterImageUrl: posterImageUrl.trim(),
        });
      } else {
        await createLiveStream({
          name: name.trim(),
          description: description.trim(),
          streamMode,
          sourceType,
          sourceUrl: sourceUrl.trim(),
          autoReconnect,
          lowLatencyMode,
          isMuted,
          posterImageUrl: posterImageUrl.trim(),
        });
      }
      router.push('/studio/components/livestream');
    } finally {
      setSaving(false);
    }
  };

  const placeholderByType: Record<StreamSourceType, string> = {
    HLS: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    RTSP: 'rtsp://admin:pass@192.168.1.50:554/Streaming/Channels/101',
    RTMP: 'rtmp://live.server.local/app/stream_key',
    YOUTUBE_EMBED: 'https://www.youtube.com/watch?v=jfKfPfyJRdk',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header with Circular Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href="/studio/components/livestream"
          className="btn btn-outline"
          style={{
            width: '42px',
            minWidth: '42px',
            height: '42px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
            border: '1px solid var(--border-subtle)',
          }}
          aria-label="Kembali ke Daftar Live Stream"
          title="Kembali ke Daftar Live Stream"
        >
          <ArrowLeft size={18} />
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--accent-rose)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.375rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              {isEdit ? 'Ubah Konfigurasi Live Stream' : 'Tambah Siaran Langsung Baru'}
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Konfigurasikan sumber siaran langsung (Direct URL atau Server-Hosted HLS Relay) untuk zona layar signage.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(360px, 460px) 1fr', gap: '24px' }}>
        {/* Left Configuration Form */}
        <form
          onSubmit={handleSubmit}
          className="card-elevated"
          style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Siaran / Kamera
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kamera CCTV Area Kasir & Lobby"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Keterangan Singkat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Relay terpusat untuk 20 layar cabang"
              className="form-input"
            />
          </div>

          {/* Dual-Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Mode Arsitektur Streaming
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setStreamMode('EXTERNAL_EMBED')}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor:
                    streamMode === 'EXTERNAL_EMBED' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border:
                    streamMode === 'EXTERNAL_EMBED'
                      ? '2px solid var(--primary-500)'
                      : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  <Globe size={15} style={{ color: 'var(--primary-500)' }} />
                  <span>Direct Embed</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Player terhubung langsung ke sumber stream.
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStreamMode('SERVER_HOSTED_HLS');
                  if (sourceType === 'YOUTUBE_EMBED') setSourceType('RTSP');
                }}
                style={{
                  padding: '12px',
                  borderRadius: '10px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  backgroundColor:
                    streamMode === 'SERVER_HOSTED_HLS' ? 'var(--bg-surface-elevated)' : 'var(--bg-surface)',
                  border:
                    streamMode === 'SERVER_HOSTED_HLS'
                      ? '2px solid var(--accent-emerald)'
                      : '1px solid var(--border-subtle)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                  <Server size={15} style={{ color: 'var(--accent-emerald)' }} />
                  <span>Server HLS Relay</span>
                </div>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  1 koneksi ingest di-relay ke ratusan layar.
                </span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Protokol Sumber
              </label>
              <select
                value={sourceType}
                onChange={(e) => setSourceType(e.target.value as StreamSourceType)}
                className="form-input"
              >
                <option value="HLS">HLS (.m3u8)</option>
                <option value="RTSP">RTSP (IP Cam / CCTV)</option>
                <option value="RTMP">RTMP (OBS / Encoder)</option>
                {streamMode === 'EXTERNAL_EMBED' && (
                  <option value="YOUTUBE_EMBED">YouTube Live / Embed</option>
                )}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Output Audio Default
              </label>
              <select
                value={isMuted ? 'muted' : 'unmuted'}
                onChange={(e) => setIsMuted(e.target.value === 'muted')}
                className="form-input"
              >
                <option value="muted">Bisukan (Muted)</option>
                <option value="unmuted">Suara Aktif (Unmuted)</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              URL Sumber Stream ({sourceType})
            </label>
            <input
              type="text"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder={placeholderByType[sourceType]}
              className="form-input"
              style={{ fontFamily: 'monospace', fontSize: '0.8125rem' }}
              required
            />
          </div>

          {streamMode === 'SERVER_HOSTED_HLS' && (
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-secondary)',
              }}
            >
              <div style={{ fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '4px' }}>
                Endpoint Distribusi HLS Origin Otomatis:
              </div>
              <code style={{ color: 'var(--text-primary)' }}>
                /streams/{streamId || '<auto-uuid>'}/live.m3u8
              </code>
            </div>
          )}

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              URL Gambar Poster Fallback (Opsional)
            </label>
            <input
              type="text"
              value={posterImageUrl}
              onChange={(e) => setPosterImageUrl(e.target.value)}
              placeholder="https://.../placeholder-offline.jpg"
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={lowLatencyMode}
                onChange={(e) => setLowLatencyMode(e.target.checked)}
              />
              <Zap size={14} style={{ color: 'var(--accent-amber)' }} />
              <span>Aktifkan Mode Low-Latency (Buffer minimal untuk siaran real-time)</span>
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
              <input
                type="checkbox"
                checked={autoReconnect}
                onChange={(e) => setAutoReconnect(e.target.checked)}
              />
              <RefreshCw size={14} style={{ color: 'var(--primary-500)' }} />
              <span>Auto-Reconnect otomatis jika jaringan atau kamera terputus sementara</span>
            </label>
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
            <Link href="/studio/components/livestream" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
              <Check size={16} />
              <span>{saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Live Stream'}</span>
            </button>
          </div>
        </form>

        {/* Right Live Preview Monitor */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Monitor Pratinjau Siaran
              </h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
                Simulasi tampilan zona Live Stream pada kanvas layar signage.
              </p>
            </div>
            <span className="badge badge-neutral">{sourceType}</span>
          </div>

          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              borderRadius: '12px',
              overflow: 'hidden',
              backgroundColor: 'var(--bg-primary)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
            }}
          >
            {!sourceUrl.trim() ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                <Radio size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Masukkan URL Sumber Stream</div>
                <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Pratinjau video akan tampil secara otomatis di sini.
                </div>
              </div>
            ) : sourceType === 'YOUTUBE_EMBED' ? (
              <iframe
                src={toYoutubeEmbedUrl(sourceUrl, isMuted)}
                title={name || 'YouTube Live Preview'}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            ) : sourceType === 'HLS' ? (
              <video
                src={sourceUrl.trim()}
                poster={posterImageUrl.trim() || undefined}
                controls
                autoPlay
                muted={isMuted}
                playsInline
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ textAlign: 'center', padding: '32px', maxWidth: '460px' }}>
                <Tv size={40} style={{ color: 'var(--primary-500)', marginBottom: '10px' }} />
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Feed {sourceType} Siap Dirender di Player Android
                </div>
                <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.5 }}>
                  Alamat <code>{sourceUrl}</code> akan diputar secara native oleh Media3 ExoPlayer (RTSP/HLS) pada
                  perangkat Android TV dengan proteksi Auto-Reconnect.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

