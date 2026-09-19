'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { ArrowLeft, Save, FolderOpen, Upload } from 'lucide-react';

export default function CreateMediaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    original_filename: '',
    public_url: '',
    media_type: 1, // 1: Image, 2: Video, 3: Web
    width: 1920,
    height: 1080,
    duration_seconds: 10,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      // Generate SHA256 simulation hash based on name
      const sha256_hash = Array.from(new TextEncoder().encode(formData.name + Date.now()))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .padEnd(64, '0')
        .substring(0, 64);

      await api.createMedia({
        name: formData.name,
        original_filename: formData.original_filename || `${formData.name.toLowerCase().replace(/\s+/g, '_')}.mp4`,
        file_path: `/storage/media/${formData.name.toLowerCase().replace(/\s+/g, '_')}.mp4`,
        public_url: formData.public_url || `http://localhost/assets/${formData.name.toLowerCase().replace(/\s+/g, '_')}.mp4`,
        file_size_bytes: 14200000,
        mime_type: formData.media_type === 2 ? 'video/mp4' : 'image/jpeg',
        sha256_hash,
        media_type: Number(formData.media_type),
        width: Number(formData.width),
        height: Number(formData.height),
        duration_seconds: Number(formData.duration_seconds),
      });

      router.push('/media');
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan media');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/media" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftarkan / Unggah Media Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Simpan data aset media visual untuk didistribusikan ke player melalui manifest.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', maxWidth: '640px' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Aset Media <span style={{ color: 'var(--accent-rose)' }}>*</span>
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Contoh: Video Promosi Musim Panas 2026"
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Tipe Media
              </label>
              <select
                value={formData.media_type}
                onChange={(e) => setFormData({ ...formData, media_type: Number(e.target.value) })}
                className="form-select"
              >
                <option value={1}>Gambar Statis (JPG / PNG)</option>
                <option value={2}>Video (MP4 / WebM)</option>
                <option value={3}>Halaman Web URL</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Durasi Tayang (Detik)
              </label>
              <input
                type="number"
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Lebar Pixel (Width)
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
                Tinggi Pixel (Height)
              </label>
              <input
                type="number"
                value={formData.height}
                onChange={(e) => setFormData({ ...formData, height: Number(e.target.value) })}
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Public Asset URL
            </label>
            <input
              type="text"
              value={formData.public_url}
              onChange={(e) => setFormData({ ...formData, public_url: e.target.value })}
              placeholder="http://localhost:80/assets/promo.mp4"
              className="form-input"
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/media" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={loading} className="btn btn-primary">
              <Save size={14} />
              <span>{loading ? 'Menyimpan...' : 'Simpan Media ke Database'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
