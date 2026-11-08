'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Radio,
  Check,
  Server,
  Globe,
} from 'lucide-react';
import { SingleSelect } from '@/components/ui/SingleSelect';
import {
  createLiveStream,
  getLiveStream,
  updateLiveStream,
} from '@/lib/services';
import { getMedia, getMediaDisplayUrl } from '@/lib/services/studio/media.service';
import {
  StreamMode,
  StreamSourceType,
} from './types';
import ObsIngestCard from './components/ObsIngestCard';
import StreamSettingsCard from './components/StreamSettingsCard';

const StreamPreviewMonitor = dynamic(
  () => import('./components/StreamPreviewMonitor'),
  {
    ssr: false,
    loading: () => (
      <div
        className="card-elevated"
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          minHeight: '360px',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--text-muted)',
          fontSize: '0.8125rem',
        }}
      >
        Memuat monitor siaran...
      </div>
    ),
  }
);

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

  const [posterOptions, setPosterOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'Tanpa Poster' },
  ]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hostname) {
      setServerHost(window.location.hostname);
    }
  }, []);

  // Load image assets from Media Library for Poster selection
  useEffect(() => {
    getMedia({ limit: 200 })
      .then((res) => {
        const items = (res.data || [])
          .filter((m) => m.mediaType === 1 || m.mimeType?.startsWith('image/'))
          .map((m) => ({
            value: getMediaDisplayUrl(m),
            label: m.name || m.originalFilename || m.id,
          }));
        setPosterOptions([{ value: '', label: 'Tanpa Poster' }, ...items]);
      })
      .catch(() => {});
  }, []);

  const rtmpServerUrl = `rtmp://${serverHost}:1935/live`;
  const fullRtmpIngestUrl = `${rtmpServerUrl}/${streamKey}`;

  useEffect(() => {
    if (streamMode === 'SERVER_HOSTED_HLS' && sourceType === 'RTMP') {
      setSourceUrl(fullRtmpIngestUrl);
    }
  }, [streamMode, sourceType, fullRtmpIngestUrl]);

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
    { value: 'HLS', label: 'HLS' },
    { value: 'RTSP', label: 'RTSP' },
    { value: 'RTMP', label: 'RTMP' },
    ...(streamMode === 'EXTERNAL_EMBED'
      ? [{ value: 'YOUTUBE_EMBED', label: 'YouTube Live' }]
      : []),
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header with Circular Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          href="/studio/components/livestream"
          className="btn btn-outline"
          style={{
            width: '40px',
            minWidth: '40px',
            height: '40px',
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
              padding: '9px',
              borderRadius: '12px',
              backgroundColor: 'var(--bg-surface-elevated)',
              color: 'var(--accent-rose)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Radio size={20} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              {isEdit ? 'Ubah Live Stream' : 'Tambah Live Stream'}
            </h1>
            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px', margin: 0 }}>
              Konfigurasi sumber siaran langsung untuk zona layar signage.
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(350px, 440px) 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Left Compact Configuration Form */}
        <form
          onSubmit={handleSubmit}
          className="card-elevated"
          style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Nama Siaran
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Kamera Area Lobby Utama"
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
              Keterangan Singkat
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Contoh: Tayangan langsung area pelayanan"
              className="form-input"
            />
          </div>

          {/* Dual-Mode Selector */}
          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Mode Streaming
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setStreamMode('EXTERNAL_EMBED')}
                style={{
                  padding: '10px 12px',
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
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  <Globe size={14} style={{ color: 'var(--primary-500)' }} />
                  <span>Direct Embed</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  Koneksi langsung ke sumber
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStreamMode('SERVER_HOSTED_HLS');
                  if (sourceType === 'YOUTUBE_EMBED') setSourceType('RTMP');
                }}
                style={{
                  padding: '10px 12px',
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
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.78rem', color: 'var(--text-primary)' }}>
                  <Server size={14} style={{ color: 'var(--accent-emerald)' }} />
                  <span>Server HLS Relay</span>
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                  Relay terpusat dari server
                </span>
              </button>
            </div>
          </div>

          {/* Protocol & Poster Media Picker */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Protokol Sumber
              </label>
              <SingleSelect
                value={sourceType}
                onChange={(val) => setSourceType(val as StreamSourceType)}
                options={sourceTypeOptions}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Gambar Poster
              </label>
              <SingleSelect
                value={posterImageUrl}
                onChange={(val) => setPosterImageUrl(String(val))}
                options={posterOptions}
                placeholder="Pilih dari Pustaka Media"
              />
            </div>
          </div>

          {streamMode === 'SERVER_HOSTED_HLS' && sourceType === 'RTMP' ? (
            <ObsIngestCard serverUrl={rtmpServerUrl} streamKey={streamKey} />
          ) : (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                URL Sumber Stream
              </label>
              <input
                type="text"
                value={sourceUrl}
                onChange={(e) => setSourceUrl(e.target.value)}
                placeholder={placeholderByType[sourceType]}
                className="form-input"
                style={{ fontFamily: 'monospace', fontSize: '0.78rem' }}
                required
              />
            </div>
          )}

          {/* Compact Streaming Switches */}
          <StreamSettingsCard
            lowLatencyMode={lowLatencyMode}
            onToggleLowLatency={setLowLatencyMode}
            autoReconnect={autoReconnect}
            onToggleAutoReconnect={setAutoReconnect}
          />

          <div style={{ display: 'flex', gap: '10px', marginTop: '4px' }}>
            <Link href="/studio/components/livestream" className="btn btn-outline" style={{ flex: 1, justifyContent: 'center' }}>
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary" style={{ flex: 2, justifyContent: 'center' }}>
              <Check size={16} />
              <span>{saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Live Stream'}</span>
            </button>
          </div>
        </form>

        {/* Right Live Preview Monitor with Dedicated Frame & Volume/Mute Control */}
        <StreamPreviewMonitor
          name={name}
          streamMode={streamMode}
          sourceType={sourceType}
          sourceUrl={sourceUrl}
          streamKey={streamKey}
          isMuted={isMuted}
          onToggleMute={setIsMuted}
          posterImageUrl={posterImageUrl}
        />
      </div>
    </div>
  );
}
