'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Ticket, Check, Volume2, Bell, Save, RefreshCw } from 'lucide-react';
import { QUEUE_STORAGE_KEY, DEFAULT_QUEUES, QueueDisplayConfig } from '../../types';

const Marquee = 'marquee' as any;

// Audio chime generator using Web Audio API
function playDingDongChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

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

export default function EditQueueTicketPage() {
  const params = useParams() as { id: string };
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('A');
  const [counter, setCounter] = useState('LOKET 01');
  const [currentNumber, setCurrentNumber] = useState('A-001');
  const [audioChime, setAudioChime] = useState(true);
  const [marqueeText, setMarqueeText] = useState('');
  const [isChiming, setIsChiming] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      const items: QueueDisplayConfig[] = stored ? JSON.parse(stored) : DEFAULT_QUEUES;
      const found = items.find((q) => q.id === params.id);
      if (found) {
        setName(found.name);
        setPrefix(found.prefix);
        setCounter(found.currentCounter);
        setCurrentNumber(found.currentNumber);
        setAudioChime(found.audioChimeEnabled);
        setMarqueeText(found.marqueeText || '');
      } else {
        alert('Layar antrian tidak ditemukan.');
        router.push('/studio/components/ticket');
      }
    } catch {
      router.push('/studio/components/ticket');
    } finally {
      setLoading(false);
    }
  }, [params.id, router]);

  const handleTestChime = () => {
    setIsChiming(true);
    playDingDongChime();
    setTimeout(() => setIsChiming(false), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const stored = localStorage.getItem(QUEUE_STORAGE_KEY);
      const items: QueueDisplayConfig[] = stored ? JSON.parse(stored) : DEFAULT_QUEUES;
      const updated = items.map((q) =>
        q.id === params.id
          ? {
              ...q,
              name: name.trim(),
              prefix,
              currentNumber,
              currentCounter: counter.trim() || 'LOKET 01',
              audioChimeEnabled: audioChime,
              marqueeText: marqueeText.trim(),
            }
          : q
      );
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(updated));
    } catch {}

    router.push('/studio/components/ticket');
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data Layar Antrian...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link href="/studio/components/ticket" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Layar Antrian: {name || params.id}
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Perbarui konfigurasi nomor antrian kasir, awalan kode, loket tujuan, dan efek audio pemanggilan.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(340px, 480px) 1fr', gap: '24px' }}>
        {/* Form Panel */}
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
              placeholder="Contoh: Antrian Loket Customer Service"
              className="form-input"
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Huruf Awalan (Prefix)
              </label>
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="form-select"
              >
                {['A', 'B', 'C', 'D', 'E', 'CS', 'Q'].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nomor Saat Ini
              </label>
              <input
                type="text"
                value={currentNumber}
                onChange={(e) => setCurrentNumber(e.target.value)}
                placeholder="A-001"
                className="form-input"
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Meja / Loket
            </label>
            <input
              type="text"
              value={counter}
              onChange={(e) => setCounter(e.target.value)}
              placeholder="LOKET 01 atau KASIR 03"
              className="form-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Teks Pengumuman di Bawah Layar
            </label>
            <textarea
              rows={2}
              value={marqueeText}
              onChange={(e) => setMarqueeText(e.target.value)}
              placeholder="Silakan persiapkan kartu member Anda..."
              className="form-textarea"
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '10px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                Audio Chime (Ding-Dong)
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Bunyikan nada lonceng 2-nada saat nomor dipanggil
              </div>
            </div>
            <input
              type="checkbox"
              checked={audioChime}
              onChange={(e) => setAudioChime(e.target.checked)}
              style={{ width: '18px', height: '18px', cursor: 'pointer' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <Link href="/studio/components/ticket" className="btn btn-secondary" style={{ flex: 1, textAlign: 'center', textDecoration: 'none' }}>
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
              <Save size={16} />
              <span>Simpan Perubahan</span>
            </button>
          </div>
        </form>

        {/* Live Simulator Stage */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Ticket size={18} color="#38bdf8" /> Pratinjau Tampilan Monitor
            </h2>
            <button
              type="button"
              onClick={handleTestChime}
              className="btn btn-outline"
              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
            >
              <Volume2 size={14} /> Uji Suara Chime
            </button>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: '380px',
              backgroundColor: '#020617',
              borderRadius: '16px',
              border: '2px solid rgba(255,255,255,0.08)',
              padding: '32px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '440px',
                backgroundColor: '#0f172a',
                border: isChiming ? '2px solid #38bdf8' : '2px solid rgba(255,255,255,0.12)',
                borderRadius: '16px',
                padding: '24px',
                textAlign: 'center',
                boxShadow: isChiming ? '0 0 30px rgba(56, 189, 248, 0.4)' : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{ fontSize: '0.8125rem', fontWeight: 800, letterSpacing: '0.1em', color: '#94a3b8' }}>
                NOMOR ANTRIAN
              </div>
              <div style={{ fontSize: '4rem', fontWeight: 900, color: '#38bdf8', margin: '8px 0' }}>
                {currentNumber}
              </div>
              <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: '8px', backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fbbf24', fontSize: '1.125rem', fontWeight: 800 }}>
                {counter || 'LOKET 01'}
              </div>
            </div>

            {marqueeText && (
              <div style={{ marginTop: '20px', width: '100%', maxWidth: '440px', overflow: 'hidden', whiteSpace: 'nowrap', backgroundColor: 'rgba(30, 41, 59, 0.5)', padding: '8px 14px', borderRadius: '8px', color: '#94a3b8', fontSize: '0.75rem' }}>
                <Marquee>{marqueeText}</Marquee>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
