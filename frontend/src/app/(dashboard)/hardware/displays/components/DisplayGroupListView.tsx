'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { DisplayGroup } from '@/lib/services/hardware/display-group.types';
import { Pagination } from '@/components/ui/Pagination';
import { MonitorPlay, Plus, Search, RefreshCw, Trash2, Edit, FileText, PanelsTopLeft, CalendarDays } from 'lucide-react';
import { TableDataValue } from '@/components/ui/TableDataValue';

export default function DisplayGroupListView() {
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.getDisplayGroups({ search, page, limit });
      setGroups(res.data);
      setTotal(res.total);
    } catch (err) {
      console.error('Failed to load display groups:', err);
    } finally {
      setLoading(false);
    }
  }, [search, page, limit]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Hapus grup layar "${name}"?`)) return;
    try {
      await api.deleteDisplayGroup(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus grup layar');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Filter & Actions Bar */}
      <div
        className="card-elevated"
        style={{
          padding: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari berdasarkan nama grup..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={loadData} className="btn btn-secondary" title="Segarkan data">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Segarkan</span>
          </button>
          <Link href="/hardware/displays/groups/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Grup</span>
          </Link>
        </div>
      </div>

      {/* Main Table */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Grup</th>
                <th>Deskripsi</th>
                <th>Layout Default</th>
                <th>Jadwal Aktif</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    {loading ? 'Memuat data grup layar...' : 'Tidak ada grup ditemukan.'}
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr key={g.id}>
                    <td>
                      <TableDataValue icon={MonitorPlay}>{g.name}</TableDataValue>
                    </td>
                    <td>
                      {g.description ? (
                        <TableDataValue icon={FileText} tone="violet">
                          {g.description}
                        </TableDataValue>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {g.default_layout_name ? (
                        <TableDataValue icon={PanelsTopLeft}>{g.default_layout_name}</TableDataValue>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>
                      {g.schedule_name ? (
                        <TableDataValue icon={CalendarDays} tone="cyan">
                          {g.schedule_name}
                        </TableDataValue>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Link
                          href={`/hardware/displays/groups/${g.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px' }}
                          title="Edit"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(g.id, g.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus Grup"
                        >
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

        <Pagination
          page={page}
          limit={limit}
          total={total}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>
    </div>
  );
}
