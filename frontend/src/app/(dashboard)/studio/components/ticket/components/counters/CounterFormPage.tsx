'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { useQueueEditor } from '../../context/QueueEditorContext';
import QueueEditorShell from '../QueueEditorShell';

function CounterForm({ counterId }: { counterId?: string }) {
  const { queue, isNew, addCounter, updateCounter } = useQueueEditor();
  const counterLabel = queue?.counterLabel || 'Loket';
  const router = useRouter();
  const listPath = isNew ? '/studio/components/ticket/create/counters' : `/studio/components/ticket/${queue.id}/edit/counters`;
  const existing = counterId ? queue.counters.find((c) => c.id === counterId) : undefined;

  const defaultName = `${counterLabel.toUpperCase()} ${String(queue.counters.length + 1).padStart(2, '0')}`;
  const [counterName, setCounterName] = useState(existing?.counterName || defaultName);
  const [operatorName, setOperatorName] = useState(existing?.operatorName || '');
  const [isActive, setIsActive] = useState(existing?.isActive ?? true);

  if (counterId && !existing) {
    return <div className="card-elevated" style={{ padding: '24px', color: 'var(--text-muted)' }}>{counterLabel} tidak ditemukan.</div>;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = counterName.trim().toUpperCase();
    if (!name) return;
    const data = { counterName: name, operatorName: operatorName.trim(), isActive };
    if (existing) updateCounter(existing.id, data);
    else addCounter(data);
    router.push(listPath);
  };

  return (
    <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '560px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Link href={listPath} className="btn btn-outline" style={{ padding: '6px' }} aria-label={`Kembali ke daftar ${counterLabel.toLowerCase()}`}>
          <ArrowLeft size={14} />
        </Link>
        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {existing ? `Edit ${counterLabel}` : `Tambah ${counterLabel}`}
        </h4>
      </div>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Nama {counterLabel}
        <input id="counter-name" className="form-input" value={counterName} onChange={(e) => setCounterName(e.target.value)} required />
      </label>

      <label style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
        Petugas
        <input id="counter-operator" className="form-input" value={operatorName} onChange={(e) => setOperatorName(e.target.value)} />
      </label>

      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
        <input id="counter-active" type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Aktif
      </label>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
        <Link href={listPath} className="btn btn-secondary">Batal</Link>
        <button type="submit" className="btn btn-primary">
          <Save size={14} />
          Simpan
        </button>
      </div>
    </form>
  );
}

export default function CounterFormPage({ counterId }: { counterId?: string }) {
  return (
    <QueueEditorShell activeTab="counters">
      <CounterForm counterId={counterId} />
    </QueueEditorShell>
  );
}
