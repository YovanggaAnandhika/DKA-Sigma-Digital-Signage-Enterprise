'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api, Layout } from '@/lib/services';
import { Pagination } from '@/components/ui/Pagination';
import { TableDataValue } from '@/components/ui/TableDataValue';
import {
  Plus,
  Search,
  RefreshCw,
  Trash2,
  Send,
  LayoutTemplate,
  Monitor,
  MonitorCheck,
  Smartphone,
  Layers,
  CalendarDays,
} from 'lucide-react';

export default function LayoutsDataPage() {
  const router = useRouter();
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getLayouts({ search, page, limit });
      setLayouts(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load layouts:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus template layout "${name}"?`)) return;
    try {
      await api.deleteLayout(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus layout');
    }
  };

  const handleOpenScheduleAssignment = (layout: Layout) => {
    router.push(`/studio/schedules/assign/${layout.id}`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Controls & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '260px', maxWidth: '420px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Cari template layout berdasarkan nama..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="form-input"
            style={{ paddingLeft: '36px', height: '40px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button onClick={loadData} className="btn btn-outline" style={{ padding: '8px 12px' }} title="Muat Ulang">
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <Link href="/studio/layouts/data/create" className="btn btn-primary" style={{ padding: '8px 16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={16} />
            <span>Buat Layout Baru</span>
          </Link>
        </div>
      </div>

      {/* Layout Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.875rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-surface-elevated)' }}>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>NAMA TEMPLATE LAYOUT</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>DIMENSI CANVAS</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>ORIENTASI</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>JUMLAH LAYER LAYAR</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)' }}>DIBUAT PADA</th>
                <th style={{ padding: '12px 16px', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px auto' }} />
                    <span>Memuat template layout...</span>
                  </td>
                </tr>
              ) : layouts.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Belum ada template layout tersimpan.
                  </td>
                </tr>
              ) : (
                layouts.map((l) => {
                  const isPortrait = String(l.orientation) === '2' || l.orientation === 'portrait';
                  const layerCount = l.layersList ? l.layersList.length : 0;

                  return (
                    <tr
                      key={l.id}
                      onClick={() => router.push(`/studio/layouts/data/${l.id}/edit`)}
                      style={{
                        borderBottom: '1px solid var(--border-subtle)',
                        transition: 'background-color 0.15s ease',
                        cursor: 'pointer',
                      }}
                    >
                      <td>
                        <TableDataValue icon={LayoutTemplate} detail={l.isScheduleSynced ? 'Tersinkronisasi' : 'Belum dijadwalkan'}>
                          <Link
                            href={`/studio/layouts/data/${l.id}/edit`}
                            style={{ textDecoration: 'none', color: 'inherit' }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {l.name}
                          </Link>
                        </TableDataValue>
                      </td>
                      <td>
                        <TableDataValue icon={Monitor} tone="cyan">
                          {l.canvasWidth} × {l.canvasHeight} px
                        </TableDataValue>
                      </td>
                      <td>
                        <TableDataValue icon={isPortrait ? Smartphone : MonitorCheck} tone="violet">
                          {isPortrait ? 'Portrait' : 'Landscape'}
                        </TableDataValue>
                      </td>
                      <td>
                        <TableDataValue icon={Layers} tone="primary">
                          {layerCount} Layer
                        </TableDataValue>
                      </td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        <TableDataValue icon={CalendarDays} tone="amber">
                          {l.createdAt ? new Date(l.createdAt).toLocaleDateString('id-ID', { dateStyle: 'medium' }) : '-'}
                        </TableDataValue>
                      </td>
                      <td
                        style={{ padding: '12px 16px', textAlign: 'right' }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          {!l.isScheduleSynced && (
                            <button
                              onClick={() => handleOpenScheduleAssignment(l)}
                              className="btn btn-primary"
                              style={{
                                padding: '5px 8px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                              title="Tambahkan ke Rundown Operasional"
                              aria-label={`Jadwalkan layout ${l.name}`}
                            >
                              <Send size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => handleDelete(l.id, l.name)}
                            className="btn btn-outline"
                            style={{ padding: '5px 8px', color: 'var(--accent-rose)' }}
                            title="Hapus Template"
                            aria-label={`Hapus layout ${l.name}`}
                          >
                            <Trash2 size={14} />
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

    </div>
  );
}
