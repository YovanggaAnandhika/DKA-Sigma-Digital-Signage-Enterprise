'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Radio,
  Check,
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

// Dynamically loaded MediaMTX Ingest Panel
const IngestSourcePanel = dynamic(() => import('./components/modes/ServerRelayModePanel'), { ssr: false });

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
  const streamMode: StreamMode = 'SERVER_HOSTED_HLS';
  const [sourceType, setSourceType] = useState<StreamSourceType>('WHIP');
  const [sourceUrl, setSourceUrl] = useState('');
  const [autoReconnect, setAutoReconnect] = useState(true);
  const [lowLatencyMode, setLowLatencyMode] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [posterImageUrl, setPosterImageUrl] = useState('');
  const isRelayActive = true;
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

  useEffect(() => {
    if (!streamId) return;
    getLiveStream(streamId)
      .then((item) => {
        setName(item.name);
        setDescription(item.description);
        setSourceType((item.sourceType as StreamSourceType) || 'WHIP');
        setSourceUrl(item.sourceUrl);
        setAutoReconnect(item.autoReconnect);
        setLowLatencyMode(item.lowLatencyMode);
        setIsMuted(item.isMuted);
        setPosterImageUrl(item.posterImageUrl);
        setRequiresAuth(item.requiresAuth ?? false);
        setIngestUsername(item.ingestUsername ?? '');
        setIngestPassword(item.ingestPassword ?? '');
      })
      .catch(() => router.push('/studio/components/livestream'));
  }, [streamId, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveSourceUrl = sourceUrl.trim();
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
          serverHlsEndpoint: `/streams/${streamId}/live.m3u8`,
          isRelayActive,
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
                Konfigurasi siaran langsung terpusat melalui MediaMTX engine.
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

            {/* Poster Media Picker */}
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

            {/* MediaMTX Ingest Source Panel */}
            <IngestSourcePanel
              sourceType={sourceType}
              onChangeSourceType={setSourceType}
              sourceUrl={sourceUrl}
              onChangeSourceUrl={setSourceUrl}
              requiresAuth={requiresAuth}
              onToggleAuth={setRequiresAuth}
              username={ingestUsername}
              onChangeUsername={setIngestUsername}
              password={ingestPassword}
              onChangePassword={setIngestPassword}
              streamKey={streamKey}
              serverHost={serverHost}
            />
          </div>

          {/* Bottom Streaming Switches */}
          <StreamSettingsCard
            lowLatencyMode={lowLatencyMode}
            onToggleLowLatency={setLowLatencyMode}
            autoReconnect={autoReconnect}
            onToggleAutoReconnect={setAutoReconnect}
          />
        </div>

        {/* Right Uncropped Live Video Monitor Stage */}
        <StreamPreviewMonitor
          sourceType={sourceType}
          sourceUrl={sourceUrl}
          streamKey={streamKey}
          serverHost={serverHost}
          isRelayActive={isRelayActive}
          lowLatencyMode={lowLatencyMode}
          autoReconnect={autoReconnect}
          isMuted={isMuted}
          posterImageUrl={posterImageUrl}
        />
      </div>
    </form>
  );
}
