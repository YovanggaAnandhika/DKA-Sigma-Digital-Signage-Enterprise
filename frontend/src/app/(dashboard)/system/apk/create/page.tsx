'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Upload, FileCode, CheckCircle2, AlertTriangle, Smartphone, ShieldAlert } from 'lucide-react';
import { api, system } from '@/lib/services';
import { readApkMetadata } from '@/lib/core/apkMetadata';

export default function CreateApkReleasePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileSelectionId = useRef(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [readingApkMetadata, setReadingApkMetadata] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    versionName: '',
    versionCode: 0,
    minSupportedVersionCode: 1,
    isForceUpdate: false,
    releaseNotes: '',
  });

  const handleFile = async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.apk')) {
      alert('Format berkas tidak valid. Harap pilih berkas berekstensi .apk');
      return;
    }

    const selectionId = ++fileSelectionId.current;
    setSelectedFile(file);
    setError(null);
    setReadingApkMetadata(true);
    setFormData((prev) => ({ ...prev, versionName: '', versionCode: 0 }));

    try {
      const metadata = await readApkMetadata(file);
      if (metadata.packageName !== 'com.dkaapis.sigma') {
        throw new Error('APK bukan aplikasi HNDSigma Player.');
      }
      if (selectionId !== fileSelectionId.current) return;
      setFormData((prev) => ({
        ...prev,
        versionName: metadata.versionName,
        versionCode: metadata.versionCode,
      }));
    } catch (error) {
      if (selectionId !== fileSelectionId.current) return;
      setSelectedFile(null);
      setError(error instanceof Error ? error.message : 'Gagal membaca metadata APK.');
      if (fileInputRef.current) fileInputRef.current.value = '';
    } finally {
      if (selectionId === fileSelectionId.current) setReadingApkMetadata(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void handleFile(e.dataTransfer.files[0]);
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Silakan pilih berkas APK terlebih dahulu.');
      return;
    }
    if (readingApkMetadata) return;
    if (!formData.versionName.trim()) {
      setError('Nama versi wajib diisi (misal: 1.2.0).');
      return;
    }
    if (formData.versionCode <= 0) {
      setError('Version code integer harus lebih besar dari 0.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setUploadProgress(0);

      // 1. Upload binary APK in chunks via gRPC
      const uploadRes = await api.uploadFileViaGrpc(
        selectedFile,
        (percent) => setUploadProgress(percent)
      );

      // 2. Create release record
      await system.createAppRelease({
        versionCode: Number(formData.versionCode),
        versionName: formData.versionName.trim(),
        apkFileUrl: uploadRes.publicUrl,
        fileSizeBytes: uploadRes.fileSizeBytes,
        sha256Hash: uploadRes.sha256Hash,
        releaseNotes: formData.releaseNotes.trim() || undefined,
        isForceUpdate: formData.isForceUpdate,
        minSupportedVersionCode: Number(formData.minSupportedVersionCode),
      });

      router.push('/system/apk');
    } catch (err: any) {
      console.error('Failed to create APK release:', err);
      setError(err.message || 'Gagal mengunggah dan merilis APK.');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', width: '100%' }}>
      {/* Top Bar with Circular Icon-Only Back Button */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href="/system/apk"
          className="btn btn-outline"
          style={{
            width: '42px',
            minWidth: '42px',
            height: '42px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          aria-label="Kembali ke Daftar Rilis APK"
          title="Kembali ke Daftar Rilis APK"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
            Unggah Rilis APK
          </h1>
          <p style={{ margin: '2px 0 0', fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Unggah paket aplikasi baru untuk pembaruan Android Player.
          </p>
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertTriangle size={18} />
          <span style={{ fontSize: '0.875rem' }}>{error}</span>
        </div>
      )}

      {/* Main Form Card */}
      <form
        onSubmit={handleSubmit}
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '16px',
          padding: '28px',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Dropzone Area */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <label style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Berkas APK Aplikasi Android <span style={{ color: '#ef4444' }}>*</span>
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".apk,application/vnd.android.package-archive"
            style={{ display: 'none' }}
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                void handleFile(e.target.files[0]);
              }
            }}
          />

          <div
            onClick={() => !loading && !readingApkMetadata && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${dragActive ? 'var(--primary-500)' : selectedFile ? 'rgba(16, 185, 129, 0.5)' : 'var(--border-subtle)'}`,
              borderRadius: '14px',
              padding: '32px 20px',
              textAlign: 'center',
              backgroundColor: dragActive ? 'rgba(37, 99, 235, 0.05)' : selectedFile ? 'rgba(16, 185, 129, 0.04)' : 'var(--hover-surface)',
              cursor: loading || readingApkMetadata ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            {selectedFile ? (
              <>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    color: '#10b981',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <FileCode size={28} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    {selectedFile.name}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {readingApkMetadata
                      ? 'Membaca metadata APK...'
                      : `Ukuran: ${formatBytes(selectedFile.size)} • Metadata APK terbaca`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileSelectionId.current += 1;
                    setSelectedFile(null);
                    setReadingApkMetadata(false);
                    setFormData((prev) => ({ ...prev, versionName: '', versionCode: 0 }));
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  className="btn btn-outline"
                  style={{ fontSize: '0.75rem', padding: '4px 10px', borderRadius: '6px' }}
                >
                  Ganti Berkas
                </button>
              </>
            ) : (
              <>
                <div
                  style={{
                    width: '52px',
                    height: '52px',
                    borderRadius: '14px',
                    backgroundColor: 'rgba(2, 132, 199, 0.12)',
                    color: '#0284c7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Upload size={26} />
                </div>
                <div>
                  <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: 'var(--text-primary)' }}>
                    Tarik dan lepaskan berkas .apk di sini, atau <span style={{ color: 'var(--primary-500)', textDecoration: 'underline' }}>pilih berkas</span>
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '0.775rem', color: 'var(--text-muted)' }}>
                    Mendukung berkas kompilasi Android APK (misal: dka-signage-release.apk)
                  </p>
                </div>
              </>
            )}
          </div>

          {uploadProgress !== null && (
            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                <span>Mengunggah berkas APK ke backend...</span>
                <span style={{ fontWeight: 700, color: 'var(--primary-400)' }}>{uploadProgress}%</span>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '3px', backgroundColor: 'var(--border-subtle)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary-500)',
                    transition: 'width 0.2s ease',
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Version Information Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Nama Versi (Version Name) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: 1.2.0"
              value={formData.versionName}
              readOnly
              className="input-field"
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Dibaca otomatis dari manifest APK.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Kode Versi (Version Code) <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="number"
              required
              min={1}
              placeholder="Contoh: 42"
              value={formData.versionCode}
              readOnly
              className="input-field"
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Dibaca otomatis dari APK; harus lebih besar dari versi yang terpasang.
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Versi Min. Didukung
            </label>
            <input
              type="number"
              min={1}
              value={formData.minSupportedVersionCode}
              onChange={(e) => setFormData({ ...formData, minSupportedVersionCode: parseInt(e.target.value) || 1 })}
              className="input-field"
              style={{
                padding: '10px 14px',
                borderRadius: '10px',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '0.875rem',
                outline: 'none',
              }}
            />
            <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
              Player dengan versi di bawah ini otomatis dipaksa update.
            </span>
          </div>
        </div>

        {/* Force Update Checkbox / Card */}
        <div
          style={{
            padding: '16px 18px',
            borderRadius: '12px',
            backgroundColor: formData.isForceUpdate ? 'rgba(239, 68, 68, 0.08)' : 'var(--hover-surface)',
            border: `1px solid ${formData.isForceUpdate ? 'rgba(239, 68, 68, 0.3)' : 'var(--border-subtle)'}`,
            display: 'flex',
            alignItems: 'flex-start',
            gap: '14px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          onClick={() => setFormData({ ...formData, isForceUpdate: !formData.isForceUpdate })}
        >
          <input
            type="checkbox"
            checked={formData.isForceUpdate}
            onChange={(e) => setFormData({ ...formData, isForceUpdate: e.target.checked })}
            style={{ width: '18px', height: '18px', marginTop: '2px', cursor: 'pointer' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontWeight: 700, fontSize: '0.9rem', color: formData.isForceUpdate ? '#ef4444' : 'var(--text-primary)' }}>
              Wajibkan Pembaruan Segera (Force Update)
            </span>
            <span style={{ fontSize: '0.775rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
              Jika diaktifkan, perangkat kiosk akan memblokir interaksi dan otomatis mengunduh &amp; memasang pembaruan di latar belakang tanpa menunggu jadwal maintenance.
            </span>
          </div>
        </div>

        {/* Release Notes */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Catatan Rilis (Release Notes)
          </label>
          <textarea
            rows={4}
            placeholder="Tuliskan changelog, perbaikan bug, atau fitur baru pada versi ini..."
            value={formData.releaseNotes}
            onChange={(e) => setFormData({ ...formData, releaseNotes: e.target.value })}
            style={{
              padding: '12px 14px',
              borderRadius: '10px',
              border: '1px solid var(--border-subtle)',
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              outline: 'none',
              resize: 'vertical',
            }}
          />
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
          <Link
            href="/system/apk"
            className="btn btn-outline"
            style={{ padding: '10px 18px', borderRadius: '10px', textDecoration: 'none' }}
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={loading || readingApkMetadata || !selectedFile}
            className="btn btn-primary"
            style={{
              padding: '10px 22px',
              borderRadius: '10px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              opacity: loading || readingApkMetadata || !selectedFile ? 0.6 : 1,
              cursor: loading || readingApkMetadata || !selectedFile ? 'not-allowed' : 'pointer',
            }}
          >
            <Upload size={16} />
            <span>
              {readingApkMetadata
                ? 'Membaca metadata APK...'
                : loading
                  ? 'Mengunggah & Merilis...'
                  : 'Unggah & Terbitkan Rilis'}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}

