'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { LayoutHistoryItem } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { Search, RefreshCw, RotateCcw, FileCode, Check, Copy, X, Layers, Clock } from 'lucide-react';

export default function LayoutHistoryPage() {
  const [historyItems, setHistoryItems] = useState<LayoutHistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(15);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  // Modal JSON Viewer
  const [selectedSnapshot, setSelectedSnapshot] = useState<{ name: string; hash: string; json: string } | null>(null);
  const [copied, setCopied] = useState(false);

  // Rollback state
  const [rollingBackId, setRollingBackId] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLayoutHistory({ search, page, limit });
      setHistoryItems(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load layout history:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRollback = async (item: LayoutHistoryItem) => {
    const shortHash = item.versionHash.substring(0, 8);
    const confirmed = confirm(
      `Apakah Anda yakin ingin melakukan ROLLBACK layout "${item.layoutName || 'Layout'}" ke versi ${shortHash}?\n\nSemua perubahan setelah versi ini akan ditimpa dengan snapshot ini.`
    );
    if (!confirmed) return;

    try {
      setRollingBackId(item.id);
      const res = await api.rollbackLayout(item.id);
      alert(res.message || 'Berhasil melakukan rollback!');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal melakukan rollback');
    } finally {
      setRollingBackId(null);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const parseSnapshotSummary = (jsonStr: string) => {
    try {
      const obj = JSON.parse(jsonStr);
      const layersCount = Array.isArray(obj.layers) ? obj.layers.length : (Array.isArray(obj.layersList) ? obj.layersList.length : 0);
      const width = obj.canvasWidth || obj.layout?.canvas_width || 1920;
      const height = obj.canvasHeight || obj.layout?.canvas_height || 1080;
      return `${width}×${height} • ${layersCount} Layer`;
    } catch {
      return '-';
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama layout, hash, keterangan..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <button onClick={loadData} className="btn btn-outline" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }} title="Muat Ulang">
          <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          <span style={{ fontSize: '0.875rem' }}>Segarkan Riwayat</span>
        </button>
      </div>

      {/* History Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>NAMA LAYOUT</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>VERSION HASH</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>SNAPSHOT STRUKTUR</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>KETERANGAN</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>WAKTU DISIMPAN</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat riwayat perubahan layout...</span>
                  </td>
                </tr>
              ) : historyItems.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <Clock size={24} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                    <p style={{ margin: 0, fontWeight: 500 }}>Belum ada riwayat perubahan yang tersimpan.</p>
                    <span style={{ fontSize: '0.8125rem' }}>Riwayat versi tercatat otomatis setiap kali Anda menekan tombol "Simpan Layout" di editor.</span>
                  </td>
                </tr>
              ) : (
                historyItems.map((item) => {
                  const shortHash = item.versionHash ? item.versionHash.substring(0, 8) : '--------';
                  const isRollingBack = rollingBackId === item.id;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                      <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        <Link href={`/studio/layouts/data/${item.layoutId}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                          {item.layoutName || 'Layout'}
                        </Link>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontFamily: 'monospace',
                            fontSize: '0.8125rem',
                            backgroundColor: 'rgba(59, 130, 246, 0.12)',
                            color: 'var(--primary-400)',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            border: '1px solid rgba(59, 130, 246, 0.25)',
                          }}
                          title={item.versionHash}
                        >
                          {shortHash}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-secondary)', fontSize: '0.8125rem' }}>
                        {parseSnapshotSummary(item.snapshotJson)}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {item.description || 'Perubahan disimpan'}
                      </td>
                      <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                          <button
                            onClick={() => setSelectedSnapshot({ name: item.layoutName || 'Layout', hash: item.versionHash, json: item.snapshotJson })}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                            title="Lihat Format Snapshot JSON"
                          >
                            <FileCode size={13} />
                            <span>Lihat JSON</span>
                          </button>
                          <button
                            onClick={() => handleRollback(item)}
                            disabled={isRollingBack}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                            title="Rollback ke Versi Ini"
                          >
                            <RotateCcw size={13} className={isRollingBack ? 'animate-spin' : ''} />
                            <span>{isRollingBack ? 'Memulihkan...' : 'Rollback'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {total > limit && (
          <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border-subtle)' }}>
            <Pagination
              page={page}
              total={total}
              limit={limit}
              onPageChange={setPage}
              onLimitChange={(newLimit: number) => {
                setLimit(newLimit);
                setPage(1);
              }}
            />
          </div>
        )}
      </div>

      {/* Snapshot JSON Modal Viewer */}
      {selectedSnapshot && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '750px',
              maxHeight: '85vh',
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '16px',
              border: '1px solid var(--border-strong)',
              overflow: 'hidden',
              boxShadow: '0 24px 48px -12px rgba(0, 0, 0, 0.5)',
            }}
          >
            {/* Modal Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Snapshot JSON: {selectedSnapshot.name}
                </h3>
                <span style={{ fontSize: '0.75rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                  Hash: {selectedSnapshot.hash}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => copyToClipboard(selectedSnapshot.json)}
                  className="btn btn-outline"
                  style={{ padding: '6px 12px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {copied ? <Check size={14} style={{ color: 'var(--accent-emerald)' }} /> : <Copy size={14} />}
                  <span>{copied ? 'Tersalin' : 'Salin JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="btn btn-outline"
                  style={{ padding: '6px', borderRadius: '8px' }}
                  title="Tutup"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Modal JSON Body */}
            <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <pre
                style={{
                  margin: 0,
                  fontSize: '0.8125rem',
                  fontFamily: 'SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  color: 'var(--text-primary)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {(() => {
                  try {
                    return JSON.stringify(JSON.parse(selectedSnapshot.json), null, 2);
                  } catch {
                    return selectedSnapshot.json;
                  }
                })()}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
