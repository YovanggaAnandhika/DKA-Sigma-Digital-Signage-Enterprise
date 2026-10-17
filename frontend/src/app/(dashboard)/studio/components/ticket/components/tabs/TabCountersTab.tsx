'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { modal } from '@/components/ui/ModalDialog';

export default function TabCountersTab() {
  const { queue, removeCounter, isNew } = useQueueEditor();
  const basePath = isNew ? '/studio/components/ticket/create/counters' : `/studio/components/ticket/${queue.id}/edit/counters`;

  const handleConfirmDelete = async (counterId: string, counterName: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Loket',
      message: `Hapus loket "${counterName}"?`,
      variant: 'danger',
      confirmText: 'Hapus',
    });
    if (ok) removeCounter(counterId);
  };

  return (
    <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daftar Loket</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelola daftar loket pemanggil antrian.</p>
        </div>
        <Link href={`${basePath}/create`} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.8125rem' }}>
          <Plus size={14} />
          Tambah Loket
        </Link>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>No</th>
            <th>Nama Loket</th>
            <th>Petugas</th>
            <th>Status</th>
            <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {queue.counters.map((c) => (
            <tr key={c.id}>
              <td>{c.counterNumber}</td>
              <td style={{ fontWeight: 600 }}>{c.counterName}</td>
              <td>{c.operatorName || '-'}</td>
              <td>
                <span style={{ fontSize: '0.6875rem', fontWeight: 600, padding: '2px 8px', borderRadius: '9999px', backgroundColor: c.isActive ? 'rgba(16,185,129,0.12)' : 'rgba(148,163,184,0.15)', color: c.isActive ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  {c.isActive ? 'Aktif' : 'Nonaktif'}
                </span>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <Link href={`${basePath}/${c.id}`} className="btn btn-outline" style={{ padding: '6px' }} title="Edit loket" aria-label="Edit loket">
                    <Edit size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(c.id, c.counterName)}
                    disabled={queue.counters.length <= 1}
                    className="btn btn-outline"
                    style={{ padding: '6px', color: 'var(--accent-rose)', opacity: queue.counters.length <= 1 ? 0.4 : 1 }}
                    title={queue.counters.length <= 1 ? 'Minimal harus ada 1 loket' : 'Hapus loket'}
                    aria-label="Hapus loket"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
