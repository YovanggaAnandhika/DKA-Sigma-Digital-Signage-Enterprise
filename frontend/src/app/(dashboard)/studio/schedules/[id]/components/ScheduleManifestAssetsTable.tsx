'use client';

import React from 'react';
import {
  Layers,
  FileVideo,
  FileImage,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useScheduleDetail } from '../context/ScheduleDetailContext';

export default function ScheduleManifestAssetsTable() {
  const {
    layoutMediaItems,
    totalAssetBytes,
    formatBytes,
    handleCopyHash,
    copiedHash,
  } = useScheduleDetail();

  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Layers size={20} style={{ color: 'var(--primary-400)' }} />
          <div>
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
              Manifest Aset Media Layout ({layoutMediaItems.length})
            </h2>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', margin: 0, marginTop: '2px' }}>
              Seluruh berkas media yang wajib diunduh dan diverifikasi SHA-256 oleh player sebelum manifest beralih tayang.
            </p>
          </div>
        </div>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Total: {formatBytes(totalAssetBytes)}
        </span>
      </div>

      {layoutMediaItems.length === 0 ? (
        <div style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
          Tidak ada berkas media statis pada layout ini (atau hanya komponen dinamis seperti jam/teks berjalan).
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>MEDIA</th>
                <th>TIPE & FORMAT</th>
                <th>RESOLUSI / DURASI</th>
                <th>UKURAN</th>
                <th>SHA-256 HASH</th>
                <th>LOKASI DISIMPAN DI ANDROID</th>
                <th>STATUS PENYIMPANAN</th>
              </tr>
            </thead>
            <tbody>
              {layoutMediaItems.map((m) => (
                <tr key={m.id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {m.mimeType?.startsWith('video/') ? (
                        <FileVideo size={18} style={{ color: 'var(--primary-400)' }} />
                      ) : (
                        <FileImage size={18} style={{ color: 'var(--accent-emerald)' }} />
                      )}
                      <div>
                        <div>{m.name}</div>
                        <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                          {m.originalFilename || m.id}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {m.mimeType || 'video/mp4'}
                  </td>
                  <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                    {m.width && m.height ? `${m.width}×${m.height}` : '1920×1080'}
                    {m.durationSeconds ? ` · ${m.durationSeconds}s` : ''}
                  </td>
                  <td style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>
                    {formatBytes(m.fileSizeBytes)}
                  </td>
                  <td>
                    {m.sha256Hash ? (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <span
                          style={{
                            fontSize: '0.6875rem',
                            fontFamily: 'monospace',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: 'var(--text-muted)',
                          }}
                        >
                          {m.sha256Hash.substring(0, 12)}...
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(m.sha256Hash)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          title="Salin SHA256 Hash"
                        >
                          {copiedHash === m.sha256Hash ? <Check size={12} color="var(--accent-emerald)" /> : <Copy size={12} />}
                        </button>
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>-</span>
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <code
                          style={{
                            fontSize: '0.6875rem',
                            backgroundColor: 'var(--bg-base)',
                            padding: '2px 6px',
                            borderRadius: '4px',
                            color: 'var(--accent-emerald)',
                            fontFamily: 'monospace',
                            border: '1px solid var(--border-subtle)',
                          }}
                          title={`/storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/${m.id}`}
                        >
                          .../assets/{m.id.substring(0, 8)}...
                        </code>
                        <button
                          type="button"
                          onClick={() => handleCopyHash(`/storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/${m.id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '2px' }}
                          title="Salin Lokasi Penyimpanan di Android"
                        >
                          {copiedHash === `/storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/${m.id}` ? (
                            <Check size={12} color="var(--accent-emerald)" />
                          ) : (
                            <Copy size={12} />
                          )}
                        </button>
                      </div>
                      <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                        /storage/emulated/0/Android/data/com.dkaapis.sigma/files/assets/
                      </span>
                    </div>
                  </td>
                  <td>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '0.75rem',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        color: 'var(--accent-emerald)',
                        border: '1px solid rgba(16, 185, 129, 0.2)',
                      }}
                    >
                      <CheckCircle2 size={12} />
                      <span>Tersimpan di Server</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
