'use client';

import React from 'react';
import { ShieldCheck, Download } from 'lucide-react';
import { useDisplayDetail } from '../context/DisplayDetailContext';

export default function DisplayPlaybackAuditTable() {
  const { playbackLogs, handleExportCSV } = useDisplayDetail();

  return (
    <div className="card-elevated" style={{ padding: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} style={{ color: 'var(--accent-emerald)' }} />
            <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Bukti Tayang / Proof of Play
            </h2>
          </div>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Laporan verifikasi kepatuhan impresi iklan dan penayangan konten di layar.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={playbackLogs.length === 0}
            className="btn btn-outline"
            title="Unduh data bukti tayang ke berkas CSV"
            style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Download size={14} />
            <span>Ekspor Laporan CSV</span>
          </button>
        </div>
      </div>

      {/* Airtime & Delivery KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '20px' }}>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL PENAYANGAN (IMPRESI)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '4px' }}>
            {playbackLogs.length}
          </div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL AIRTIME (DURASI)</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-cyan)', marginTop: '4px' }}>
            {(playbackLogs.reduce((acc, cur) => acc + (cur.durationSeconds || 0), 0) / 60).toFixed(1)} Menit
          </div>
        </div>
        <div style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--bg-surface-elevated)' }}>
          <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)' }}>RASIO TAYANG SUKSES</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--accent-emerald)', marginTop: '4px' }}>
            {playbackLogs.length
              ? `${Math.round((playbackLogs.filter((l) => l.isCompleted).length / playbackLogs.length) * 100)}%`
              : '100%'}
          </div>
        </div>
      </div>

      {playbackLogs.length === 0 ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', backgroundColor: 'var(--bg-surface)', borderRadius: '8px' }}>
          Belum ada rekaman penayangan media dari player ini.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', color: 'var(--text-muted)' }}>
                <th style={{ padding: '8px 12px' }}>Media / Konten</th>
                <th style={{ padding: '8px 12px' }}>Layout</th>
                <th style={{ padding: '8px 12px' }}>Waktu Mulai Tayang</th>
                <th style={{ padding: '8px 12px' }}>Durasi</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {playbackLogs.map((log) => (
                <tr key={log.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {log.mediaName || log.mediaId || 'Media Item'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {log.layoutName || log.layoutId || '-'}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-muted)' }}>
                    {new Date(log.startedAt).toLocaleString('id-ID')}
                  </td>
                  <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>
                    {log.durationSeconds} detik
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <span
                      style={{
                        padding: '2px 8px',
                        borderRadius: '9999px',
                        fontSize: '0.6875rem',
                        fontWeight: 700,
                        backgroundColor: log.isCompleted ? 'rgba(16, 185, 129, 0.12)' : 'rgba(234, 88, 12, 0.12)',
                        color: log.isCompleted ? 'var(--accent-emerald)' : 'var(--accent-amber)',
                      }}
                    >
                      {log.isCompleted ? 'Selesai' : 'Sebagian'}
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
