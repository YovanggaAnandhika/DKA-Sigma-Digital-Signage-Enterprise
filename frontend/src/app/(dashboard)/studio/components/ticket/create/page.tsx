'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Ticket, Check, Volume2, Bell } from 'lucide-react';
import { QUEUE_STORAGE_KEY, DEFAULT_QUEUES, QueueDisplayConfig } from '../types';

export default function CreateQueueTicketPage() {
  const router = useRouter();

  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('A');
  const [counter, setCounter] = useState('LOKET 01');
  const [startNumber, setStartNumber] = useState(1);
  const [audioChime, setAudioChime] = useState(true);
  const [marqueeText, setMarqueeText] = useState('Silakan menunggu nomor Anda dipanggil pada layar monitor.');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const formattedNumber = `${prefix}-${String(startNumber).padStart(3, '0')}`;

    const newQueue: QueueDisplayConfig = {
      id: `q-${Date.now()}`,
      name: name.trim(),
      prefix,
      currentNumber: formattedNumber,
      currentCounter: counter.trim() || 'LOKET 01',
      audioChimeEnabled: audioChime,
      marqueeText: marqueeText.trim(),
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      const existing: QueueDisplayConfig[] = stored ? JSON.parse(stored) : DEFAULT_QUEUES;
      const updated = [newQueue, ...existing];
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components/ticket');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/ticket" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Tambah Layar Antrian Baru
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Konfigurasikan sistem pemanggil nomor antrian ritel dan penunjuk meja kasir/loket pelayanan.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: '640px', width: '100%' }}>
        <form onSubmit={handleSubmit} className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            Konfigurasi Antrian
          </h2>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Layar Antrian
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Antrian Customer Care & Retur"
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Prefix Huruf Nomor
              </label>
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="form-input"
              >
                <option value="A">A (Reguler / Umum)</option>
                <option value="B">B (Kasir / Pembayaran)</option>
                <option value="C">C (Customer Service)</option>
                <option value="D">D (Prioritas / VIP)</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Loket Default
              </label>
              <input
                type="text"
                value={counter}
                onChange={(e) => setCounter(e.target.value)}
                placeholder="LOKET 01"
                className="form-input"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nomor Urut Permulaan
            </label>
            <input
              type="number"
              min={1}
              max={999}
              value={startNumber}
              onChange={(e) => setStartNumber(Number(e.target.value))}
              className="form-input"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Pesan Informasi Berjalan di Bawah Layar
            </label>
            <textarea
              rows={2}
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              placeholder="Pesan berjalan yang dibaca pengunjung"
              className="form-input"
              style={{ resize: 'none' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0' }}>
            <div>
              <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                Bunyikan Bel (Audio Chime) Saat Dipanggil
              </div>
              <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                Memutar nada bel ganda Ding-Dong saat nomor ditekan di backoffice
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioChime}
              onChange={(e) => setAudioChime(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
            <Link href="/studio/components?tab=ticket" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Check size={16} />
              <span>Simpan Layar Antrian</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
