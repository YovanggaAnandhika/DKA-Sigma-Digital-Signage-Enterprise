'use client';

import React from 'react';
import { Save } from 'lucide-react';
import { Playlist } from '@/lib/services';

interface PlaylistInfoFormProps {
  formData: { name: string; description: string; isShuffle: boolean };
  setFormData: (data: any) => void;
  handleSubmitInfo: (e: React.FormEvent) => void;
  saving: boolean;
  playlist: Playlist;
  totalDuration: number;
}

export default function PlaylistInfoForm({
  formData,
  setFormData,
  handleSubmitInfo,
  saving,
  playlist,
  totalDuration
}: PlaylistInfoFormProps) {
  return (
    <div className="card-elevated" style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '16px' }}>
        Pengaturan Dasar
      </h2>
      <form onSubmit={handleSubmitInfo} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Daftar Putar <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Deskripsi Singkat
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="form-textarea"
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', backgroundColor: 'var(--bg-surface-elevated)', padding: '10px 12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            <input
              type="checkbox"
              id="is_shuffle"
              checked={formData.isShuffle}
              onChange={(e) => setFormData({ ...formData, isShuffle: e.target.checked })}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            <label htmlFor="is_shuffle" style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)', cursor: 'pointer' }}>
              Putar secara acak (Shuffle mode)
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-start', marginTop: '8px' }}>
            <button type="submit" disabled={saving} className="btn btn-secondary" style={{ width: 'auto' }}>
              <Save size={14} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Nama & Mode'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Stats Summary */}
      <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Item Media:</span>
          <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{playlist.itemsList?.length || 0} media</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
          <span style={{ color: 'var(--text-muted)' }}>Total Durasi 1 Putaran:</span>
          <span style={{ fontWeight: 700, color: 'var(--accent-amber)' }}>{totalDuration} detik</span>
        </div>
      </div>
    </div>
  );
}
