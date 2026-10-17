'use client';

import React, { useState, useEffect } from 'react';
import { Search, X, Check, Volume2, Music, FolderOpen, Play, Pause } from 'lucide-react';
import { api, MediaItem } from '@/lib/services';

interface QueueAudioPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAudio: (audio: {
    mediaItemId?: string;
    fileUrl: string;
    name: string;
  }) => void;
}

export default function QueueAudioPickerModal({ isOpen, onClose, onSelectAudio }: QueueAudioPickerModalProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);
  const [audioEl, setAudioEl] = useState<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      if (audioEl) {
        audioEl.pause();
        setAudioEl(null);
      }
      setPreviewingId(null);
      return;
    }

    const fetchMedia = async () => {
      try {
        setLoading(true);
        const res = await api.getMedia({ limit: 100 });
        // Include audio items (or files with audio extensions / mime types)
        const audiosOnly = (res.data || []).filter(
          (m: MediaItem) =>
            m.mediaType === 3 || // AUDIO enum
            String(m.mediaType) === 'AUDIO' ||
            m.mimeType?.startsWith('audio/') ||
            /\.(mp3|wav|ogg|m4a|aac)$/i.test(m.originalFilename || '')
        );
        setMediaList(audiosOnly);
      } catch (err) {
        console.error('Failed to load media for audio picker:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMedia();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTogglePreview = (m: MediaItem) => {
    if (previewingId === m.id) {
      audioEl?.pause();
      setPreviewingId(null);
      return;
    }

    if (audioEl) {
      audioEl.pause();
    }

    const newAudio = new Audio(m.publicUrl || m.filePath || '');
    newAudio.play().catch(() => {});
    newAudio.onended = () => setPreviewingId(null);
    setAudioEl(newAudio);
    setPreviewingId(m.id);
  };

  const handleConfirm = () => {
    if (!selectedMedia) return;
    if (audioEl) audioEl.pause();
    onSelectAudio({
      mediaItemId: selectedMedia.id,
      fileUrl: selectedMedia.publicUrl || selectedMedia.filePath || '',
      name: selectedMedia.name || selectedMedia.originalFilename,
    });
    onClose();
  };

  const filtered = mediaList.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.originalFilename.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="card-elevated"
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          backgroundColor: 'var(--bg-surface-elevated)',
          border: '1px solid var(--border-subtle)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Music size={20} color="var(--primary-500)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
              Pilih Audio Panggilan dari Pustaka Media
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-subtle)' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari file audio / jingle MP3..."
              className="form-input"
              style={{ paddingLeft: '36px' }}
            />
          </div>
        </div>

        {/* Media List */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              Memuat file audio...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
              <Volume2 size={36} style={{ margin: '0 auto 8px auto', opacity: 0.3 }} />
              <p style={{ margin: 0, fontSize: '0.875rem' }}>Tidak ada file audio / MP3 di Pustaka Media.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem' }}>Unggah file audio format MP3 atau WAV di menu Pustaka Media.</p>
            </div>
          ) : (
            filtered.map((m) => {
              const isSelected = selectedMedia?.id === m.id;
              const isPlaying = previewingId === m.id;
              return (
                <div
                  key={m.id}
                  onClick={() => setSelectedMedia(m)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    backgroundColor: isSelected ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-surface)',
                    border: isSelected ? '1px solid var(--primary-500)' : '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTogglePreview(m);
                      }}
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: isPlaying ? 'var(--primary-600)' : 'var(--bg-secondary)',
                        color: isPlaying ? '#ffffff' : 'var(--text-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: 'none',
                        cursor: 'pointer',
                      }}
                      title={isPlaying ? 'Hentikan Preview' : 'Putar Audio'}
                    >
                      {isPlaying ? <Pause size={14} /> : <Play size={14} style={{ marginLeft: '2px' }} />}
                    </button>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                        {m.name || m.originalFilename}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {(m.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB &bull; {m.mimeType || 'audio/mp3'}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--primary-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Check size={12} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '10px', padding: '14px 20px', borderTop: '1px solid var(--border-subtle)' }}>
          <button type="button" onClick={onClose} className="btn btn-secondary">
            Batal
          </button>
          <button
            type="button"
            disabled={!selectedMedia}
            onClick={handleConfirm}
            className="btn btn-primary"
            style={{ opacity: selectedMedia ? 1 : 0.5, cursor: selectedMedia ? 'pointer' : 'not-allowed' }}
          >
            Gunakan Audio Ini
          </button>
        </div>
      </div>
    </div>
  );
}
