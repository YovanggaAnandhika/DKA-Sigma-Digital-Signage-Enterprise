'use client';

import React from 'react';
import Link from 'next/link';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { modal } from '@/components/ui/ModalDialog';
import { TableDataValue, TableStatus } from '@/components/ui/TableDataValue';
import { CircleCheck, CircleX, Hash, UserRound } from 'lucide-react';

export default function TabCountersTab() {
  const { queue, removeCounter, isNew } = useQueueEditor();
  const counterLabel = queue?.counterLabel || 'Loket';
  const basePath = isNew ? '/studio/components/ticket/create/counters' : `/studio/components/ticket/${queue.id}/edit/counters`;

  const handleConfirmDelete = async (counterId: string, counterName: string) => {
    const ok = await modal.confirm({
      title: `Hapus ${counterLabel}`,
      message: `Hapus ${counterLabel.toLowerCase()} "${counterName}"?`,
      variant: 'danger',
      confirmText: 'Hapus',
    });
    if (ok) removeCounter(counterId);
  };

  return (
    <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>Daftar {counterLabel}</h4>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>Kelola daftar {counterLabel.toLowerCase()} pemanggil antrian.</p>
        </div>
        <Link href={`${basePath}/create`} className="btn btn-primary" style={{ padding: '7px 14px', fontSize: '0.8125rem' }}>
          <Plus size={14} />
          Tambah {counterLabel}
        </Link>
      </div>

      <table className="data-table">
        <thead>
          <tr>
            <th style={{ width: '60px' }}>No</th>
            <th>Nama {counterLabel}</th>
            <th>Petugas</th>
            <th>Status</th>
            <th style={{ width: '100px', textAlign: 'right' }}>Aksi</th>
          </tr>
        </thead>
        <tbody>
          {queue.counters.map((c) => (
            <tr key={c.id}>
              <td><TableDataValue icon={Hash} tone="violet">{c.counterNumber}</TableDataValue></td>
              <td><TableDataValue icon={Hash}>{c.counterName}</TableDataValue></td>
              <td>{c.operatorName ? <TableDataValue icon={UserRound} tone="cyan">{c.operatorName}</TableDataValue> : '-'}</td>
              <td>
                <TableStatus icon={c.isActive ? CircleCheck : CircleX} tone={c.isActive ? 'emerald' : 'rose'}>
                  {c.isActive ? 'Aktif' : 'Nonaktif'}
                </TableStatus>
              </td>
              <td style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', gap: '6px' }}>
                  <Link href={`${basePath}/${c.id}`} className="btn btn-outline dashboard-icon-action" style={{ padding: '6px' }} title={`Edit ${counterLabel.toLowerCase()}`} aria-label={`Edit ${counterLabel.toLowerCase()}`}>
                    <Edit size={14} />
                  </Link>
                  <button
                    type="button"
                    onClick={() => handleConfirmDelete(c.id, c.counterName)}
                    disabled={queue.counters.length <= 1}
                    className="btn btn-outline dashboard-icon-action dashboard-icon-action-danger"
                    style={{ padding: '6px', color: 'var(--accent-rose)', opacity: queue.counters.length <= 1 ? 0.4 : 1 }}
                    title={queue.counters.length <= 1 ? `Minimal harus ada 1 ${counterLabel.toLowerCase()}` : `Hapus ${counterLabel.toLowerCase()}`}
                    aria-label={`Hapus ${counterLabel.toLowerCase()}`}
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
