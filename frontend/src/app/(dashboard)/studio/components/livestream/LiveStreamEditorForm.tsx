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
import StreamSettingsCard from './components/StreamSettingsCard';

// Dynamically loaded source-specific configuration panels
const WhipSourceConfig = dynamic(() => import('./components/sources/WhipSourceConfig'), { ssr: false });
const RtmpSourceConfig = dynamic(() => import('./components/sources/RtmpSourceConfig'), { ssr: false });
const RtspSourceConfig = dynamic(() => import('./components/sources/RtspSourceConfig'), { ssr: false });
const HlsSourceConfig = dynamic(() => import('./components/sources/HlsSourceConfig'), { ssr: false });
const YoutubeSourceConfig = dynamic(() => import('./components/sources/YoutubeSourceConfig'), { ssr: false });

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

function generateSecureToken(length = 20): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = 'sig_tok_';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    for (let i = 0; i < length; i++) {
      result += chars[array[i] % chars.length];
    }
    return result;
  }
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
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
  const whipServerUrl = typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.host}/streams/${streamKey}/whip`
    : `http://${serverHost}/streams/${streamKey}/whip`;

  // Sync internal server relay endpoint when using WHIP / RTMP
  useEffect(() => {
    if (streamMode === 'SERVER_HOSTED_HLS') {
      if (sourceType === 'WHIP') {
        setSourceUrl(whipServerUrl);
      } else if (sourceType === 'RTMP') {
        setSourceUrl(fullRtmpIngestUrl);
      }
    }
  }, [streamMode, sourceType, fullRtmpIngestUrl, whipServerUrl]);

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
      streamMode === 'SERVER_HOSTED_HLS'
        ? sourceType === 'RTMP'
          ? fullRtmpIngestUrl
          : sourceType === 'WHIP'
          ? whipServerUrl
          : sourceUrl.trim()
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
          ingestUsername: requiresAuth && sourceType !== 'WHIP' ? ingestUsername.trim() : '',
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
          ingestUsername: requiresAuth && sourceType !== 'WHIP' ? ingestUsername.trim() : '',
          ingestPassword: requiresAuth ? ingestPassword.trim() : '',
        });
      }
      router.push('/studio/components/livestream');
    } finally {
      setSaving(false);
    }
  };

  const sourceTypeOptions = [
    ...(streamMode === 'SERVER_HOSTED_HLS'
      ? [
          { value: 'WHIP', label: 'WHIP (WebRTC Port 80)' },
          { value: 'RTMP', label: 'RTMP (Port 1935)' },
          { value: 'RTSP', label: 'RTSP' },
          { value: 'HLS', label: 'HLS' },
        ]
      : [
          { value: 'HLS', label: 'HLS' },
          { value: 'RTSP', label: 'RTSP' },
          { value: 'RTMP', label: 'RTMP' },
          { value: 'YOUTUBE_EMBED', label: 'YouTube Live' },
        ]),
  ];

  const handleSourceTypeChange = (newType: StreamSourceType) => {
    setSourceType(newType);
    if (streamMode === 'SERVER_HOSTED_HLS') {
      if (newType === 'WHIP') {
        setSourceUrl(whipServerUrl);
        if (requiresAuth && !ingestPassword) {
          setIngestPassword(generateSecureToken());
        }
      } else if (newType === 'RTMP') {
        setSourceUrl(fullRtmpIngestUrl);
      } else {
        // Reset URL when switching to RTSP or HLS so it doesn't leave an old internal HTTP endpoint
        setSourceUrl('');
      }
    } else {
      setSourceUrl('');
    }
  };

  const handleGenerateToken = () => {
    setIngestPassword(generateSecureToken());
  };

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

      {/* Unified Attached Studio Console Card (Left Configuration Form + Right Live Monitor) */}
      <div
        className="card-elevated"
        style={{
          flex: 1,
          display: 'grid',
          gridTemplateColumns: 'minmax(350px, 420px) 1fr',
          alignItems: 'stretch',
          overflow: 'hidden',
          padding: 0,
        }}
      >
        {/* Left Configuration Panel */}
        <div
          style={{
            padding: '18px 20px',
            borderRight: '1px solid var(--border-subtle)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            gap: '14px',
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
                  onClick={() => {
                    setStreamMode('EXTERNAL_EMBED');
                    if (sourceType === 'WHIP') setSourceType('HLS');
                    setSourceUrl('');
                  }}
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
                    if (sourceType === 'YOUTUBE_EMBED' || sourceType === 'HLS') {
                      setSourceType('WHIP');
                      setSourceUrl(whipServerUrl);
                    }
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
                  onChange={(val) => handleSourceTypeChange(val as StreamSourceType)}
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

            {/* Dynamic Modular Source Configuration Section */}
            {sourceType === 'WHIP' && (
              <WhipSourceConfig
                whipUrl={whipServerUrl}
                requiresAuth={requiresAuth}
                onToggleAuth={(val) => {
                  setRequiresAuth(val);
                  if (val && !ingestPassword) setIngestPassword(generateSecureToken());
                }}
                bearerToken={ingestPassword}
                onChangeBearerToken={setIngestPassword}
                onGenerateToken={handleGenerateToken}
              />
            )}

            {sourceType === 'RTMP' && (
              <RtmpSourceConfig
                serverUrl={rtmpServerUrl}
                streamKey={streamKey}
                requiresAuth={requiresAuth}
                onToggleAuth={setRequiresAuth}
                username={ingestUsername}
                onChangeUsername={setIngestUsername}
                password={ingestPassword}
                onChangePassword={setIngestPassword}
              />
            )}

            {sourceType === 'RTSP' && (
              <RtspSourceConfig
                sourceUrl={sourceUrl}
                onChangeSourceUrl={setSourceUrl}
                requiresAuth={requiresAuth}
                onToggleAuth={setRequiresAuth}
                username={ingestUsername}
                onChangeUsername={setIngestUsername}
                password={ingestPassword}
                onChangePassword={setIngestPassword}
              />
            )}

            {sourceType === 'HLS' && (
              <HlsSourceConfig
                sourceUrl={sourceUrl}
                onChangeSourceUrl={setSourceUrl}
              />
            )}

            {sourceType === 'YOUTUBE_EMBED' && (
              <YoutubeSourceConfig
                sourceUrl={sourceUrl}
                onChangeSourceUrl={setSourceUrl}
              />
            )}
          </div>

          {/* Bottom Streaming Switches */}
          <StreamSettingsCard
            lowLatencyMode={lowLatencyMode}
            onToggleLowLatency={setLowLatencyMode}
            autoReconnect={autoReconnect}
            onToggleAutoReconnect={setAutoReconnect}
          />
        </div>

        {/* Right Live Preview Monitor */}
        <div
          style={{
            padding: '18px 20px',
            backgroundColor: 'var(--bg-surface)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'stretch',
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
          />
        </div>
      </div>
    </form>
  );
}
