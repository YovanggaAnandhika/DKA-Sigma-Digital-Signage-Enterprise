'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../lib/api';
import { ArrowLeft, Save, Upload, UploadCloud, Film, Image as ImageIcon, Globe, CheckCircle2, X, Sparkles, FileText } from 'lucide-react';

export default function CreateMediaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSha256, setFileSha256] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    original_filename: '',
    public_url: '',
    media_type: 1, // 1: Image, 2: Video, 3: Web
    mime_type: 'image/jpeg',
    file_size_bytes: 0,
    width: 1920,
    height: 1080,
    duration_seconds: 10,
  });

  const handleFile = async (file: File) => {
    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Derive readable name from file
    const cleanName = file.name
      .replace(/\.[^/.]+$/, '')
      .replace(/[_-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());

    const isVideo = file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.webm');
    const mediaType = isVideo ? 2 : 1;

    setFormData((prev) => ({
      ...prev,
      name: cleanName,
      original_filename: file.name,
      media_type: mediaType,
      mime_type: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      file_size_bytes: file.size,
      public_url: objectUrl, // Used for local display & player preview
    }));

    // Detect pixel dimensions and duration
    if (isVideo) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        setFormData((prev) => ({
          ...prev,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          duration_seconds: Math.round(video.duration) || 10,
        }));
      };
      video.src = objectUrl;
    } else {
      const img = new Image();
      img.onload = () => {
        setFormData((prev) => ({
          ...prev,
          width: img.naturalWidth || 1920,
          height: img.naturalHeight || 1080,
          duration_seconds: 10,
        }));
      };
      img.src = objectUrl;
    }

    // Calculate real SHA-256 hash
    try {
      const arrayBuffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
      setFileSha256(hashHex);
    } catch {
      setFileSha256('hash-' + Date.now());
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleClearFile = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setFileSha256('');
    setFormData((prev) => ({
      ...prev,
      name: '',
      original_filename: '',
      public_url: '',
      file_size_bytes: 0,
    }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'upload' && !selectedFile && !previewUrl) {
      alert('Silakan pilih berkas gambar atau video untuk diunggah.');
      return;
    }

    try {
      setLoading(true);
      setUploadProgress(0);

      const fallbackHash = Array.from(new TextEncoder().encode(formData.name + Date.now()))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .padEnd(64, '0')
        .substring(0, 64);

      let savedPublicUrl = formData.public_url;
      let savedFilename = formData.original_filename || `${formData.name.toLowerCase().replace(/\s+/g, '_')}.${formData.media_type === 2 ? 'mp4' : 'jpg'}`;
      let finalSha256 = fileSha256 || fallbackHash;
      let finalFileSize = formData.file_size_bytes || selectedFile?.size || 0;
      let finalFilePath = `/storage/media/${savedFilename}`;

      // Upload file directly to backend Rust via gRPC in binary chunks
      if (mode === 'upload' && selectedFile) {
        const uploadResult = await api.uploadFileViaGrpc(selectedFile, (percent) => {
          setUploadProgress(percent);
        });

        savedPublicUrl = uploadResult.public_url; // /api/assets/{filename}
        finalSha256 = uploadResult.sha256_hash;
        finalFileSize = uploadResult.file_size_bytes;
        finalFilePath = uploadResult.file_path;
      }

      const res = await api.createMedia({
        name: formData.name,
        original_filename: savedFilename,
        file_path: finalFilePath,
        public_url: savedPublicUrl,
        file_size_bytes: finalFileSize,
        mime_type: formData.mime_type,
        sha256_hash: finalSha256,
        media_type: Number(formData.media_type),
        width: Number(formData.width),
        height: Number(formData.height),
        duration_seconds: Number(formData.duration_seconds),
      });

      alert('Media berhasil diunggah via gRPC chunks dan disimpan ke backend!');
      if (res && res.id) {
        router.push(`/media/${res.id}`);
      } else {
        router.push('/media');
      }
    } catch (err: any) {
      alert(err.message || 'Gagal menyimpan media');
    } finally {
      setLoading(false);
      setUploadProgress(null);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '800px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/media" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Unggah / Daftarkan Media Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Unggah file gambar atau video promosi untuk dimasukkan ke dalam daftar putar dan layout display.
          </p>
        </div>
      </div>

      {/* Mode Switch Tabs */}
      <div style={{ display: 'flex', gap: '8px', backgroundColor: 'var(--bg-surface-elevated)', padding: '4px', borderRadius: '8px', width: 'fit-content', border: '1px solid var(--border-subtle)' }}>
        <button
          type="button"
          onClick={() => setMode('upload')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: mode === 'upload' ? '#fff' : 'transparent',
            color: mode === 'upload' ? 'var(--primary-600)' : 'var(--text-secondary)',
            boxShadow: mode === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <UploadCloud size={16} />
          <span>Unggah Berkas (Upload File)</span>
        </button>
        <button
          type="button"
          onClick={() => setMode('url')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            fontSize: '0.8125rem',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: mode === 'url' ? '#fff' : 'transparent',
            color: mode === 'url' ? 'var(--primary-600)' : 'var(--text-secondary)',
            boxShadow: mode === 'url' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <Globe size={16} />
          <span>Tautan URL / Halaman Web</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Upload Dropzone Mode */}
        {mode === 'upload' && (
          <div className="card-elevated" style={{ padding: '24px' }}>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFile(e.target.files[0]);
                }
              }}
            />

            {!selectedFile && !previewUrl ? (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: `2px dashed ${dragActive ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
                  backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.05)' : '#fafafa',
                  borderRadius: '12px',
                  padding: '48px 24px',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '12px'
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(56, 189, 248, 0.1)',
                    color: 'var(--primary-600)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '4px'
                  }}
                >
                  <UploadCloud size={32} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                    Tarik & Letakkan gambar atau video di sini
                  </h3>
                  <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px', margin: 0 }}>
                    atau <span style={{ color: 'var(--primary-600)', fontWeight: 600, textDecoration: 'underline' }}>klik untuk memilih berkas</span> dari komputer Anda
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)' }}>JPG, PNG, WebP</span>
                  <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#f1f5f9', color: 'var(--text-secondary)' }}>MP4, WebM Video</span>
                </div>
              </div>
            ) : (
              /* Visual Preview Card */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--primary-600)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <CheckCircle2 size={16} color="#10b981" /> Berkas Terpilih & Terdeteksi
                  </span>
                  <button
                    type="button"
                    onClick={handleClearFile}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '4px 10px', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '4px' }}
                  >
                    <X size={14} /> Ganti Berkas
                  </button>
                </div>

                <div style={{ display: 'flex', gap: '20px', backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-subtle)', alignItems: 'center' }}>
                  {/* Media Preview Box */}
                  <div
                    style={{
                      width: '160px',
                      height: '100px',
                      borderRadius: '6px',
                      overflow: 'hidden',
                      backgroundColor: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
                    }}
                  >
                    {formData.media_type === 2 ? (
                      <video src={previewUrl!} style={{ width: '100%', height: '100%', objectFit: 'contain' }} muted />
                    ) : (
                      <img src={previewUrl!} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                    )}
                  </div>

                  {/* Detected File Details */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflow: 'hidden' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {formData.original_filename}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                      <span>Ukuran: <strong>{formatBytes(formData.file_size_bytes)}</strong></span>
                      <span>Resolusi: <strong>{formData.width} × {formData.height} px</strong></span>
                      <span>Format: <strong>{formData.mime_type}</strong></span>
                      {formData.media_type === 2 && (
                        <span>Durasi: <strong style={{ color: 'var(--accent-amber)' }}>{formData.duration_seconds} detik</strong></span>
                      )}
                    </div>
                    {fileSha256 && (
                      <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace', marginTop: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        SHA-256: {fileSha256}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Metadata Fields */}
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
                value={formData.public_url}
                onChange={(e) => setFormData({ ...formData, public_url: e.target.value })}
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
                value={formData.media_type}
                onChange={(e) => setFormData({ ...formData, media_type: Number(e.target.value) })}
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
                value={formData.duration_seconds}
                onChange={(e) => setFormData({ ...formData, duration_seconds: Number(e.target.value) })}
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
              <div style={{ width: '100%', height: '6px', backgroundColor: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
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
            <Link href="/media" className="btn btn-secondary">
              Batal
            </Link>
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
      </form>
    </div>
  );
}
