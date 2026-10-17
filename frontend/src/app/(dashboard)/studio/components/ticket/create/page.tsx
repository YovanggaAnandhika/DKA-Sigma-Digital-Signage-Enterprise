'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Ticket,
  Volume2,
  Save,
  Plus,
  Trash2,
  FolderOpen,
  Music,
  Layout,
  MessageSquare,
  Users,
  Sparkles,
  Play,
} from 'lucide-react';
import {
  QUEUE_STORAGE_KEY,
  DEFAULT_QUEUES,
  QueueDisplayConfig,
  QueueCounter,
  QueueAudio,
  createDefaultQueueLayoutItems,
  injectQueueVariables,
} from '../types';
import QueueAudioPickerModal from '../components/QueueAudioPickerModal';

const Marquee = 'marquee' as any;

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

export default function CreateQueueTicketPage() {
  const router = useRouter();

  // Active Tab in Sidebar Controls
  const [activeTab, setActiveTab] = useState<'layout' | 'marquee' | 'counters' | 'audio'>('layout');

  // General Setup
  const [name, setName] = useState('');
  const [prefix, setPrefix] = useState('A');
  const [startNumber, setStartNumber] = useState(1);
  const [themePreset, setThemePreset] = useState<'clean-light' | 'solid-dark' | 'medical-green' | 'executive-blue'>('clean-light');

  // Colors & Styling
  const [backgroundColor, setBackgroundColor] = useState('#f8fafc');
  const [cardBackgroundColor, setCardBackgroundColor] = useState('#ffffff');
  const [primaryColor, setPrimaryColor] = useState('#0284c7');
  const [textColor, setTextColor] = useState('#0f172a');
  const [counterBgColor, setCounterBgColor] = useState('#f59e0b');

  // Templates with variables
  const [numberTemplate, setNumberTemplate] = useState('$queue_number$');
  const [counterTemplate, setCounterTemplate] = useState('LOKET: $queue_counter$');

  // Marquee Setup
  const [showMarquee, setShowMarquee] = useState(true);
  const [marqueeText, setMarqueeText] = useState('PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil. Terima kasih.');
  const [marqueeSpeed, setMarqueeSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [marqueeBgColor, setMarqueeBgColor] = useState('#0f172a');
  const [marqueeTextColor, setMarqueeTextColor] = useState('#ffffff');

  // Multi-Counter Management
  const [counters, setCounters] = useState<QueueCounter[]>([
    { id: 'c-1', counterNumber: 1, counterName: 'LOKET 01', operatorName: 'Kasir Utama', isActive: true, currentTicketNumber: 'A-001' },
    { id: 'c-2', counterNumber: 2, counterName: 'LOKET 02', operatorName: 'Customer Service', isActive: true, currentTicketNumber: 'A-002' },
  ]);
  const [activeSimCounterId, setActiveSimCounterId] = useState('c-1');

  // Audio Setup
  const [audioChimeEnabled, setAudioChimeEnabled] = useState(true);
  const [audioItem, setAudioItem] = useState<QueueAudio>({
    id: 'aud-default',
    name: 'Ding Dong Standar (Synthesizer)',
    audioType: 'preset',
    volumePercent: 80,
    isActive: true,
  });
  const [isAudioPickerOpen, setIsAudioPickerOpen] = useState(false);
  const [isChiming, setIsChiming] = useState(false);

  // Theme preset change handler
  const handleApplyTheme = (preset: 'clean-light' | 'solid-dark' | 'medical-green' | 'executive-blue') => {
    setThemePreset(preset);
    if (preset === 'clean-light') {
      setBackgroundColor('#f8fafc');
      setCardBackgroundColor('#ffffff');
      setPrimaryColor('#0284c7');
      setTextColor('#0f172a');
      setCounterBgColor('#f59e0b');
      setMarqueeBgColor('#0f172a');
      setMarqueeTextColor('#ffffff');
    } else if (preset === 'solid-dark') {
      setBackgroundColor('#020617');
      setCardBackgroundColor('#0f172a');
      setPrimaryColor('#38bdf8');
      setTextColor('#f8fafc');
      setCounterBgColor('#fbbf24');
      setMarqueeBgColor('#020617');
      setMarqueeTextColor('#94a3b8');
    } else if (preset === 'medical-green') {
      setBackgroundColor('#f0fdf4');
      setCardBackgroundColor('#ffffff');
      setPrimaryColor('#059669');
      setTextColor('#064e3b');
      setCounterBgColor('#0d9488');
      setMarqueeBgColor('#065f46');
      setMarqueeTextColor('#ffffff');
    } else if (preset === 'executive-blue') {
      setBackgroundColor('#0b1329');
      setCardBackgroundColor('#132042');
      setPrimaryColor('#60a5fa');
      setTextColor('#ffffff');
      setCounterBgColor('#3b82f6');
      setMarqueeBgColor('#080d1a');
      setMarqueeTextColor('#fcd34d');
    }
  };

  // Sound test
  const handleTestCall = () => {
    setIsChiming(true);
    if (audioItem.audioType === 'media_item' && audioItem.fileUrl) {
      const snd = new Audio(audioItem.fileUrl);
      snd.volume = audioItem.volumePercent / 100;
      snd.play().catch(() => playDingDongChime());
    } else {
      playDingDongChime();
    }
    setTimeout(() => setIsChiming(false), 1400);
  };

  // Add new counter
  const handleAddCounter = () => {
    const nextNum = counters.length + 1;
    const newC: QueueCounter = {
      id: `c-${Date.now()}`,
      counterNumber: nextNum,
      counterName: `LOKET ${String(nextNum).padStart(2, '0')}`,
      operatorName: `Petugas ${nextNum}`,
      isActive: true,
      currentTicketNumber: `${prefix}-${String(startNumber).padStart(3, '0')}`,
    };
    setCounters([...counters, newC]);
  };

  const handleRemoveCounter = (id: string) => {
    if (counters.length <= 1) return;
    setCounters(counters.filter((c) => c.id !== id));
  };

  // Calculate live values
  const activeCounter = counters.find((c) => c.id === activeSimCounterId) || counters[0] || { counterName: 'LOKET 01', operatorName: 'Petugas' };
  const formattedNumber = `${prefix}-${String(startNumber).padStart(3, '0')}`;

  const evaluatedNumber = injectQueueVariables(numberTemplate, {
    queueNumber: formattedNumber,
    queueCounter: activeCounter.counterName,
    queuePrefix: prefix,
    queueName: name || 'Antrian Pelayanan',
    operatorName: activeCounter.operatorName,
    waitingCount: counters.length * 2,
  });

  const evaluatedCounter = injectQueueVariables(counterTemplate, {
    queueNumber: formattedNumber,
    queueCounter: activeCounter.counterName,
    queuePrefix: prefix,
    queueName: name || 'Antrian Pelayanan',
    operatorName: activeCounter.operatorName,
  });

  const evaluatedMarquee = injectQueueVariables(marqueeText, {
    queueNumber: formattedNumber,
    queueCounter: activeCounter.counterName,
    queuePrefix: prefix,
    queueName: name || 'Antrian Pelayanan',
    operatorName: activeCounter.operatorName,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newQueue: QueueDisplayConfig = {
      id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `a0000000-0000-0000-0000-${Date.now().toString().padStart(12, '0')}`,
      name: name.trim(),
      prefix,
      currentNumber: formattedNumber,
      currentCounter: activeCounter.counterName,
      audioChimeEnabled,
      marqueeText: marqueeText.trim(),
      canvasWidth: 1920,
      canvasHeight: 1080,
      backgroundColor,
      themePreset,
      autoRecallEnabled: false,
      items: createDefaultQueueLayoutItems(themePreset),
      counters,
      audios: [audioItem],
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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link href="/studio/components/ticket" className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
              Desain Tata Letak Antrian Baru
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Atur komposisi visual antrian, integrasi audio custom MP3, penambahan loket, dan injeksi variabel otomatis.
            </p>
          </div>
        </div>

        <button type="button" onClick={handleSubmit} className="btn btn-primary" style={{ padding: '8px 20px' }}>
          <Save size={16} />
          <span>Simpan Tata Letak Antrian</span>
        </button>
      </div>

      {/* Full-Width Grid: Editor Panel (Left) & Live Canvas Preview (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(420px, 480px) 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Left Side: Property Tabs */}
        <div className="card-elevated" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {/* Sub-Tabs Navigation */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', backgroundColor: 'var(--bg-secondary)' }}>
            {[
              { key: 'layout', label: 'Tata Letak', icon: Layout },
              { key: 'marquee', label: 'Running Text', icon: MessageSquare },
              { key: 'counters', label: 'Daftar Loket', icon: Users },
              { key: 'audio', label: 'Audio & Chime', icon: Volume2 },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key as any)}
                  style={{
                    flex: 1,
                    padding: '12px 8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    fontWeight: isActive ? 700 : 500,
                    color: isActive ? 'var(--primary-600)' : 'var(--text-muted)',
                    backgroundColor: isActive ? 'var(--bg-surface)' : 'transparent',
                    border: 'none',
                    borderBottom: isActive ? '2px solid var(--primary-600)' : '2px solid transparent',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <Icon size={16} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* TAB 1: TATA LETAK & KONTEN */}
            {activeTab === 'layout' && (
              <>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Nama Tata Letak Antrian
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Contoh: Antrian Loket Kasir & CS 1080p"
                    className="form-input"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Prefix Huruf
                    </label>
                    <select value={prefix} onChange={(e) => setPrefix(e.target.value)} className="form-select">
                      <option value="A">A (Reguler / Umum)</option>
                      <option value="B">B (Kasir / Pembayaran)</option>
                      <option value="C">C (Customer Care)</option>
                      <option value="D">D (Prioritas / VIP)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                      Nomor Permulaan
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={startNumber}
                      onChange={(e) => setStartNumber(Math.max(1, Number(e.target.value)))}
                      className="form-input"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Preset Tema Signage Solid (Tanpa Dark Glassmorphism)
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                    {[
                      { key: 'clean-light', label: 'Clean Light Retail', bg: '#ffffff', color: '#0284c7' },
                      { key: 'solid-dark', label: 'Solid Slate Dark', bg: '#020617', color: '#38bdf8' },
                      { key: 'medical-green', label: 'Medical Clinic Green', bg: '#f0fdf4', color: '#059669' },
                      { key: 'executive-blue', label: 'Executive Navy Blue', bg: '#0b1329', color: '#60a5fa' },
                    ].map((preset) => {
                      const isSel = themePreset === preset.key;
                      return (
                        <button
                          key={preset.key}
                          type="button"
                          onClick={() => handleApplyTheme(preset.key as any)}
                          style={{
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: isSel ? '2px solid var(--primary-600)' : '1px solid var(--border-subtle)',
                            backgroundColor: preset.bg,
                            color: preset.color,
                            fontWeight: 700,
                            fontSize: '0.75rem',
                            textAlign: 'left',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <span>{preset.label}</span>
                          {isSel && <Sparkles size={14} />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Warna Background Canvas
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                      <input type="text" value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} className="form-input" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Warna Kartu Nomor
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={cardBackgroundColor} onChange={(e) => setCardBackgroundColor(e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                      <input type="text" value={cardBackgroundColor} onChange={(e) => setCardBackgroundColor(e.target.value)} className="form-input" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                    </div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Format Template Nomor Antrian
                    </label>
                    <button
                      type="button"
                      onClick={() => setNumberTemplate((prev) => prev + '$queue_number$')}
                      style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', border: 'none', cursor: 'pointer' }}
                    >
                      +$queue_number$
                    </button>
                  </div>
                  <input
                    type="text"
                    value={numberTemplate}
                    onChange={(e) => setNumberTemplate(e.target.value)}
                    placeholder="Contoh: $queue_number$"
                    className="form-input"
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Format Template Meja / Loket
                    </label>
                    <button
                      type="button"
                      onClick={() => setCounterTemplate((prev) => prev + '$queue_counter$')}
                      style={{ fontSize: '0.6875rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', cursor: 'pointer' }}
                    >
                      +$queue_counter$
                    </button>
                  </div>
                  <input
                    type="text"
                    value={counterTemplate}
                    onChange={(e) => setCounterTemplate(e.target.value)}
                    placeholder="Contoh: $queue_counter$"
                    className="form-input"
                  />
                </div>
              </>
            )}

            {/* TAB 2: MARQUEE (RUNNING TEXT) */}
            {activeTab === 'marquee' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      Tampilkan Running Text (Marquee)
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Teks pengumuman berjalan di bagian bawah layar
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={showMarquee}
                    onChange={(e) => setShowMarquee(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      Teks Pengumuman Marquee
                    </label>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button
                        type="button"
                        onClick={() => setMarqueeText((prev) => prev + ' $queue_number$')}
                        style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', backgroundColor: 'var(--primary-100)', color: 'var(--primary-700)', border: 'none', cursor: 'pointer' }}
                      >
                        +$queue_number$
                      </button>
                      <button
                        type="button"
                        onClick={() => setMarqueeText((prev) => prev + ' $queue_counter$')}
                        style={{ fontSize: '0.625rem', fontWeight: 700, padding: '2px 5px', borderRadius: '4px', backgroundColor: '#fef3c7', color: '#b45309', border: 'none', cursor: 'pointer' }}
                      >
                        +$queue_counter$
                      </button>
                    </div>
                  </div>
                  <textarea
                    rows={3}
                    value={marqueeText}
                    onChange={(e) => setMarqueeText(e.target.value)}
                    placeholder="PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil..."
                    className="form-textarea"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Kecepatan Marquee
                    </label>
                    <select value={marqueeSpeed} onChange={(e) => setMarqueeSpeed(e.target.value as any)} className="form-select">
                      <option value="slow">Lambat (Halus)</option>
                      <option value="normal">Normal</option>
                      <option value="fast">Cepat</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Warna Background Marquee
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input type="color" value={marqueeBgColor} onChange={(e) => setMarqueeBgColor(e.target.value)} style={{ width: '36px', height: '36px', padding: 0, border: 'none', cursor: 'pointer', borderRadius: '4px' }} />
                      <input type="text" value={marqueeBgColor} onChange={(e) => setMarqueeBgColor(e.target.value)} className="form-input" style={{ fontFamily: 'monospace', fontSize: '0.75rem' }} />
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* TAB 3: DAFTAR MEJA / LOKET */}
            {activeTab === 'counters' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                      Meja / Loket Pelayanan ({counters.length} Loket)
                    </h3>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '2px 0 0 0' }}>
                      Kelola loket yang dapat memanggil nomor antrian pada layout ini.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCounter}
                    className="btn btn-outline"
                    style={{ fontSize: '0.75rem', padding: '6px 10px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Plus size={14} /> Tambah Loket
                  </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '350px', overflowY: 'auto' }}>
                  {counters.map((c, idx) => (
                    <div
                      key={c.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: 'var(--bg-secondary)',
                        border: '1px solid var(--border-subtle)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '10px',
                      }}
                    >
                      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                        <input
                          type="text"
                          value={c.counterName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCounters(counters.map((item) => (item.id === c.id ? { ...item, counterName: val } : item)));
                          }}
                          placeholder="Nama Loket"
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                        />
                        <input
                          type="text"
                          value={c.operatorName || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCounters(counters.map((item) => (item.id === c.id ? { ...item, operatorName: val } : item)));
                          }}
                          placeholder="Nama Petugas"
                          className="form-input"
                          style={{ padding: '6px 8px', fontSize: '0.8125rem' }}
                        />
                      </div>

                      {counters.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveCounter(c.id)}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
                          title="Hapus Loket"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* TAB 4: AUDIO PANGGILAN / CHIME */}
            {activeTab === 'audio' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', borderRadius: '8px', backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--text-primary)' }}>
                      Audio Chime Bel Panggilan
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Bunyikan nada lonceng saat operator memanggil nomor
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={audioChimeEnabled}
                    onChange={(e) => setAudioChimeEnabled(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                </div>

                <div className="card-elevated" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Music size={16} color="var(--primary-500)" />
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        Sumber Audio Chime: {audioItem.name}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAudioPickerOpen(true)}
                      className="btn btn-outline"
                      style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                    >
                      <FolderOpen size={14} style={{ marginRight: '4px' }} /> Pilih dari Pustaka Media
                    </button>
                  </div>

                  {audioItem.fileUrl && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      File: {audioItem.fileUrl}
                    </div>
                  )}

                  {audioItem.audioType === 'media_item' && (
                    <button
                      type="button"
                      onClick={() =>
                        setAudioItem({
                          id: 'aud-default',
                          name: 'Ding Dong Standar (Synthesizer)',
                          audioType: 'preset',
                          volumePercent: 80,
                          isActive: true,
                        })
                      }
                      style={{ fontSize: '0.6875rem', color: 'var(--primary-600)', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer', padding: 0 }}
                    >
                      Kembalikan ke Nada Lonceng Bawaan
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Side: Full-Width Real-time Interactive Monitor Canvas */}
        <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <h2 style={{ fontSize: '1rem', fontWeight: 700, margin: 0, color: 'var(--text-primary)' }}>
                Pratinjau Layar Monitor Antrian (Live 16:9 Canvas)
              </h2>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {/* Counter Simulator selector */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Simulasi Panggil:</span>
                <select
                  value={activeSimCounterId}
                  onChange={(e) => setActiveSimCounterId(e.target.value)}
                  className="form-select"
                  style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                >
                  {counters.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.counterName} ({c.operatorName || 'Petugas'})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleTestCall}
                className="btn btn-outline"
                style={{ padding: '6px 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                <Play size={14} color="#10b981" /> Uji Panggil Tiket
              </button>
            </div>
          </div>

          {/* Canvas Render Container (Solid, High-Contrast Signage Canvas) */}
          <div
            style={{
              width: '100%',
              aspectRatio: '16 / 9',
              backgroundColor: backgroundColor,
              borderRadius: '12px',
              border: '2px solid var(--border-subtle)',
              position: 'relative',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header Title */}
            <div
              style={{
                padding: '24px 32px 0 32px',
                textAlign: 'center',
                fontSize: '1.5rem',
                fontWeight: 900,
                letterSpacing: '0.02em',
                color: primaryColor,
              }}
            >
              {name || 'SISTEM ANTRIAN RETAIL'}
            </div>

            {/* Central Stage: Number Card & Counter Badge */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
              {/* Solid Ticket Number Card (No blurry glassmorphism) */}
              <div
                style={{
                  width: '100%',
                  maxWidth: '560px',
                  backgroundColor: cardBackgroundColor,
                  borderRadius: '16px',
                  border: isChiming ? `3px solid ${primaryColor}` : `2px solid ${themePreset === 'solid-dark' ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                  padding: '28px 20px',
                  textAlign: 'center',
                  boxShadow: isChiming ? `0 0 40px ${primaryColor}66` : '0 10px 15px -3px rgba(0,0,0,0.06)',
                  transform: isChiming ? 'scale(1.03)' : 'scale(1)',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <div style={{ fontSize: '0.875rem', fontWeight: 800, letterSpacing: '0.12em', color: themePreset === 'solid-dark' ? '#94a3b8' : '#64748b' }}>
                  NOMOR ANTRIAN DIPANGGIL
                </div>

                {/* Big Number */}
                <div style={{ fontSize: '5rem', fontWeight: 900, color: primaryColor, margin: '8px 0', lineHeight: 1, letterSpacing: '0.05em' }}>
                  {evaluatedNumber}
                </div>

                {/* Counter Badge */}
                <div
                  style={{
                    display: 'inline-block',
                    padding: '8px 24px',
                    borderRadius: '10px',
                    backgroundColor: counterBgColor,
                    color: '#ffffff',
                    fontSize: '1.25rem',
                    fontWeight: 900,
                    letterSpacing: '0.05em',
                    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
                  }}
                >
                  {evaluatedCounter}
                </div>
              </div>
            </div>

            {/* Bottom Marquee Running Text */}
            {showMarquee && (
              <div
                style={{
                  width: '100%',
                  backgroundColor: marqueeBgColor,
                  color: marqueeTextColor,
                  padding: '10px 20px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  fontSize: '0.875rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <Marquee scrollamount={marqueeSpeed === 'slow' ? 3 : marqueeSpeed === 'fast' ? 9 : 6}>
                  {evaluatedMarquee}
                </Marquee>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Audio Picker Modal */}
      <QueueAudioPickerModal
        isOpen={isAudioPickerOpen}
        onClose={() => setIsAudioPickerOpen(false)}
        onSelectAudio={(selected) => {
          setAudioItem({
            id: `aud-${Date.now()}`,
            name: selected.name,
            audioType: 'media_item',
            mediaItemId: selected.mediaItemId,
            fileUrl: selected.fileUrl,
            volumePercent: 85,
            isActive: true,
          });
        }}
      />
    </div>
  );
}
