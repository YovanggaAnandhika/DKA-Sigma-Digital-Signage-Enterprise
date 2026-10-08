'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Plus, Search, Eye, Trash2, Bell, Volume2, X, RotateCcw, Monitor } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';

export interface QueueDisplayConfig {
  id: string;
  name: string;
  prefix: string;
  currentNumber: string;
  currentCounter: string;
  audioChimeEnabled: boolean;
  marqueeText: string;
  createdAt?: string;
}

export const QUEUE_STORAGE_KEY = 'dka_signage_queue_displays';

export const DEFAULT_QUEUES: QueueDisplayConfig[] = [
  {
    id: 'q-1',
    name: 'Antrian Kasir Utama & CS',
    prefix: 'A',
    currentNumber: 'A-024',
    currentCounter: 'LOKET 02',
    audioChimeEnabled: true,
    marqueeText: 'Silakan menuju loket saat nomor Anda dipanggil. Terima kasih atas kesabaran Anda.',
    createdAt: '2026-10-08',
  },
  {
    id: 'q-2',
    name: 'Antrian Pengambilan Obat / Farmasi',
    prefix: 'B',
    currentNumber: 'B-015',
    currentCounter: 'LOKET 01',
    audioChimeEnabled: true,
    marqueeText: 'Harap persiapkan struk resep Anda sebelum menuju loket kasir.',
    createdAt: '2026-10-08',
  },
];

export default function QueueTicketManagerTab() {
  const [queues, setQueues] = useState<QueueDisplayConfig[]>(DEFAULT_QUEUES);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [activeModalQueue, setActiveModalQueue] = useState<QueueDisplayConfig | null>(null);

  // Operator state in modal
  const [modalSeq, setModalSeq] = useState(24);
  const [modalCurrentNumber, setModalCurrentNumber] = useState('A-024');
  const [modalCounter, setModalCounter] = useState('LOKET 02');
  const [isChiming, setIsChiming] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setQueues(parsed);
        }
      }
    } catch {}
  }, []);

  const saveQueues = (updated: QueueDisplayConfig[]) => {
    setQueues(updated);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus konfigurasi antrian "${name}"?`)) return;
    const updated = queues.filter((q) => q.id !== id);
    saveQueues(updated);
  };

  const playChime = () => {
    try {
      setIsChiming(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.6);

      // Tone 2
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(523.25, now + 0.35);
      gain2.gain.setValueAtTime(0.35, now + 0.35);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.35);
      osc2.stop(now + 1.2);

      setTimeout(() => setIsChiming(false), 1200);
    } catch {
      setIsChiming(false);
    }
  };

  const handleNextNumber = () => {
    if (!activeModalQueue) return;
    const next = modalSeq + 1;
    const formatted = `${activeModalQueue.prefix}-${String(next).padStart(3, '0')}`;
    setModalSeq(next);
    setModalCurrentNumber(formatted);
    playChime();

    // update queue record
    const updated = queues.map((q) => (q.id === activeModalQueue.id ? { ...q, currentNumber: formatted } : q));
    saveQueues(updated);
  };

  const filtered = queues.filter((q) => q.name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Daftar Komponen Nomor Antrian & Tiket
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Kelola layar pemanggil antrian loket kasir/layanan dengan nomor digital dan bunyi bel (Audio Chime).
          </p>
        </div>

        <Link href="/studio/components/ticket/create" className="btn btn-primary">
          <Plus size={16} />
          <span>Tambah Layar Antrian Baru</span>
        </Link>
      </div>

      {/* Search Input */}
      <div className="card-elevated" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Cari layar antrian berdasarkan nama..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Table List */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Layar Antrian</th>
                <th>Prefix Nomor</th>
                <th>Loket Saat Ini</th>
                <th>Nomor Terakhir</th>
                <th>Bunyi Bel (Chime)</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada layar antrian tersimpan. Klik "Tambah Layar Antrian Baru" untuk membuat.
                  </td>
                </tr>
              ) : (
                paginated.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Ticket size={18} style={{ color: 'var(--primary-400)', flexShrink: 0 }} />
                        <span>{item.name}</span>
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 8px',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary-400)',
                        }}
                      >
                        Prefix {item.prefix}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                      {item.currentCounter}
                    </td>
                    <td>
                      <span style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'monospace' }}>
                        {item.currentNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.75rem', color: item.audioChimeEnabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                        {item.audioChimeEnabled ? '🔔 Aktif' : 'Muted'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => {
                            setActiveModalQueue(item);
                            setModalCurrentNumber(item.currentNumber);
                            setModalCounter(item.currentCounter);
                          }}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Buka Layar Panggilan"
                        >
                          <Monitor size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
                          className="btn btn-danger"
                          style={{ padding: '5px 8px' }}
                          title="Hapus"
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
          total={filtered.length}
          onPageChange={(newPage) => setPage(newPage)}
          onLimitChange={(newLimit) => {
            setLimit(newLimit);
            setPage(1);
          }}
        />
      </div>

      {/* Calling Screen Interactive Modal */}
      {activeModalQueue && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
            backdropFilter: 'blur(6px)',
          }}
          onClick={() => setActiveModalQueue(null)}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '860px',
              backgroundColor: '#050714',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header & Controls */}
            <div
              style={{
                padding: '16px 20px',
                backgroundColor: 'rgba(15, 23, 42, 0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Ticket size={20} style={{ color: '#60a5fa' }} />
                <span style={{ fontWeight: 800, fontSize: '1rem' }}>
                  Kontrol Antrian: {activeModalQueue.name}
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button onClick={playChime} className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                  <Volume2 size={12} className={isChiming ? 'animate-bounce' : ''} />
                  <span>Bel (Recall)</span>
                </button>
                <button onClick={handleNextNumber} className="btn btn-primary" style={{ padding: '6px 14px', fontSize: '0.75rem' }}>
                  <Bell size={12} />
                  <span>Panggil Berikutnya (+1)</span>
                </button>
                <button
                  onClick={() => setActiveModalQueue(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', marginLeft: '8px' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Display Stage */}
            <div
              style={{
                padding: '48px 24px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '12px',
                background: 'radial-gradient(circle at 50% 30%, rgba(30, 58, 138, 0.4) 0%, #030712 80%)',
              }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                NOMOR ANTRIAN DIPANGGIL
              </span>

              <div
                style={{
                  fontSize: '5rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  fontFamily: 'monospace',
                  textShadow: '0 0 35px rgba(59, 130, 246, 0.8)',
                  animation: isChiming ? 'pulse 0.6s infinite' : 'none',
                }}
              >
                {modalCurrentNumber}
              </div>

              <div
                style={{
                  padding: '8px 28px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(37, 99, 235, 0.3)',
                  border: '2px solid rgba(96, 165, 250, 0.6)',
                  color: '#93c5fd',
                  fontSize: '1.25rem',
                  fontWeight: 900,
                }}
              >
                {modalCounter}
              </div>
            </div>

            {/* Footer marquee */}
            <div
              style={{
                backgroundColor: '#1e3a8a',
                color: '#e0e7ff',
                padding: '8px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textAlign: 'center',
              }}
            >
              📢 {activeModalQueue.marqueeText}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
