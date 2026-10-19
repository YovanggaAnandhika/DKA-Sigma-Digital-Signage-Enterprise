'use client';

import React from 'react';
import {
  UploadCloud,
  FileVideo,
  FileImage,
  RefreshCw,
  XCircle,
  AlertTriangle,
  Terminal,
} from 'lucide-react';
import { useScheduleDetail } from '../context/ScheduleDetailContext';

export default function ScheduleChunkUploadSection() {
  const {
    assignedDevices,
    fileInputRef,
    selectedUploadFile,
    setSelectedUploadFile,
    uploading,
    uploadProgress,
    chunkStatus,
    uploadErrors,
    uploadLogs,
    setUploadLogs,
    handleStartChunkUpload,
    handleCancelUpload,
    formatBytes,
  } = useScheduleDetail();

  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <UploadCloud size={20} style={{ color: 'var(--primary-400)' }} />
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Uji Coba Pengiriman Chunk ke Player
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
              Unggah berkas untuk menguji transmisi dan latensi sinyal gRPC push ke layar player ({assignedDevices.map((d) => d.name).join(', ') || 'Belum ada layar terikat'}). Berkas ini TIDAK akan didaftarkan ke Pustaka Media atau mengubah susunan layout tayang.
            </p>
          </div>
        </div>
      </div>

      {/* Hidden Input File */}
      <input
        ref={fileInputRef}
        type="file"
        accept="video/mp4,video/webm,image/png,image/jpeg,image/webp"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files[0]) {
            setSelectedUploadFile(e.target.files[0]);
          }
        }}
      />

      {/* Dropzone / File Picker Area */}
      {!selectedUploadFile ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: '2px dashed var(--border-subtle)',
            borderRadius: '12px',
            padding: '36px 20px',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface-elevated)',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              backgroundColor: 'rgba(59, 130, 246, 0.1)',
              color: 'var(--primary-400)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <UploadCloud size={28} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
              Pilih atau Tarik Berkas Media Besar ke Sini
            </div>
            <div style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Mendukung video resolusi tinggi (MP4, WebM) atau gambar (JPG, PNG, WebP) tanpa limit ukuran.
            </div>
          </div>
          <button type="button" className="btn btn-outline" style={{ marginTop: '6px', fontSize: '0.8125rem' }}>
            Pilih Berkas dari Komputer
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* File Selected Card */}
          <div
            style={{
              padding: '16px',
              borderRadius: '10px',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {selectedUploadFile.type.startsWith('video/') ? (
                <FileVideo size={28} style={{ color: 'var(--primary-400)' }} />
              ) : (
                <FileImage size={28} style={{ color: 'var(--accent-emerald)' }} />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                  {selectedUploadFile.name}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {formatBytes(selectedUploadFile.size)} · Estimasi {Math.max(1, Math.ceil(selectedUploadFile.size / (512 * 1024)))} chunk (512 KB/chunk) · Tipe: {selectedUploadFile.type || 'binary'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {!uploading ? (
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedUploadFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="btn btn-outline"
                    style={{ fontSize: '0.8125rem', padding: '6px 12px' }}
                  >
                    Ganti Berkas
                  </button>
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={handleStartChunkUpload}
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '6px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <UploadCloud size={15} />
                    <span>Mulai Upload & Pantau Chunk</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleCancelUpload}
                  className="btn btn-danger"
                  style={{ fontSize: '0.8125rem', padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <XCircle size={15} />
                  <span>Batalkan Upload</span>
                </button>
              )}
            </div>
          </div>

          {/* Progress & Speed Breakdown (Active during upload) */}
          {uploading && (
            <div
              style={{
                padding: '20px',
                borderRadius: '10px',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                border: '1px solid rgba(59, 130, 246, 0.2)',
                display: 'flex',
                flexDirection: 'column',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <RefreshCw size={16} className="animate-spin" style={{ color: 'var(--primary-400)' }} />
                  <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    Mengunggah Chunk ({chunkStatus?.currentChunk ?? 0} dari {chunkStatus?.totalChunks ?? 0})
                  </span>
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary-400)', fontFamily: 'monospace' }}>
                  {uploadProgress}%
                </span>
              </div>

              {/* Progress Bar Container */}
              <div style={{ width: '100%', height: '10px', borderRadius: '6px', backgroundColor: 'var(--bg-surface-elevated)', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${uploadProgress}%`,
                    height: '100%',
                    backgroundColor: 'var(--primary-500)',
                    borderRadius: '6px',
                    transition: 'width 0.2s ease',
                    backgroundImage: 'linear-gradient(45deg, rgba(255, 255, 255, 0.15) 25%, transparent 25%, transparent 50%, rgba(255, 255, 255, 0.15) 50%, rgba(255, 255, 255, 0.15) 75%, transparent 75%, transparent)',
                    backgroundSize: '1rem 1rem',
                  }}
                />
              </div>

              {/* Transfer Statistics Chips */}
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', fontSize: '0.8125rem' }}>
                <div style={{ color: 'var(--text-muted)' }}>
                  Kecepatan: <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(chunkStatus?.speedBps ?? 0)}/s</strong>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Data Terkirim: <strong style={{ color: 'var(--text-primary)' }}>{formatBytes(chunkStatus?.uploadedBytes ?? 0)} / {formatBytes(chunkStatus?.totalBytes ?? 0)}</strong>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Ukuran Chunk: <strong style={{ color: 'var(--text-primary)' }}>1 MB</strong>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>
                  Koneksi Paralel: <strong style={{ color: 'var(--accent-emerald)' }}>4 Workers (Active)</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Error & Diagnostics Box */}
      {uploadErrors.length > 0 && (
        <div
          style={{
            padding: '16px',
            borderRadius: '10px',
            backgroundColor: 'rgba(239, 68, 68, 0.08)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={18} />
            <span style={{ fontWeight: 700, fontSize: '0.9375rem' }}>
              Terdeteksi {uploadErrors.length} Galat Transmisi Chunk
            </span>
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {uploadErrors.map((err, idx) => (
              <div key={idx} style={{ marginTop: '4px', fontFamily: 'monospace' }}>
                [{err.timestamp}] Chunk #{err.chunkIndex + 1}: {err.error}
              </div>
            ))}
          </div>
          <div style={{ marginTop: '6px' }}>
            <button
              type="button"
              onClick={handleStartChunkUpload}
              className="btn btn-outline"
              style={{ fontSize: '0.75rem', padding: '5px 12px', color: 'var(--accent-rose)' }}
            >
              Coba Ulangi Upload
            </button>
          </div>
        </div>
      )}

      {/* Live Terminal Log Activity */}
      {uploadLogs.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
              <Terminal size={14} style={{ color: 'var(--primary-400)' }} />
              <span>Log Aktivitas Transmisi Chunk (Real-Time)</span>
            </div>
            <button
              type="button"
              onClick={() => setUploadLogs([])}
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '0.75rem', cursor: 'pointer' }}
            >
              Bersihkan Log
            </button>
          </div>

          <div
            style={{
              maxHeight: '180px',
              overflowY: 'auto',
              padding: '12px 14px',
              borderRadius: '8px',
              backgroundColor: 'var(--bg-base, #0b0f19)',
              border: '1px solid var(--border-subtle)',
              fontFamily: 'monospace',
              fontSize: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}
          >
            {uploadLogs.map((log) => (
              <div key={log.id} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>[{log.time}]</span>
                <span
                  style={{
                    color:
                      log.type === 'error'
                        ? 'var(--accent-rose)'
                        : log.type === 'success'
                          ? 'var(--accent-emerald)'
                          : log.type === 'chunk'
                            ? 'var(--primary-400)'
                            : 'var(--text-secondary)',
                    wordBreak: 'break-all',
                  }}
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
