'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import type { Schedule, Layout } from '../../../../lib/api';
import { ArrowLeft, Save, RefreshCw, Trash2, Plus } from 'lucide-react';

export default function EditSchedulePage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [schedule, setSchedule] = useState<Schedule | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  
  // Event state
  const [newEvent, setNewEvent] = useState({
    layout_id: '',
    start_time: '08:00:00',
    end_time: '18:00:00',
    days_of_week: '1,2,3,4,5,6,7',
  });
  const [addingEvent, setAddingEvent] = useState(false);

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const [data, layoutsData] = await Promise.all([
        api.getSchedule(params.id),
        api.getLayouts({ limit: 1000 }),
      ]);
      setSchedule(data);
      setLayouts(layoutsData.data);
      setFormData({
        name: data.name,
        description: data.description || '',
      });
    } catch (err: any) {
      alert(err.message || 'Gagal memuat jadwal');
      router.push('/schedules');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateSchedule(params.id, {
        name: formData.name,
        description: formData.description,
      });
      alert('Tersimpan!');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui jadwal');
    } finally {
      setSaving(false);
    }
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEvent.layout_id) return alert('Pilih layout');
    try {
      setAddingEvent(true);
      await api.addScheduleEvent({
        schedule_id: params.id,
        layout_id: newEvent.layout_id,
        start_time: newEvent.start_time,
        end_time: newEvent.end_time,
        days_of_week: newEvent.days_of_week,
      });
      setNewEvent({ ...newEvent, layout_id: '' });
      fetchSchedule(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Gagal menambah event');
    } finally {
      setAddingEvent(false);
    }
  };

  const handleRemoveEvent = async (eventId: string) => {
    if (!confirm('Hapus event tayang ini?')) return;
    try {
      await api.removeScheduleEvent(eventId, params.id);
      fetchSchedule(); // Refresh
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus event');
    }
  };

  if (loading || !schedule) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data jadwal...</span>
      </div>
    );
  }

  const daysLabel = (daysStr: string) => {
    const map: Record<string, string> = { '1':'Sen', '2':'Sel', '3':'Rab', '4':'Kam', '5':'Jum', '6':'Sab', '7':'Min' };
    return daysStr.split(',').map(d => map[d] || d).join(', ');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/schedules" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Penjadwalan
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ubah nama atau tambahkan event tayang ke dalam jadwal.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', alignItems: 'start' }}>
        
        {/* Info Jadwal */}
        <div className="card-elevated" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Detail Penjadwalan</h3>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Nama Jadwal *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="form-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Deskripsi
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="form-input"
                rows={3}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button type="submit" disabled={saving || !formData.name} className="btn btn-primary">
                <Save size={14} />
                <span>{saving ? 'Menyimpan...' : 'Simpan Detail'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Daftar Event */}
        <div className="card-elevated" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '16px' }}>Daftar Event (Timeline)</h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
            {(!schedule.events || schedule.events.length === 0) ? (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', color: 'var(--text-muted)' }}>
                Belum ada event tayang di jadwal ini.
              </div>
            ) : (
              schedule.events.map(ev => (
                <div key={ev.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{ev.layout_name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      {ev.start_time} - {ev.end_time} &bull; {daysLabel(ev.days_of_week)}
                    </div>
                  </div>
                  <button onClick={() => handleRemoveEvent(ev.id)} className="btn btn-danger" style={{ padding: '6px' }} title="Hapus Event">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))
            )}
          </div>

          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px' }}>Tambah Event Baru</h4>
          <form onSubmit={handleAddEvent} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Layout Terpilih
              </label>
              <select
                required
                value={newEvent.layout_id}
                onChange={(e) => setNewEvent({ ...newEvent, layout_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Pilih Layout --</option>
                {layouts.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Waktu Mulai (HH:MM:SS)
                </label>
                <input
                  type="time"
                  step="1"
                  required
                  value={newEvent.start_time}
                  onChange={(e) => setNewEvent({ ...newEvent, start_time: e.target.value })}
                  className="form-input"
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Waktu Selesai (HH:MM:SS)
                </label>
                <input
                  type="time"
                  step="1"
                  required
                  value={newEvent.end_time}
                  onChange={(e) => setNewEvent({ ...newEvent, end_time: e.target.value })}
                  className="form-input"
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                Hari Tayang
              </label>
              <select
                value={newEvent.days_of_week}
                onChange={(e) => setNewEvent({ ...newEvent, days_of_week: e.target.value })}
                className="form-select"
              >
                <option value="1,2,3,4,5,6,7">Setiap Hari (Senin-Minggu)</option>
                <option value="1,2,3,4,5">Hari Kerja (Senin-Jumat)</option>
                <option value="6,7">Akhir Pekan (Sabtu-Minggu)</option>
              </select>
            </div>

            <button type="submit" disabled={addingEvent || !newEvent.layout_id} className="btn btn-secondary" style={{ marginTop: '8px' }}>
              <Plus size={14} />
              <span>{addingEvent ? 'Menambahkan...' : 'Tambah Event Tayang'}</span>
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
