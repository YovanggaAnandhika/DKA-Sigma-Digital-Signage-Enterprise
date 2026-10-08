'use client';

import React, { useState, useEffect } from 'react';
import { Ticket, Bell, RotateCcw, Volume2, ArrowRight, CheckCircle2, Sliders, Users, Monitor } from 'lucide-react';

interface QueueItem {
  number: string;
  counter: string;
  calledAt: string;
}

const STORAGE_KEY = 'dka_signage_queue_ticket';

export default function QueueTicketManagerTab() {
  const [currentNumber, setCurrentNumber] = useState('A-024');
  const [currentCounter, setCurrentCounter] = useState('LOKET 02');
  const [prefix, setPrefix] = useState('A');
  const [seqNumber, setSeqNumber] = useState(24);
  const [history, setHistory] = useState<QueueItem[]>([
    { number: 'A-023', counter: 'LOKET 01', calledAt: '14:28' },
    { number: 'A-022', counter: 'LOKET 03', calledAt: '14:24' },
    { number: 'A-021', counter: 'LOKET 02', calledAt: '14:19' },
  ]);
  const [marqueeText, setMarqueeText] = useState('Silakan menunggu dengan tertib. Menuju loket yang tertera saat nomor Anda dipanggil.');
  const [isChiming, setIsChiming] = useState(false);

  // Play synthetic pleasant Ding-Dong chime using Web Audio API
  const playChime = () => {
    try {
      setIsChiming(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      const now = audioCtx.currentTime;
      // Tone 1: 660 Hz (E5)
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

      // Tone 2: 523 Hz (C5)
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

  const handleNextCall = () => {
    const nextSeq = seqNumber + 1;
    const formatted = `${prefix}-${String(nextSeq).padStart(3, '0')}`;
    const nowTime = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });

    setHistory((prev) => [
      { number: currentNumber, counter: currentCounter, calledAt: nowTime },
      ...prev.slice(0, 3),
    ]);

    setSeqNumber(nextSeq);
    setCurrentNumber(formatted);
    playChime();
  };

  const handleRecall = () => {
    playChime();
  };

  const handleReset = () => {
    if (!confirm('Reset nomor antrian kembali ke nomor 1?')) return;
    setSeqNumber(1);
    setCurrentNumber(`${prefix}-001`);
    setHistory([]);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Komponen Nomor Antrian & Tiket (Calling Screen)
          </h2>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Tampilkan nomor antrian aktif, penunjuk loket/kasir, riwayat panggilan, dan bunyi bel (Audio Chime) di layar promosi.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button onClick={handleRecall} className="btn btn-secondary">
            <Volume2 size={14} className={isChiming ? 'animate-bounce' : ''} />
            <span>Panggil Ulang (Recall)</span>
          </button>
          <button onClick={handleNextCall} className="btn btn-primary">
            <Bell size={14} />
            <span>Panggil Nomor Berikutnya (+1)</span>
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 360px) 1fr', gap: '24px' }}>
        {/* Left: Backoffice Operator Control Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="card-elevated" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Sliders size={16} style={{ color: 'var(--primary-400)' }} />
              <span>Kontrol Panggilan Antrian</span>
            </h3>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Pilih Loket / Meja Kasir
              </label>
              <select
                value={currentCounter}
                onChange={(e) => setCurrentCounter(e.target.value)}
                className="form-input"
              >
                <option value="LOKET 01">Loket 01 (Layanan Umum)</option>
                <option value="LOKET 02">Loket 02 (Kasir Cepat)</option>
                <option value="LOKET 03">Loket 03 (Customer Service)</option>
                <option value="LOKET 04">Loket 04 (Pengambilan Barang)</option>
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Prefix Huruf
                </label>
                <select
                  value={prefix}
                  onChange={(e) => {
                    const newPref = e.target.value;
                    setPrefix(newPref);
                    setCurrentNumber(`${newPref}-${String(seqNumber).padStart(3, '0')}`);
                  }}
                  className="form-input"
                >
                  <option value="A">A (Reguler)</option>
                  <option value="B">B (Prioritas)</option>
                  <option value="C">C (VIP)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Nomor Urut Manual
                </label>
                <input
                  type="number"
                  min={1}
                  max={999}
                  value={seqNumber}
                  onChange={(e) => {
                    const num = Number(e.target.value);
                    setSeqNumber(num);
                    setCurrentNumber(`${prefix}-${String(num).padStart(3, '0')}`);
                  }}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Teks Informasi Berjalan (Footer Display)
              </label>
              <textarea
                rows={2}
                value={marqueeText}
                onChange={(e) => setMarqueeText(e.target.value)}
                className="form-input"
                style={{ resize: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                onClick={handleNextCall}
                className="btn btn-primary"
                style={{ flex: 1 }}
              >
                <Bell size={14} />
                <span>Panggil Sekarang</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn btn-secondary"
                title="Reset ke nomor awal"
              >
                <RotateCcw size={14} />
              </button>
            </div>
          </div>

          {/* Recent Call Records */}
          <div className="card-elevated" style={{ padding: '16px' }}>
            <h4 style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '10px' }}>
              Riwayat 3 Panggilan Terakhir
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {history.map((h, i) => (
                <div
                  key={i}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    backgroundColor: 'var(--bg-surface-elevated)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '0.75rem',
                  }}
                >
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{h.number}</span>
                  <span style={{ color: 'var(--accent-emerald)', fontWeight: 600 }}>{h.counter}</span>
                  <span style={{ color: 'var(--text-muted)' }}>{h.calledAt}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Simulated Real-Time Calling Display */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Pratinjau Layar Display Antrian Toko (16:9)
            </span>
            <span
              style={{
                fontSize: '0.6875rem',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '4px',
                backgroundColor: isChiming ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.12)',
                color: isChiming ? '#f87171' : '#34d399',
                border: `1px solid ${isChiming ? 'rgba(239, 68, 68, 0.4)' : 'rgba(16, 185, 129, 0.25)'}`,
              }}
            >
              {isChiming ? '🔔 MENYIARKAN BEL...' : '● STANDBY'}
            </span>
          </div>

          {/* Physical TV Display Screen Mockup */}
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '460px',
              borderRadius: '16px',
              backgroundColor: '#050714',
              backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(30, 58, 138, 0.3) 0%, #030712 80%)',
              border: '2px solid rgba(59, 130, 246, 0.3)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            }}
          >
            {/* Display Header */}
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.02)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Ticket size={24} style={{ color: '#60a5fa' }} />
                <span style={{ fontSize: '1.125rem', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em' }}>
                  ANTRIAN PELANGGAN RETAIL
                </span>
              </div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 600 }}>
                {new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
              </div>
            </div>

            {/* Main Stage: Large Called Number & Counter */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                position: 'relative',
              }}
            >
              <span style={{ fontSize: '1rem', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
                NOMOR ANTRIAN DIPANGGIL
              </span>

              <div
                style={{
                  fontSize: '5.5rem',
                  fontWeight: 900,
                  color: '#ffffff',
                  letterSpacing: '0.04em',
                  fontFamily: 'monospace',
                  textShadow: '0 0 40px rgba(59, 130, 246, 0.7)',
                  animation: isChiming ? 'pulse 0.6s infinite' : 'none',
                }}
              >
                {currentNumber}
              </div>

              <div
                style={{
                  padding: '10px 32px',
                  borderRadius: '9999px',
                  backgroundColor: 'rgba(37, 99, 235, 0.3)',
                  border: '2px solid rgba(96, 165, 250, 0.6)',
                  color: '#93c5fd',
                  fontSize: '1.5rem',
                  fontWeight: 900,
                  letterSpacing: '0.08em',
                  boxShadow: '0 4px 20px rgba(37, 99, 235, 0.3)',
                }}
              >
                {currentCounter}
              </div>
            </div>

            {/* Bottom History Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                borderTop: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              {history.slice(0, 3).map((item, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '10px 16px',
                    textAlign: 'center',
                    borderRight: idx < 2 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                  }}
                >
                  <div style={{ fontSize: '0.6875rem', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                    Panggilan Sebelumnya
                  </div>
                  <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#e2e8f0', fontFamily: 'monospace' }}>
                    {item.number}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#60a5fa', fontWeight: 700 }}>
                    {item.counter}
                  </div>
                </div>
              ))}
            </div>

            {/* Marquee Footer */}
            <div
              style={{
                backgroundColor: '#1e3a8a',
                color: '#e0e7ff',
                padding: '6px 16px',
                fontSize: '0.75rem',
                fontWeight: 600,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
              }}
            >
              <div style={{ display: 'inline-block', animation: 'marquee 15s linear infinite' }}>
                📢 {marqueeText}
              </div>
            </div>
          </div>

          <style jsx>{`
            @keyframes marquee {
              0% {
                transform: translateX(100%);
              }
              100% {
                transform: translateX(-100%);
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}
