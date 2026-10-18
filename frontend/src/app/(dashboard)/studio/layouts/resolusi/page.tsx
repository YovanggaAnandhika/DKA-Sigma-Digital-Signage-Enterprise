'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Resolution } from '@/lib/services';
import { Plus, Search, RefreshCw, Edit, Trash2, Monitor } from 'lucide-react';

export default function ResolusiPage() {
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getResolutions();
      setResolutions(res);
    } catch (err) {
      console.error('Failed to load resolutions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus master resolusi "${name}"? Perangkat yang menggunakan resolusi ini mungkin terpengaruh.`)) return;
    try {
      await api.deleteResolution(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus resolusi');
    }
  };

  const filteredResolutions = resolutions.filter(
    (r) =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      `${r.width}x${r.height}`.includes(search.toLowerCase()) ||
      r.aspectRatio?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari resolusi (nama, dimensi, rasio)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Muat Ulang">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/studio/layouts/resolusi/create" className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Tambah Resolusi</span>
          </Link>
        </div>
      </div>

      {/* Resolution Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>NAMA RESOLUSI</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>LEBAR (PX)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>TINGGI (PX)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>ASPECT RATIO</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>DIBUAT PADA</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat master resolusi...</span>
                  </td>
                </tr>
              ) : filteredResolutions.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada data resolusi tersimpan.
                  </td>
                </tr>
              ) : (
                filteredResolutions.map((r) => (
                  <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {r.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {r.width} px
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      {r.height} px
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--primary-400)', fontSize: '0.75rem', fontWeight: 600 }}>
                        {r.aspectRatio || '16:9'}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {r.createdAt ? new Date(r.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link href={`/studio/layouts/resolusi/${r.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Resolusi">
                          <Edit size={14} />
                        </Link>
                        <button onClick={() => handleDelete(r.id, r.name)} className="btn btn-outline" style={{ padding: '5px 8px', color: 'var(--accent-rose)' }} title="Hapus Resolusi">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
