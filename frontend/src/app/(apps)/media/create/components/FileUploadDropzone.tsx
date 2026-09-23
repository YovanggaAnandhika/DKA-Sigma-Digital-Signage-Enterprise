'use client';

import React from 'react';
import { UploadCloud } from 'lucide-react';

interface FileUploadDropzoneProps {
  fileInputRef: React.RefObject<HTMLInputElement>;
  handleFile: (file: File) => void;
  dragActive: boolean;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => void;
}

export default function FileUploadDropzone({
  fileInputRef,
  handleFile,
  dragActive,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}: FileUploadDropzoneProps) {
  return (
    <>
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
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: `2px dashed ${dragActive ? 'var(--primary-500)' : 'var(--border-subtle)'}`,
          backgroundColor: dragActive ? 'rgba(56, 189, 248, 0.05)' : 'var(--bg-surface-elevated)',
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
          <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)' }}>JPG, PNG, WebP</span>
          <span style={{ fontSize: '0.6875rem', padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-base)', color: 'var(--text-secondary)' }}>MP4, WebM Video</span>
        </div>
      </div>
    </>
  );
}
