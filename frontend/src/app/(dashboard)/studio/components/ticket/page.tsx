'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Ticket, Plus, Search, Eye, Edit, Trash2, Bell, Volume2, X, RotateCcw, Monitor } from 'lucide-react';
import { Pagination } from '@/components/ui/Pagination';
import { QueueDisplayConfig, QUEUE_STORAGE_KEY, DEFAULT_QUEUES } from './types';

const Marquee = 'marquee' as any;

// Audio chime generator using Web Audio API
function playDingDongChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    // Ding tone (880 Hz / A5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, ctx.currentTime);
    gain1.gain.setValueAtTime(0.3, ctx.currentTime);
    gain1.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(ctx.currentTime);
    osc1.stop(ctx.currentTime + 0.8);

    // Dong tone (587.33 Hz / D5) after 400ms
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(587.33, ctx.currentTime + 0.4);
    gain2.gain.setValueAtTime(0.35, ctx.currentTime + 0.4);
    gain2.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(ctx.currentTime + 0.4);
    osc2.stop(ctx.currentTime + 1.4);
  } catch (e) {
    console.error('Audio chime error:', e);
  }
}

export default function TicketPage() {
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
      } else {
        localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(DEFAULT_QUEUES));
      }
    } catch {}
  }, []);

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Hapus konfigurasi layar antrian "${name}"?`)) return;
    const updated = queues.filter((q) => q.id !== id);
    setQueues(updated);
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleOpenSimulator = (q: QueueDisplayConfig) => {
    setActiveModalQueue(q);
    const numPart = parseInt(q.currentNumber.replace(/[^0-9]/g, ''), 10) || 1;
    setModalSeq(numPart);
    setModalCurrentNumber(q.currentNumber);
    setModalCounter(q.currentCounter);
  };

  const handleCallNext = () => {
    if (!activeModalQueue) return;
    const nextSeq = modalSeq + 1;
    const newFormatted = `${activeModalQueue.prefix}-${String(nextSeq).padStart(3, '0')}`;
    setModalSeq(nextSeq);
    setModalCurrentNumber(newFormatted);

    if (activeModalQueue.audioChimeEnabled) {
      setIsChiming(true);
      playDingDongChime();
      setTimeout(() => setIsChiming(false), 1500);
    }
  };

  const handleRepeatCall = () => {
    if (!activeModalQueue) return;
    if (activeModalQueue.audioChimeEnabled) {
      setIsChiming(true);
      playDingDongChime();
      setTimeout(() => setIsChiming(false), 1500);
    }
  };

  const filtered = queues.filter(
    (q) =>
      q.name.toLowerCase().includes(search.toLowerCase()) ||
      q.prefix.toLowerCase().includes(search.toLowerCase()) ||
      q.currentCounter.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * limit, page * limit);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Action Bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Nomor Antrian / Tiket
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Layar pemanggil nomor antrian ritel otomatis, audio chime Ding-Dong Web Audio, dan kontrol kasir loket.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href="/studio/components/ticket/create" className="btn btn-primary">
            <Plus size={16} />
            <span>Tambah Layar Antrian Baru</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search */}
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
            placeholder="Cari layar antrian berdasarkan nama, awalan, atau loket..."
            className="form-input"
            style={{ paddingLeft: '36px' }}
          />
        </div>
      </div>

      {/* Table Data */}
      <div className="card-elevated" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Komponen Antrian</th>
                <th>Awalan Tiket</th>
                <th>Nomor Terakhir</th>
                <th>Loket Saat Ini</th>
                <th>Audio Chime</th>
                <th style={{ textAlign: 'right' }}>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                    Belum ada antrian tersimpan. Klik tombol Tambah untuk membuat baru.
                  </td>
                </tr>
              ) : (
                paginated.map((q) => (
                  <tr key={q.id}>
                    <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                      <Link href={`/studio/components/ticket/${q.id}/edit`} style={{ textDecoration: 'none', color: 'inherit' }}>
                        {q.name}
                      </Link>
                    </td>
                    <td>
                      <span
                        style={{
                          padding: '2px 10px',
                          borderRadius: '6px',
                          fontSize: '0.8125rem',
                          fontWeight: 800,
                          backgroundColor: 'rgba(59, 130, 246, 0.12)',
                          color: 'var(--primary-400)',
                          border: '1px solid rgba(59, 130, 246, 0.3)',
                        }}
                      >
                        {q.prefix}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.9375rem', fontWeight: 800, color: '#f59e0b' }}>
                        {q.currentNumber}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                        {q.currentCounter}
                      </span>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '0.75rem',
                          color: q.audioChimeEnabled ? 'var(--accent-emerald)' : 'var(--text-muted)',
                        }}
                      >
                        <Volume2 size={12} />
                        {q.audioChimeEnabled ? 'Chime Aktif (Ding-Dong)' : 'Mute (Hening)'}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenSimulator(q)}
                          className="btn btn-outline"
                          style={{ padding: '5px 8px' }}
                          title="Simulator Panggil Antrian"
                        >
                          <Bell size={14} />
                        </button>
                        <Link
                          href={`/studio/components/ticket/${q.id}/edit`}
                          className="btn btn-secondary"
                          style={{ padding: '5px 8px' }}
                          title="Edit Layar Antrian"
                        >
                          <Edit size={14} />
                        </Link>
                        <button
                          onClick={() => handleDelete(q.id, q.name)}
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
          onPageChange={(p) => setPage(p)}
          onLimitChange={(l) => {
            setLimit(l);
            setPage(1);
          }}
        />
      </div>

      {/* Modal Simulator Panggil Antrian */}
      {activeModalQueue && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            backdropFilter: 'blur(8px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            className="card-elevated"
            style={{
              width: '100%',
              maxWidth: '840px',
              backgroundColor: '#0f172a',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.1)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.8)',
            }}
          >
            {/* Header */}
            <div style={{ padding: '16px 24px', backgroundColor: 'rgba(30, 41, 59, 0.7)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Ticket size={20} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '1rem', color: '#ffffff' }}>
                  Simulator Layar Antrian: {activeModalQueue.name}
                </span>
              </div>
              <button onClick={() => setActiveModalQueue(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={20} />
              </button>
            </div>

            {/* Display Screen Stage */}
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: '520px',
                  backgroundColor: '#0f172a',
                  border: isChiming ? '2px solid #38bdf8' : '2px solid rgba(255,255,255,0.12)',
                  borderRadius: '20px',
                  padding: '28px',
                  textAlign: 'center',
                  boxShadow: isChiming ? '0 0 30px rgba(56, 189, 248, 0.35)' : 'none',
                  transition: 'all 0.3s ease',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8', textTransform: 'uppercase' }}>
                  NOMOR ANTRIAN
                </div>
                <div style={{ fontSize: '4.5rem', fontWeight: 900, letterSpacing: '0.04em', color: '#38bdf8', lineHeight: 1.1, margin: '8px 0' }}>
                  {modalCurrentNumber}
                </div>
                <div style={{ display: 'inline-block', padding: '6px 20px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', color: '#fbbf24', fontSize: '1.25rem', fontWeight: 800 }}>
                  {modalCounter}
                </div>
              </div>

              {/* Marquee Banner */}
              <div style={{ marginTop: '20px', width: '100%', maxWidth: '520px', overflow: 'hidden', whiteSpace: 'nowrap', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '8px 16px', borderRadius: '8px', color: '#94a3b8', fontSize: '0.8125rem' }}>
                <Marquee>{activeModalQueue.marqueeText}</Marquee>
              </div>
            </div>

            {/* Operator Control Panel */}
            <div style={{ padding: '20px 24px', backgroundColor: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <label style={{ fontSize: '0.8125rem', color: '#94a3b8' }}>Meja/Loket:</label>
                <select
                  value={modalCounter}
                  onChange={(e) => setModalCounter(e.target.value)}
                  style={{ backgroundColor: '#1e293b', color: '#ffffff', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '6px 12px', fontSize: '0.8125rem' }}
                >
                  <option value="LOKET 01">LOKET 01</option>
                  <option value="LOKET 02">LOKET 02</option>
                  <option value="LOKET 03">LOKET 03</option>
                  <option value="CUSTOMER SERVICE">CUSTOMER SERVICE</option>
                  <option value="KASIR UTAMA">KASIR UTAMA</option>
                </select>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={handleRepeatCall}
                  className="btn btn-secondary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Volume2 size={16} />
                  <span>Panggil Ulang (Chime)</span>
                </button>
                <button
                  onClick={handleCallNext}
                  className="btn btn-primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Bell size={16} />
                  <span>Panggil Selanjutnya (+1)</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
