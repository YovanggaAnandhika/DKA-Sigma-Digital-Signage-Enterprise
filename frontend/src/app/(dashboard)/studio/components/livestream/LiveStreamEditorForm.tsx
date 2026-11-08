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
  Shield,
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
        style={{
          padding: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          minHeight: '340px',
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
  const [requiresAuth, setRequiresAuth] = useState(false);
  const [ingestUsername, setIngestUsername] = useState('');
  const [ingestPassword, setIngestPassword] = useState('');
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
        setRequiresAuth(item.requiresAuth ?? false);
        setIngestUsername(item.ingestUsername ?? '');
        setIngestPassword(item.ingestPassword ?? '');
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
          requiresAuth,
          ingestUsername: requiresAuth ? ingestUsername.trim() : '',
          ingestPassword: requiresAuth ? ingestPassword.trim() : '',
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
          requiresAuth,
          ingestUsername: requiresAuth ? ingestUsername.trim() : '',
          ingestPassword: requiresAuth ? ingestPassword.trim() : '',
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

  // Bottom bar placed neatly underneath the video monitor
  const bottomUrlOrIngestBar =
    streamMode === 'SERVER_HOSTED_HLS' && sourceType === 'RTMP' ? (
      <ObsIngestCard
        serverUrl={rtmpServerUrl}
        streamKey={streamKey}
        serverHost={serverHost}
      />
    ) : (
      <div
        style={{
          padding: '10px 12px',
          borderRadius: 'var(--radius-md)',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <label
          style={{
            display: 'block',
            fontSize: '0.68rem',
            fontWeight: 700,
            color: 'var(--text-secondary)',
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            marginBottom: '4px',
          }}
        >
          URL Sumber Stream
        </label>
        <input
          type="text"
          value={sourceUrl}
          onChange={(e) => setSourceUrl(e.target.value)}
          placeholder={placeholderByType[sourceType]}
          className="form-input"
          style={{ fontFamily: 'monospace', fontSize: '0.76rem', padding: '6px 10px' }}
          required
        />
      </div>
    );

  return (
    <form
      onSubmit={handleSubmit}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        minHeight: 'calc(100vh - 172px)',
      }}
    >
      {/* Header with Circular Back Button & Top-Right Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link
            href="/studio/components/livestream"
            className="btn btn-outline"
            style={{
              width: '38px',
              minWidth: '38px',
              height: '38px',
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
            <ArrowLeft size={17} />
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                padding: '8px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-elevated)',
                color: 'var(--accent-rose)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Radio size={18} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
                {isEdit ? 'Ubah Live Stream' : 'Tambah Live Stream'}
              </h1>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1px', margin: 0 }}>
                Konfigurasi sumber siaran langsung untuk zona layar signage.
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Link href="/studio/components/livestream" className="btn btn-outline" style={{ padding: '8px 16px' }}>
            Batal
          </Link>
          <button type="submit" disabled={saving} className="btn btn-primary" style={{ padding: '8px 18px' }}>
            <Check size={16} />
            <span>{saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Simpan Live Stream'}</span>
          </button>
        </div>
      </div>

      {/* Unified Attached Studio Console Card (Left Form + Right Monitor & Bottom URL/Ingest Bar) */}
      <div
        className="card-elevated"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(340px, 400px) 1fr',
          alignItems: 'stretch',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Left Attached Configuration Panel */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '5px' }}>
                Mode Streaming
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setStreamMode('EXTERNAL_EMBED')}
                  style={{
                    padding: '9px 11px',
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
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                    <Globe size={13} style={{ color: 'var(--primary-500)' }} />
                    <span>Direct Embed</span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
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
                    padding: '9px 11px',
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
                    gap: '2px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '0.76rem', color: 'var(--text-primary)' }}>
                    <Server size={13} style={{ color: 'var(--accent-emerald)' }} />
                    <span>Server Relay</span>
                  </div>
                  <span style={{ fontSize: '0.66rem', color: 'var(--text-muted)', lineHeight: 1.25 }}>
                    Relay terpusat dari server
                  </span>
                </button>
              </div>
            </div>

            {/* Protocol & Poster Media Picker */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Protokol Sumber
                </label>
                <SingleSelect
                  value={sourceType}
                  onChange={(val) => setSourceType(val as StreamSourceType)}
                  options={sourceTypeOptions}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
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

            {/* Ingest Authentication (Username & Password for OBS / RTSP) */}
            <div
              style={{
                padding: '9px 11px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={13} style={{ color: requiresAuth ? 'var(--accent-emerald)' : 'var(--text-muted)' }} />
                  <span style={{ fontSize: '0.76rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                    Autentikasi Pengirim (Password)
                  </span>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={requiresAuth}
                  onClick={() => setRequiresAuth(!requiresAuth)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    width: '36px',
                    height: '20px',
                    padding: '2px',
                    borderRadius: 'var(--radius-full)',
                    backgroundColor: requiresAuth ? 'var(--accent-emerald)' : 'var(--bg-surface)',
                    border: `1px solid ${requiresAuth ? 'var(--accent-emerald)' : 'var(--border-strong)'}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    flexShrink: 0,
                  }}
                >
                  <span
                    style={{
                      width: '14px',
                      height: '14px',
                      borderRadius: '50%',
                      backgroundColor: '#ffffff',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.25)',
                      transform: requiresAuth ? 'translateX(16px)' : 'translateX(0)',
                      transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </button>
              </div>

              {requiresAuth && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '2px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Username Ingest
                    </label>
                    <input
                      type="text"
                      value={ingestUsername}
                      onChange={(e) => setIngestUsername(e.target.value)}
                      placeholder="Contoh: obs_user"
                      className="form-input"
                      style={{ fontSize: '0.74rem', padding: '5px 8px' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.67rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '3px' }}>
                      Password Ingest
                    </label>
                    <input
                      type="password"
                      value={ingestPassword}
                      onChange={(e) => setIngestPassword(e.target.value)}
                      placeholder="Password siaran"
                      className="form-input"
                      style={{ fontSize: '0.74rem', padding: '5px 8px' }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom Streaming Switches aligned with Right Ingest Bar */}
          <StreamSettingsCard
            lowLatencyMode={lowLatencyMode}
            onToggleLowLatency={setLowLatencyMode}
            autoReconnect={autoReconnect}
            onToggleAutoReconnect={setAutoReconnect}
          />
        </div>

        {/* Right Attached Live Preview Monitor + Bottom URL/Ingest Bar */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <StreamPreviewMonitor
            name={name}
            streamMode={streamMode}
            sourceType={sourceType}
            sourceUrl={sourceUrl}
            streamKey={streamKey}
            lowLatencyMode={lowLatencyMode}
            isMuted={isMuted}
            onToggleMute={setIsMuted}
            posterImageUrl={posterImageUrl}
            bottomSlot={bottomUrlOrIngestBar}
          />
        </div>
      </div>
    </form>
  );
}
