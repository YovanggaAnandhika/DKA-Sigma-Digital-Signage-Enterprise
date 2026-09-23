'use client';

import React from 'react';
import Link from 'next/link';
import { Save } from 'lucide-react';

interface MediaMetadataFormProps {
  mode: 'upload' | 'url';
  formData: {
    name: string;
    publicUrl: string;
    mediaType: number;
    durationSeconds: number;
    width: number;
    height: number;
  };
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  uploadProgress: number | null;
  loading: boolean;
  selectedFile: File | null;
  onCancel: () => void;
}

export default function MediaMetadataForm({
  mode,
  formData,
  setFormData,
  uploadProgress,
  loading,
  selectedFile,
  onCancel,
}: MediaMetadataFormProps) {
  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
        Informasi & Properti Penayangan
      </h2>

      <div>
        <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
          Nama Aset Media <span style={{ color: 'var(--accent-rose)' }}>*</span>
        </label>
        <input
          type="text"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Contoh: Banner Promo Weekend Spesial"
          className="form-input"
        />
      </div>

      {mode === 'url' && (
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Tautan URL Konten / Web Stream <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="url"
            required
            value={formData.publicUrl}
            onChange={(e) => setFormData({ ...formData, publicUrl: e.target.value })}
            placeholder="https://example.com/stream/promo.mp4"
            className="form-input"
          />
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Tipe Media
          </label>
          <select
            value={formData.mediaType}
            onChange={(e) => setFormData({ ...formData, mediaType: Number(e.target.value) })}
            className="form-input"
          >
            <option value={1}>🖼️ Gambar Statis (JPG / PNG / WebP)</option>
            <option value={2}>🎬 Video Berulang (MP4 / WebM)</option>
            <option value={3}>🌐 Halaman Web URL</option>
          </select>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Durasi Tayang Default (Detik) <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="number"
            min={1}
            max={3600}
            required
            value={formData.durationSeconds}
            onChange={(e) => setFormData({ ...formData, durationSeconds: Number(e.target.value) })}
            className="form-input"
          />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Lebar Resolusi (Width Pixel)
          </label>
          <input
            type="number"
            value={formData.width}
            onChange={(e) => setFormData({ ...formData, width: Number(e.target.value) })}
            className="form-input"
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Tinggi Resolusi (Height Pixel)
          </label>
          <input
            type="number"
            value={formData.height}
            onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
            className="form-input"
          />
        </div>
      </div>

      {uploadProgress !== null && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '6px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary-600)' }}>
            <span>Mengunggah berkas via gRPC chunks ke backend...</span>
            <span>{uploadProgress}%</span>
          </div>
          <div style={{ width: '100%', height: '6px', backgroundColor: 'var(--bg-surface)', borderRadius: '3px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${uploadProgress}%`,
                height: '100%',
                backgroundColor: 'var(--primary-600)',
                transition: 'width 0.15s ease',
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
        <button type="button" onClick={onCancel} className="btn btn-secondary">
          Batal
        </button>
        <button
          type="submit"
          disabled={loading || (mode === 'upload' && !selectedFile && !formData.name)}
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '180px', justifyContent: 'center' }}
        >
          <Save size={16} />
          <span>
            {uploadProgress !== null
              ? `Mengunggah (${uploadProgress}%)...`
              : loading
              ? 'Menyimpan Media...'
              : 'Simpan Media ke Pustaka'}
          </span>
        </button>
      </div>
    </div>
  );
}
