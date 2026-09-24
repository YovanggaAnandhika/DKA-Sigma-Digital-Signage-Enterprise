'use client';

import React from 'react';
import Link from 'next/link';
import { Film, Image as ImageIcon, Globe, Eye, Edit, Trash2 } from 'lucide-react';
import { MediaItem } from '@/lib/services';
import { getMediaDisplayUrl } from '@/lib/services/studio/media.service';

interface MediaDetailsSidebarProps {
  selectedMedia: MediaItem;
  setSelectedMedia: (item: MediaItem | null) => void;
  handleDelete: (id: string, name: string) => void;
}

export default function MediaDetailsSidebar({
  selectedMedia,
  setSelectedMedia,
  handleDelete,
}: MediaDetailsSidebarProps) {
  const getMediaTypeBadge = (type: number) => {
    if (type === 2) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-cyan)', fontWeight: 600, fontSize: '0.75rem' }}>
          <Film size={13} /> Video (MP4)
        </span>
      );
    }
    if (type === 3) {
      return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-amber)', fontWeight: 600, fontSize: '0.75rem' }}>
          <Globe size={13} /> Web Halaman
        </span>
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--accent-emerald)', fontWeight: 600, fontSize: '0.75rem' }}>
        <ImageIcon size={13} /> Gambar (Static)
      </span>
    );
  };

  return (
    <div className="card-elevated" style={{ width: '320px', flexShrink: 0, position: 'sticky', top: '24px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'var(--bg-surface-elevated)' }}>
        <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>Detail File</h3>
        <button onClick={() => setSelectedMedia(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} title="Tutup Panel">✕</button>
      </div>
      
      <div style={{ height: '180px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {(() => {
          const displayUrl = getMediaDisplayUrl(selectedMedia);
          return selectedMedia.mediaType === 2 && displayUrl ? (
            <video 
              ref={(el) => {
                if (el) {
                  el.defaultMuted = true;
                  el.muted = true;
                  el.play().catch(() => {});
                }
              }}
              src={displayUrl} 
              autoPlay 
              loop 
              muted 
              playsInline 
              controls 
              style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
            />
          ) : selectedMedia.mediaType === 2 ? (
            <Film size={48} color="var(--accent-cyan)" />
          ) : selectedMedia.mediaType === 3 ? (
            <Globe size={48} color="var(--accent-amber)" />
          ) : displayUrl ? (
            <img src={displayUrl} alt={selectedMedia.name} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          ) : (
            <ImageIcon size={48} color="var(--accent-emerald)" />
          );
        })()}
      </div>
      
      <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px 0', wordBreak: 'break-word' }}>{selectedMedia.name}</h4>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'monospace', wordBreak: 'break-all' }}>{selectedMedia.originalFilename}</div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Tipe Konten</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{getMediaTypeBadge(selectedMedia.mediaType)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Ukuran File</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(selectedMedia.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Dimensi</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace' }}>{selectedMedia.width} × {selectedMedia.height} px</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '6px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Durasi</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{selectedMedia.durationSeconds > 0 ? `${selectedMedia.durationSeconds} detik` : 'Statis'}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Checksum SHA-256</span>
            <span style={{ fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'monospace', wordBreak: 'break-all', fontSize: '0.6875rem' }}>
              {selectedMedia.sha256Hash || '-'}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
          <Link href={`/media/${selectedMedia.id}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
            <Eye size={16} /> Pratinjau Penuh
          </Link>
          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/media/${selectedMedia.id}/edit`} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>
              <Edit size={16} /> Edit
            </Link>
            <button onClick={() => { handleDelete(selectedMedia.id, selectedMedia.name); setSelectedMedia(null); }} className="btn btn-danger" style={{ flex: 1, justifyContent: 'center' }}>
              <Trash2 size={16} /> Hapus
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
