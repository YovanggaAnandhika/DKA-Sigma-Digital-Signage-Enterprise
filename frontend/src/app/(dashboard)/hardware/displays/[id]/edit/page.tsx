'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Device, DisplayGroup, Schedule, Layout } from '@/lib/services';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

export default function EditDisplayPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    resolution: '1920x1080',
    orientation: 'landscape',
    timezone: 'Asia/Jakarta',
    displayGroupId: '',
    schedule_id: '',
    current_layout_id: '',
    power_schedule_enabled: false,
    sleep_time: '22:00:00',
    wake_time: '06:00:00',
  });

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true);
        const [data, groupsData, schedulesData, layoutsData] = await Promise.all([
          api.getDevice(params.id),
          api.getDisplayGroups({ limit: 1000 }),
          api.getSchedules({ limit: 1000 }),
          api.getLayouts({ limit: 1000 }),
        ]);
        setDevice(data);
        setGroups(groupsData.data);
        setSchedules(schedulesData.data);
        setLayouts(layoutsData.data);
        setFormData({
          name: data.name,
          resolution: data.screenWidth && data.screenHeight ? `${data.screenWidth}x${data.screenHeight}` : '1920x1080',
          orientation: String(data.orientation) === '2' ? 'portrait' : 'landscape',
          timezone: data.timezone || 'Asia/Jakarta',
          displayGroupId: data.displayGroupId || '',
          schedule_id: data.scheduleId || '',
          current_layout_id: data.currentLayoutId || '',
          power_schedule_enabled: Boolean(data.powerScheduleEnabled),
          sleep_time: data.sleepTime || '22:00:00',
          wake_time: data.wakeTime || '06:00:00',
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat display');
        router.push('/hardware/displays');
      } finally {
        setLoading(false);
      }
    };
    fetchDevice();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const [sw, sh] = (formData.resolution || '1920x1080').split('x').map(Number);
      const orientationVal = formData.orientation === 'portrait' ? 2 : 1;
      await api.updateDevice(params.id, {
        name: formData.name,
        screen_width: sw || 1920,
        screen_height: sh || 1080,
        orientation: orientationVal,
        timezone: formData.timezone,
        display_group_id: formData.displayGroupId || undefined,
        schedule_id: formData.schedule_id || undefined,
        current_layout_id: formData.current_layout_id || undefined,
        power_schedule_enabled: formData.power_schedule_enabled,
        sleep_time: formData.power_schedule_enabled ? formData.sleep_time : undefined,
        wake_time: formData.power_schedule_enabled ? formData.wake_time : undefined,
      });
      router.push(`/hardware/displays/${params.id}`);
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui konfigurasi display');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !device) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data display...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href={`/hardware/displays/${params.id}`} className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Konfigurasi Display
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Perbarui nama atau preferensi resolusi display player di database.
          </p>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Display / Lokasi Layar
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="form-input"
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Preset Resolusi Layar
              </label>
              <select
                value={formData.resolution}
                onChange={(e) => setFormData({ ...formData, resolution: e.target.value })}
                className="form-select"
              >
                <option value="1920x1080">1920 × 1080</option>
                <option value="3840x2160">3840 × 2160</option>
                <option value="1280x720">1280 × 720</option>
                <option value="1080x1920">1080 × 1920</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Orientasi Fisik
              </label>
              <select
                value={formData.orientation}
                onChange={(e) => setFormData({ ...formData, orientation: e.target.value })}
                className="form-select"
              >
                <option value="landscape">Landscape</option>
                <option value="portrait">Portrait</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Layout Utama Layar (Default Layout)
              </label>
              <select
                value={formData.current_layout_id}
                onChange={(e) => setFormData({ ...formData, current_layout_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Gunakan Layout Grup atau Kosong --</option>
                {layouts.map(l => (
                  <option key={l.id} value={l.id}>{l.name} ({l.canvasWidth}×{l.canvasHeight})</option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Layout ini diputar otomatis jika tidak ada jadwal aktif.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Jadwal Perangkat (Schedule Override)
              </label>
              <select
                value={formData.schedule_id}
                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Gunakan Jadwal Grup / Tanpa Jadwal --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Event tayang dalam jadwal ini mengesampingkan layout utama.
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Zona Waktu (Timezone)
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="form-select"
              >
                <option value="Asia/Jakarta">WIB · Asia/Jakarta</option>
                <option value="Asia/Makassar">WITA · Asia/Makassar</option>
                <option value="Asia/Jayapura">WIT · Asia/Jayapura</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Grup Layar (Display Group)
              </label>
              <select
                value={formData.displayGroupId}
                onChange={(e) => setFormData({ ...formData, displayGroupId: e.target.value })}
                className="form-select"
              >
                <option value="">-- Tidak Tergabung --</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Power Schedule / CEC Eco Mode */}
          <div style={{ padding: '16px', borderRadius: '8px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border-subtle)', marginTop: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: formData.power_schedule_enabled ? '14px' : '0' }}>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  Otomasi Jadwal Daya Layar (CEC / Standby)
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Matikan tampilan pada jam malam dan hidupkan otomatis saat jam buka untuk menghemat energi.
                </div>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={formData.power_schedule_enabled}
                  onChange={(e) => setFormData({ ...formData, power_schedule_enabled: e.target.checked })}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--primary-500)', cursor: 'pointer' }}
                />
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: formData.power_schedule_enabled ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                  {formData.power_schedule_enabled ? 'Aktif' : 'Nonaktif'}
                </span>
              </label>
            </div>

            {formData.power_schedule_enabled && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Jam Tidur / Standby (Sleep Time)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={formData.sleep_time}
                    onChange={(e) => setFormData({ ...formData, sleep_time: e.target.value })}
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Layar masuk mode standby dan mematikan backlight.
                  </span>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>
                    Jam Bangun (Wake Time)
                  </label>
                  <input
                    type="time"
                    step="1"
                    value={formData.wake_time}
                    onChange={(e) => setFormData({ ...formData, wake_time: e.target.value })}
                    className="form-input"
                  />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    Layar kembali memutar layout signage normal.
                  </span>
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href={`/hardware/displays/${params.id}`} className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              <Save size={14} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
