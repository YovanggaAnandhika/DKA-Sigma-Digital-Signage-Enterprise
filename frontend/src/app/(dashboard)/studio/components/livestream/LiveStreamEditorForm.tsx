'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import {
  ArrowLeft,
  Radio,
  Check,
  Save,
  RotateCcw,
} from 'lucide-react';
import { SingleSelect } from '@/components/ui/SingleSelect';
import { getMedia, getMediaDisplayUrl } from '@/lib/services/studio/media.service';
import StreamSettingsCard from './components/StreamSettingsCard';
import {
  LiveStreamEditorProvider,
  useLiveStreamEditor,
} from './context/LiveStreamEditorContext';

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

interface LiveStreamEditorFormProps {
  streamId?: string;
}

function LiveStreamEditorContent() {
  const {
    streamKey,
    serverHost,
    isEdit,
    draft,
    setName,
    setIsRelayActive,
    setAutoReconnect,
    setLowLatencyMode,
    setPosterImageUrl,
    isDirty,
    saving,
    saveSuccess,
    errorMessage,
    save,
    revert,
  } = useLiveStreamEditor();

  const [posterOptions, setPosterOptions] = useState<{ value: string; label: string }[]>([
    { value: '', label: 'Tanpa Poster' },
  ]);

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    save();
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
      {/* Header with Circular Back Button & Top-Right Action Controls */}
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

          <h1 style={{ fontSize: '1.15rem', fontWeight: 700, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
            {isEdit ? 'Ubah Live Stream' : 'Tambah Live Stream'}
          </h1>
        </div>

        {/* Action Buttons: Batal/Kembalikan & Simpan (Terkunci jika tersimpan) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {isDirty && (
            <button
              type="button"
              onClick={revert}
              className="btn btn-outline"
              style={{ padding: '8px 14px', gap: '6px', fontSize: '0.78rem' }}
              title="Batalkan perubahan yang belum disimpan"
            >
              <RotateCcw size={14} />
              <span>Kembalikan</span>
            </button>
          )}

          <Link href="/studio/components/livestream" className="btn btn-outline" style={{ padding: '8px 16px', fontSize: '0.78rem' }}>
            Kembali
          </Link>

          <button
            type="submit"
            disabled={saving || (!isDirty && isEdit && !saveSuccess)}
            className="btn btn-primary"
            style={{
              padding: '8px 18px',
              fontSize: '0.78rem',
              backgroundColor: saveSuccess
                ? 'var(--accent-emerald)'
                : !isDirty && isEdit
                  ? 'var(--bg-surface-elevated)'
                  : undefined,
              borderColor: saveSuccess
                ? 'var(--accent-emerald)'
                : !isDirty && isEdit
                  ? 'var(--border-strong)'
                  : undefined,
              color: !isDirty && isEdit && !saveSuccess ? 'var(--text-muted)' : undefined,
              cursor: !isDirty && isEdit && !saveSuccess ? 'default' : 'pointer',
              transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {saveSuccess ? (
              <>
                <Check size={16} style={{ color: '#ffffff' }} />
                <span style={{ color: '#ffffff', fontWeight: 700 }}>Tersimpan!</span>
              </>
            ) : saving ? (
              <span>Menyimpan...</span>
            ) : isDirty || !isEdit ? (
              <>
                <Save size={16} />
                <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Live Stream'}</span>
              </>
            ) : (
              <>
                <Check size={15} />
                <span>Tersimpan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {errorMessage && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: '8px',
            backgroundColor: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid var(--accent-red)',
            color: 'var(--accent-red)',
            fontSize: '0.8rem',
            fontWeight: 600,
          }}
        >
          {errorMessage}
        </div>
      )}

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
        {/* Left Configuration Panel (Draft State) */}
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
                value={draft.name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Kamera Area Lobby Utama"
                className="form-input"
                required
              />
            </div>

            {/* Status Live Streaming (Modern Radio Segmented Toggle) */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Status Siaran
              </label>
              <div
                role="radiogroup"
                aria-label="Status Live Streaming"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '3px',
                  borderRadius: 'var(--radius-full)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-subtle)',
                  width: 'fit-content',
                  gap: '4px',
                }}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={draft.isRelayActive}
                  onClick={() => setIsRelayActive(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    backgroundColor: draft.isRelayActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: draft.isRelayActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: draft.isRelayActive ? 600 : 500,
                    cursor: 'pointer',
                    boxShadow: draft.isRelayActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: draft.isRelayActive ? 'var(--accent-emerald)' : 'var(--text-muted)',
                    }}
                  />
                  <span>Siaran Aktif</span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!draft.isRelayActive}
                  onClick={() => setIsRelayActive(false)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '5px 14px',
                    borderRadius: 'var(--radius-full)',
                    border: 'none',
                    backgroundColor: !draft.isRelayActive ? 'var(--bg-surface-elevated)' : 'transparent',
                    color: !draft.isRelayActive ? 'var(--text-primary)' : 'var(--text-muted)',
                    fontSize: '0.78rem',
                    fontWeight: !draft.isRelayActive ? 600 : 500,
                    cursor: 'pointer',
                    boxShadow: !draft.isRelayActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      backgroundColor: !draft.isRelayActive ? 'var(--accent-rose)' : 'var(--text-muted)',
                    }}
                  />
                  <span>Nonaktif</span>
                </button>
              </div>
            </div>

            {/* Poster Media Picker */}
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Gambar Poster
              </label>
              <SingleSelect
                value={draft.posterImageUrl}
                onChange={(val) => setPosterImageUrl(String(val))}
                options={posterOptions}
                placeholder="Pilih dari Pustaka Media"
              />
            </div>

            {/* MediaMTX Ingest Source Panel (Updates draft in real time) */}
            <IngestSourcePanel />
          </div>

          {/* Bottom Streaming Switches */}
          <StreamSettingsCard
            lowLatencyMode={draft.lowLatencyMode}
            onToggleLowLatency={setLowLatencyMode}
            autoReconnect={draft.autoReconnect}
            onToggleAutoReconnect={setAutoReconnect}
          />
        </div>

        {/* Right Uncropped Live Video Monitor Stage (Real-time Preview from Draft Context) */}
        <StreamPreviewMonitor
          sourceType={draft.sourceType}
          sourceUrl={draft.sourceType === 'RTSP' ? draft.protocols.RTSP.sourceUrl : `/streams/${streamKey}/live.m3u8`}
          streamKey={streamKey}
          serverHost={serverHost}
          isRelayActive={draft.isRelayActive}
          lowLatencyMode={draft.lowLatencyMode}
          autoReconnect={draft.autoReconnect}
          isMuted={draft.isMuted}
          posterImageUrl={draft.posterImageUrl}
        />
      </div>
    </form>
  );
}

export default function LiveStreamEditorForm({ streamId }: LiveStreamEditorFormProps) {
  return (
    <LiveStreamEditorProvider streamId={streamId}>
      <LiveStreamEditorContent />
    </LiveStreamEditorProvider>
  );
}
