'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import { ArrowLeft, UploadCloud, Globe } from 'lucide-react';
import FileUploadDropzone from './components/FileUploadDropzone';
import MediaPreviewCard from './components/MediaPreviewCard';
import MediaMetadataForm from './components/MediaMetadataForm';

export default function CreateMediaPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [mode, setMode] = useState<'upload' | 'url'>('upload');
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // File state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileSha256, setFileSha256] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // Form data state
  const [formData, setFormData] = useState({
    name: '',
    originalFilename: '',
    publicUrl: '',
    mediaType: 1, // 1: Image, 2: Video, 3: Web
    mimeType: 'image/jpeg',
    fileSizeBytes: 0,
    width: 1920,
    height: 1080,
    durationSeconds: 10,
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
      originalFilename: file.name,
      mediaType: mediaType,
      mimeType: file.type || (isVideo ? 'video/mp4' : 'image/jpeg'),
      fileSizeBytes: file.size,
      publicUrl: objectUrl, // Used for local display & player preview
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
          durationSeconds: Math.round(video.duration) || 10,
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
          durationSeconds: 10,
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
      originalFilename: '',
      publicUrl: '',
      fileSizeBytes: 0,
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
      
      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      const fallbackHash = Array.from(new TextEncoder().encode(formData.name + Date.now()))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .padEnd(64, '0')
        .substring(0, 64);

      let savedPublicUrl = formData.publicUrl;
      let savedFilename = formData.originalFilename || `${formData.name.toLowerCase().replace(/\s+/g, '_')}.${formData.mediaType === 2 ? 'mp4' : 'jpg'}`;
      let finalSha256 = fileSha256 || fallbackHash;
      let finalFileSize = formData.fileSizeBytes || selectedFile?.size || 0;
      let finalFilePath = `/storage/studio/media/${savedFilename}`;

      // Upload file directly to backend Rust via gRPC in binary chunks
      if (mode === 'upload' && selectedFile) {
        const uploadResult = await api.uploadFileViaGrpc(
          selectedFile, 
          (percent) => {
            setUploadProgress(percent);
          },
          abortControllerRef.current.signal
        );

        savedPublicUrl = uploadResult.publicUrl; // /api/assets/{filename}
        finalSha256 = uploadResult.sha256Hash;
        finalFileSize = uploadResult.fileSizeBytes;
        finalFilePath = uploadResult.filePath;
      }

      const res = await api.createMedia({
        name: formData.name,
        originalFilename: savedFilename,
        filePath: finalFilePath,
        publicUrl: savedPublicUrl,
        fileSizeBytes: finalFileSize,
        mimeType: formData.mimeType,
        sha256Hash: finalSha256,
        mediaType: Number(formData.mediaType),
        width: Number(formData.width),
        height: Number(formData.height),
        durationSeconds: Number(formData.durationSeconds),
      });

      alert('Media berhasil diunggah via gRPC chunks dan disimpan ke backend!');
      if (res && res.id) {
        router.push(`/studio/media/${res.id}`);
      } else {
        router.push('/media');
      }
    } catch (err: any) {
      if (err.message?.includes('dibatalkan')) {
        alert('Upload dibatalkan.');
      } else {
        alert(err.message || 'Gagal menyimpan media');
      }
    } finally {
      setLoading(false);
      setUploadProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancel = () => {
    if (loading && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    router.push('/media');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
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
            backgroundColor: mode === 'upload' ? 'var(--bg-base)' : 'transparent',
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
            backgroundColor: mode === 'url' ? 'var(--bg-base)' : 'transparent',
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
            {!selectedFile && !previewUrl ? (
              <FileUploadDropzone
                fileInputRef={fileInputRef}
                handleFile={handleFile}
                dragActive={dragActive}
                handleDragOver={handleDragOver}
                handleDragLeave={handleDragLeave}
                handleDrop={handleDrop}
              />
            ) : (
              <MediaPreviewCard
                previewUrl={previewUrl}
                formData={formData}
                fileSha256={fileSha256}
                handleClearFile={handleClearFile}
              />
            )}
          </div>
        )}

        {/* Form Metadata Fields */}
        <MediaMetadataForm
          mode={mode}
          formData={formData}
          setFormData={setFormData}
          uploadProgress={uploadProgress}
          loading={loading}
          selectedFile={selectedFile}
          onCancel={handleCancel}
        />
      </form>
    </div>
  );
}
