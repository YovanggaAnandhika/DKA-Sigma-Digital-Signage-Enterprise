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
  Copy,
} from 'lucide-react';
import { SingleSelect } from '@/components/ui/SingleSelect';
import HlsPlayer from '@/components/ui/HlsPlayer';
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

function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

interface LiveStreamEditorFormProps {
  streamId?: string;
}

export default function LiveStreamEditorForm({ streamId }: LiveStreamEditorFormProps) {
  const router = useRouter();
  const isEdit = Boolean(streamId);

  const [streamKey] = useState<string>(() => streamId || generateUUID());
  const [serverHost, setServerHost] = useState('sigma.dkaapis.test');
  const [copiedField, setCopiedField] = useState<'server' | 'key' | null>(null);

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
    if (typeof window !== 'undefined' && window.location.hostname) {
      setServerHost(window.location.hostname);
    }
  }, []);

  const rtmpServerUrl = `rtmp://${serverHost}:1935/live`;
  const fullRtmpIngestUrl = `${rtmpServerUrl}/${streamKey}`;

  useEffect(() => {
    if (streamMode === 'SERVER_HOSTED_HLS' && sourceType === 'RTMP') {
      setSourceUrl(fullRtmpIngestUrl);
    }
  }, [streamMode, sourceType, fullRtmpIngestUrl]);

  const handleCopy = (text: string, field: 'server' | 'key') => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

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
    const effectiveSourceUrl =
      streamMode === 'SERVER_HOSTED_HLS' && sourceType === 'RTMP'
        ? fullRtmpIngestUrl
        : sourceUrl.trim();

    if (!name.trim() || !effectiveSourceUrl) return;

    setSaving(true);
    try {
      if (isEdit && streamId) {
        await updateLiveStream({
          id: streamId,
          name: name.trim(),
          description: description.trim(),
          streamMode,
          sourceType,
          sourceUrl: effectiveSourceUrl,
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
          sourceUrl: effectiveSourceUrl,
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

  const sourceTypeOptions = [
    { value: 'HLS', label: 'HLS (.m3u8)', hint: 'HTTP Live Streaming' },
    { value: 'RTSP', label: 'RTSP (IP Cam / CCTV)', hint: 'Real-Time Streaming Protocol' },
    { value: 'RTMP', label: 'RTMP (OBS / Encoder)', hint: 'Real-Time Messaging Protocol' },
    ...(streamMode === 'EXTERNAL_EMBED'
      ? [{ value: 'YOUTUBE_EMBED', label: 'YouTube Live / Embed', hint: 'Streaming Publik YouTube' }]
      : []),
  ];

  const audioOptions = [
    { value: 'muted', label: 'Bisukan (Muted)', hint: 'Audio senyap saat pertama kali diputar' },
    { value: 'unmuted', label: 'Suara Aktif (Unmuted)', hint: 'Audio langsung bersuara di player' },
  ];

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
              <SingleSelect
                value={sourceType}
                onChange={(val) => setSourceType(val as StreamSourceType)}
                options={sourceTypeOptions}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Output Audio Default
              </label>
              <SingleSelect
                value={isMuted ? 'muted' : 'unmuted'}
                onChange={(val) => setIsMuted(val === 'muted')}
                options={audioOptions}
              />
            </div>
          </div>

          {streamMode === 'SERVER_HOSTED_HLS' && sourceType === 'RTMP' ? (
            /* OBS Ingest Parameters Card: No manual URL typing required! */
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                padding: '16px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Parameter Ingest OBS Studio
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Salin parameter berikut ke OBS Studio (Settings → Stream → Service: Custom).
                  </div>
                </div>
                <span className="badge badge-success" style={{ fontSize: '0.6875rem' }}>
                  Ingest Siap
                </span>
              </div>

              {/* Server URL Row */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Server RTMP
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={rtmpServerUrl}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem', backgroundColor: 'var(--bg-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(rtmpServerUrl, 'server')}
                    className="btn btn-outline"
                    style={{ padding: '0 12px', gap: '6px', whiteSpace: 'nowrap' }}
                    title="Salin URL Server"
                  >
                    {copiedField === 'server' ? (
                      <Check size={14} style={{ color: 'var(--accent-emerald)' }} />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedField === 'server' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>

              {/* Stream Key Row (Pure UUID) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Stream Key (Murni UUID)
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    readOnly
                    value={streamKey}
                    className="form-input"
                    style={{ fontFamily: 'monospace', fontSize: '0.8125rem', backgroundColor: 'var(--bg-primary)' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleCopy(streamKey, 'key')}
                    className="btn btn-outline"
                    style={{ padding: '0 12px', gap: '6px', whiteSpace: 'nowrap' }}
                    title="Salin Stream Key UUID"
                  >
                    {copiedField === 'key' ? (
                      <Check size={14} style={{ color: 'var(--accent-emerald)' }} />
                    ) : (
                      <Copy size={14} />
                    )}
                    <span>{copiedField === 'key' ? 'Tersalin' : 'Salin'}</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Standard URL Input for RTSP, HLS, or YouTube */
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
          )}

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
                /streams/{streamKey}/live.m3u8
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

          {/* Advanced Streaming Parameters */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '4px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '12px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Mode Low-Latency
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Buffer minimal untuk siaran langsung real-time
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={lowLatencyMode}
                onClick={() => setLowLatencyMode(!lowLatencyMode)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: '38px',
                  height: '22px',
                  padding: '2px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: lowLatencyMode ? 'var(--primary-500)' : 'var(--bg-surface)',
                  border: `1px solid ${lowLatencyMode ? 'var(--primary-500)' : 'var(--border-strong)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                    transform: lowLatencyMode ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 14px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                transition: 'border-color 0.2s ease, background-color 0.2s ease',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', paddingRight: '12px' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Auto-Reconnect Otomatis
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                  Menyambungkan ulang otomatis jika koneksi jaringan atau kamera terputus
                </span>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoReconnect}
                onClick={() => setAutoReconnect(!autoReconnect)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  width: '38px',
                  height: '22px',
                  padding: '2px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: autoReconnect ? 'var(--primary-500)' : 'var(--bg-surface)',
                  border: `1px solid ${autoReconnect ? 'var(--primary-500)' : 'var(--border-strong)'}`,
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: '#ffffff',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                    transform: autoReconnect ? 'translateX(16px)' : 'translateX(0)',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  }}
                />
              </button>
            </div>
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
            {sourceType === 'YOUTUBE_EMBED' ? (
              !sourceUrl.trim() ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  <Radio size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Masukkan URL Sumber Stream</div>
                  <div style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                    Pratinjau video akan tampil secara otomatis di sini.
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    position: 'relative',
                    width: '100%',
                    height: '100%',
                    overflow: 'hidden',
                    pointerEvents: 'none',
                  }}
                >
                  <iframe
                    src={toYoutubeEmbedUrl(sourceUrl, isMuted)}
                    title={name || 'YouTube Live Preview'}
                    style={{
                      position: 'absolute',
                      top: '-14%',
                      left: 0,
                      width: '100%',
                      height: '128%',
                      border: 'none',
                      pointerEvents: 'none',
                    }}
                    allow="autoplay; encrypted-media; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )
            ) : streamMode === 'SERVER_HOSTED_HLS' ? (
              <HlsPlayer
                src={`/streams/${streamKey}/live.m3u8`}
                poster={posterImageUrl.trim() || undefined}
                isMuted={isMuted}
                autoPlay
                fallbackTitle={
                  sourceType === 'RTMP'
                    ? 'Menunggu Feed Ingest dari OBS Studio'
                    : 'Menunggu Feed Live Stream Server'
                }
                fallbackDescription={
                  sourceType === 'RTMP'
                    ? `Mulai streaming dari OBS dengan Stream Key ${streamKey}. Segmen HLS akan langsung diputar otomatis di sini.`
                    : 'Server sedang menghubungkan dan mengonversi feed sumber ke HLS.'
                }
              />
            ) : sourceType === 'HLS' ? (
              !sourceUrl.trim() ? (
                <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                  <Radio size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>Masukkan URL Sumber HLS</div>
                </div>
              ) : (
                <HlsPlayer
                  src={sourceUrl.trim()}
                  poster={posterImageUrl.trim() || undefined}
                  isMuted={isMuted}
                  autoPlay
                />
              )
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

