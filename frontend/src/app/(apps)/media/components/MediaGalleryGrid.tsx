'use client';

import React from 'react';
import { Film, Image as ImageIcon, Globe } from 'lucide-react';
import { MediaItem } from '@/lib/services';
import { getMediaDisplayUrl } from '@/lib/services/studio/media.service';

interface MediaGalleryGridProps {
  mediaItems: MediaItem[];
  loading: boolean;
  selectedMedia: MediaItem | null;
  setSelectedMedia: (item: MediaItem) => void;
}

export default function MediaGalleryGrid({
  mediaItems,
  loading,
  selectedMedia,
  setSelectedMedia,
}: MediaGalleryGridProps) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
      {mediaItems.length === 0 ? (
        <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '60px', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '12px', border: '1px dashed var(--border-subtle)' }}>
          {loading ? 'Memuat aset media dari backend gRPC...' : 'Belum ada aset media tersimpan.'}
        </div>
      ) : (
        mediaItems.map((m) => {
          const isSelected = selectedMedia?.id === m.id;
          return (
            <div
              key={m.id}
              onClick={() => setSelectedMedia(m)}
              className="card-elevated"
              style={{
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
                border: isSelected ? '2px solid var(--primary-500)' : '2px solid transparent',
                transform: isSelected ? 'translateY(-2px)' : 'none',
                boxShadow: isSelected ? '0 10px 15px -3px rgba(14, 165, 233, 0.2)' : undefined,
              }}
            >
              {/* Thumbnail Area */}
              <div style={{ height: '140px', backgroundColor: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {(() => {
                  const displayUrl = getMediaDisplayUrl(m);
                  return m.mediaType === 2 && displayUrl ? (
                    <video
                      src={displayUrl}
                      autoPlay
                      muted
                      loop
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : m.mediaType === 2 ? (
                    <Film size={32} color="var(--accent-cyan)" />
                  ) : m.mediaType === 3 ? (
                    <Globe size={32} color="var(--accent-amber)" />
                  ) : displayUrl ? (
                    <img
                      src={displayUrl}
                      alt={m.name}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                  ) : (
                    <ImageIcon size={32} color="var(--accent-emerald)" />
                  );
                })()}
                
                {/* Badge Tipe */}
                <div style={{ position: 'absolute', top: '8px', left: '8px', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '4px 8px', borderRadius: '4px', display: 'flex', alignItems: 'center', gap: '4px', color: '#fff', fontSize: '0.6875rem', fontWeight: 600 }}>
                  {m.mediaType === 2 ? <Film size={12} color="#22d3ee" /> : m.mediaType === 3 ? <Globe size={12} color="#fbbf24" /> : <ImageIcon size={12} color="#34d399" />}
                  {m.mediaType === 2 ? 'Video' : m.mediaType === 3 ? 'Web' : 'Gambar'}
                </div>
                
                {/* Badge Durasi (Video Only) */}
                {m.mediaType === 2 && m.durationSeconds > 0 && (
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.7)', padding: '2px 6px', borderRadius: '4px', color: '#fff', fontSize: '0.6875rem', fontFamily: 'monospace' }}>
                    {m.durationSeconds}s
                  </div>
                )}
              </div>
              
              {/* Info Area */}
              <div style={{ padding: '12px' }}>
                <h3 style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)', margin: '0 0 4px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {m.name}
                </h3>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{(m.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
                  <span>{m.width}×{m.height}</span>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
