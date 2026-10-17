'use client';

import React from 'react';
import { Users, Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import { modal } from '@/components/ui/ModalDialog';

export default function TabCountersTab() {
  const { queue, addCounter, removeCounter, updateCounter } = useQueueEditor();

  const handleConfirmDelete = async (counterId: string, counterName: string) => {
    const ok = await modal.confirm({
      title: 'Hapus Loket',
      message: `Apakah Anda yakin ingin menghapus loket "${counterName}"?`,
      variant: 'danger',
      confirmText: 'Hapus Loket',
    });
    if (ok) {
      removeCounter(counterId);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div className="card-elevated" style={{ padding: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Users size={18} color="var(--primary-500)" />
              <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                Daftar Loket
              </h4>
            </div>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Kelola daftar loket pemanggil antrian.
            </p>
          </div>

          <button
            type="button"
            onClick={addCounter}
            className="btn btn-secondary"
            style={{ padding: '6px 14px', fontSize: '0.8125rem' }}
          >
            <Plus size={14} />
            Tambah Loket
          </button>
        </div>

        {/* Counter cards list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {queue.counters.map((c, idx) => (
            <div
              key={c.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 16px',
                borderRadius: '10px',
                backgroundColor: 'var(--bg-surface-elevated)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <span
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  backgroundColor: 'var(--bg-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: 'var(--text-muted)',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </span>

              {/* Counter Name input */}
              <div style={{ flex: 1, minWidth: '140px' }}>
                <input
                  type="text"
                  value={c.counterName}
                  onChange={(e) => updateCounter(c.id, { counterName: e.target.value.toUpperCase() })}
                  className="form-input"
                  placeholder="Nama Loket (misal: LOKET 01)"
                  style={{ fontWeight: 600 }}
                />
              </div>

              {/* Officer Name input */}
              <div style={{ flex: 1, minWidth: '140px' }}>
                <input
                  type="text"
                  value={c.operatorName || ''}
                  onChange={(e) => updateCounter(c.id, { operatorName: e.target.value })}
                  className="form-input"
                  placeholder="Nama Petugas / Kasir"
                />
              </div>

              {/* Delete button */}
              <button
                type="button"
                onClick={() => handleConfirmDelete(c.id, c.counterName)}
                disabled={queue.counters.length <= 1}
                className="btn btn-outline"
                style={{
                  padding: '8px',
                  color: queue.counters.length <= 1 ? 'var(--text-muted)' : 'var(--accent-rose)',
                  opacity: queue.counters.length <= 1 ? 0.4 : 1,
                  cursor: queue.counters.length <= 1 ? 'not-allowed' : 'pointer',
                }}
                title={queue.counters.length <= 1 ? 'Minimal harus ada 1 loket' : 'Hapus loket'}
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
