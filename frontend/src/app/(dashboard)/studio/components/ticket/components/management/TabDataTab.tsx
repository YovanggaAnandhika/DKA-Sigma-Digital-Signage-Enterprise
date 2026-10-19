'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Search, Edit3, Trash2, Volume2, Users } from 'lucide-react';
import { useQueueManagement } from '../../context/QueueManagementContext';
import { Pagination } from '@/components/ui/Pagination';

export default function TabDataTab() {
  const {
    queues,
    loading,
    search,
    setSearch,
    page,
    setPage,
    limit,
    setLimit,
    sectors,
    handleDeleteQueue,
  } = useQueueManagement();

  const filteredQueues = queues.filter((q) => {
    const qTerm = search.toLowerCase();
    return (
      q.name.toLowerCase().includes(qTerm) ||
      q.prefix.toLowerCase().includes(qTerm) ||
      (q.sectorType && q.sectorType.toLowerCase().includes(qTerm))
    );
  });

  const total = filteredQueues.length;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginatedQueues = filteredQueues.slice(startIndex, startIndex + limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
      {/* Top Action Bar: Search & Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px', maxWidth: '480px' }}>
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
            className="form-input"
            style={{ paddingLeft: '38px', height: '40px' }}
            placeholder="Cari antrian, awalan, atau sektor..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        <Link
          href="/studio/components/ticket/create"
          className="btn btn-primary"
          style={{ height: '40px', padding: '0 18px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <Plus size={16} />
          <span>Tambah Antrian</span>
        </Link>
      </div>

      {/* Main Full-Width Data Table Card */}
      <div className="card-elevated" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>NO</th>
                <th>NAMA LAYANAN</th>
                <th style={{ width: '90px' }}>AWALAN</th>
                <th style={{ width: '140px' }}>NOMOR TERKINI</th>
                <th>LOKET / POS</th>
                <th>AUDIO BEL</th>
                <th style={{ width: '110px', textAlign: 'right' }}>AKSI</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Memuat data layar antrian...
                  </td>
                </tr>
              ) : paginatedQueues.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>
                    {search ? 'Tidak ada antrian yang cocok dengan kata kunci pencarian.' : 'Belum ada layar antrian. Klik Tambah Antrian untuk membuat.'}
                  </td>
                </tr>
              ) : (
                paginatedQueues.map((q, idx) => {
                  const sectorName = sectors.find((s) => s.id === q.sectorType)?.name || q.sectorType || 'Layanan Antrian';
                  const activeCounterObj = q.counters?.find((c) => c.counterName === q.currentCounter) || q.counters?.[0];
                  const activeCounter = activeCounterObj?.counterName || q.currentCounter || 'LOKET 01';
                  const opName = activeCounterObj?.operatorName;
                  const counterStatus = activeCounterObj?.status || 'ACTIVE';
                  const activeAudio = q.audios?.[0]?.name || 'Chime Klasik (Ding-Dong)';

                  return (
                    <tr key={q.id}>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                        {startIndex + idx + 1}
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--text-primary)' }}>
                            {q.name}
                          </span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span
                              style={{
                                fontSize: '0.6875rem',
                                fontWeight: 600,
                                padding: '1px 6px',
                                borderRadius: '4px',
                                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                color: 'var(--primary-400)',
                                border: '1px solid rgba(59, 130, 246, 0.25)',
                              }}
                            >
                              {sectorName}
                            </span>
                            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                              {q.canvasWidth} × {q.canvasHeight} px
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 10px',
                            borderRadius: '6px',
                            backgroundColor: 'var(--bg-surface-elevated)',
                            border: '1px solid var(--border-subtle)',
                            fontWeight: 700,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {q.prefix || 'A'}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 800,
                            fontFamily: 'monospace',
                            fontSize: '1rem',
                            letterSpacing: '0.04em',
                            color: 'var(--primary-400)',
                          }}
                        >
                          {q.currentNumber || `${q.prefix || 'A'}-000`}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Users size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                                {activeCounter}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.6rem',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: '4px',
                                  backgroundColor:
                                    counterStatus === 'LOCKED'
                                      ? 'rgba(239, 68, 68, 0.12)'
                                      : counterStatus === 'BREAK'
                                      ? 'rgba(245, 158, 11, 0.12)'
                                      : 'rgba(16, 185, 129, 0.12)',
                                  color:
                                    counterStatus === 'LOCKED'
                                      ? 'var(--accent-rose)'
                                      : counterStatus === 'BREAK'
                                      ? 'var(--accent-amber)'
                                      : 'var(--accent-emerald)',
                                  border:
                                    counterStatus === 'LOCKED'
                                      ? '1px solid rgba(239, 68, 68, 0.25)'
                                      : counterStatus === 'BREAK'
                                      ? '1px solid rgba(245, 158, 11, 0.25)'
                                      : '1px solid rgba(16, 185, 129, 0.25)',
                                }}
                              >
                                {counterStatus === 'LOCKED' ? 'TUTUP' : counterStatus === 'BREAK' ? 'ISTIRAHAT' : 'BUKA'}
                              </span>
                            </div>
                            {opName && (
                              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                {opName}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', fontSize: '0.78rem' }}>
                          <Volume2 size={13} style={{ color: 'var(--accent-emerald)', flexShrink: 0 }} />
                          <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={activeAudio}>
                            {activeAudio}
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '6px' }}>
                          <Link
                            href={`/studio/components/ticket/${q.id}/edit`}
                            className="btn btn-outline"
                            style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.75rem' }}
                            title="Buka Editor & Konsol Pemanggil"
                          >
                            <Edit3 size={13} />
                            <span>Edit</span>
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleDeleteQueue(q.id, q.name)}
                            className="btn btn-outline"
                            style={{ padding: '6px', color: 'var(--accent-rose)' }}
                            title="Hapus Layar Antrian"
                            aria-label={`Hapus ${q.name}`}
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

        {/* Table Footer with Pagination */}
        {total > 0 && (
          <Pagination
            page={page}
            limit={limit}
            total={total}
            onPageChange={setPage}
            onLimitChange={setLimit}
            limitOptions={[5, 10, 20, 50]}
          />
        )}
      </div>
    </div>
  );
}
