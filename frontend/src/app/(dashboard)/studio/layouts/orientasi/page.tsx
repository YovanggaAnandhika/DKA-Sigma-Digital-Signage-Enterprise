'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api, Orientation } from '@/lib/services';
import { Plus, Search, RefreshCw, Edit, Trash2, Compass } from 'lucide-react';

export default function OrientasiPage() {
  const [orientations, setOrientations] = useState<Orientation[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getOrientations();
      setOrientations(res);
    } catch (err) {
      console.error('Failed to load orientations:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus master orientasi "${name}"? Perangkat yang menggunakan orientasi ini mungkin terpengaruh.`)) return;
    try {
      await api.deleteOrientation(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus orientasi');
    }
  };

  const filteredOrientations = orientations.filter(
    (o) =>
      o.name.toLowerCase().includes(search.toLowerCase()) ||
      o.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari orientasi (nama atau kode value)..."
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
          <Link href="/studio/layouts/orientasi/create" className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Tambah Orientasi</span>
          </Link>
        </div>
      </div>

      {/* Orientation Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>NAMA ORIENTASI</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>KODE SISTEM (VALUE)</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>DIBUAT PADA</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat master orientasi...</span>
                  </td>
                </tr>
              ) : filteredOrientations.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada data orientasi tersimpan.
                  </td>
                </tr>
              ) : (
                filteredOrientations.map((o) => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--border-subtle)', transition: 'background-color 0.15s ease' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-primary)' }}>
                      {o.name}
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-secondary)' }}>
                      <code style={{ padding: '3px 8px', borderRadius: '4px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', fontSize: '0.8125rem' }}>
                        {o.value}
                      </code>
                    </td>
                    <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '6px' }}>
                        <Link href={`/studio/layouts/orientasi/${o.id}/edit`} className="btn btn-secondary" style={{ padding: '5px 8px' }} title="Edit Orientasi">
                          <Edit size={14} />
                        </Link>
                        <button onClick={() => handleDelete(o.id, o.name)} className="btn btn-outline" style={{ padding: '5px 8px', color: 'var(--accent-rose)' }} title="Hapus Orientasi">
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
