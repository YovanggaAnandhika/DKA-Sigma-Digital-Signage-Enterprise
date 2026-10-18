'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Device, DisplayGroup, Schedule, Layout, Resolution } from '@/lib/services';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';
import { SingleSelect } from '@/components/ui/SingleSelect';

export default function EditDisplayPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [resolutions, setResolutions] = useState<Resolution[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    resolution: '',
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
        const [data, groupsData, schedulesData, layoutsData, resolutionsData] = await Promise.all([
          api.getDevice(params.id),
          api.getDisplayGroups({ limit: 1000 }),
          api.getSchedules({ limit: 1000 }),
          api.getLayouts({ limit: 1000 }),
          api.getResolutions(),
        ]);
        setDevice(data);
        setGroups(groupsData.data);
        setSchedules(schedulesData.data);
        setLayouts(layoutsData.data);
        setResolutions(resolutionsData);
        setFormData({
          name: data.name,
          resolution: data.screenWidth && data.screenHeight ? `${data.screenWidth}x${data.screenHeight}` : '',
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
      const [sw, sh] = formData.resolution ? formData.resolution.split('x').map(Number) : [undefined, undefined];
      const orientationVal = formData.orientation === 'portrait' ? 2 : 1;
      await api.updateDevice(params.id, {
        name: formData.name,
        screen_width: sw,
        screen_height: sh,
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

  const resolutionOptions = React.useMemo(() => {
    return resolutions.map((r) => ({
      value: `${r.width}x${r.height}`,
      label: r.name,
      hint: `${r.width} × ${r.height} (${r.aspectRatio})`,
    }));
  }, [resolutions]);

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
              <SingleSelect
                value={formData.resolution}
                onChange={(val) => setFormData({ ...formData, resolution: val })}
                options={resolutionOptions}
                placeholder="Pilih Resolusi Layar..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Orientasi Fisik
              </label>
              <SingleSelect
                value={formData.orientation}
                onChange={(val) => setFormData({ ...formData, orientation: val })}
                options={[
                  { value: 'landscape', label: 'Landscape', hint: 'Horizontal (Standar Layar TV)' },
                  { value: 'portrait', label: 'Portrait', hint: 'Vertikal (Standing Banner)' },
                ]}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Layout Utama Layar (Default Layout)
              </label>
              <SingleSelect
                value={formData.current_layout_id}
                onChange={(val) => setFormData({ ...formData, current_layout_id: val })}
                placeholder="-- Gunakan Layout Grup atau Kosong --"
                options={[
                  { value: '', label: '-- Gunakan Layout Grup atau Kosong --' },
                  ...layouts.map((l) => ({
                    value: l.id,
                    label: l.name,
                    hint: `${l.canvasWidth} × ${l.canvasHeight}`,
                  })),
                ]}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                Layout ini diputar otomatis jika tidak ada jadwal aktif.
              </span>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Jadwal Perangkat (Schedule Override)
              </label>
              <SingleSelect
                value={formData.schedule_id}
                onChange={(val) => setFormData({ ...formData, schedule_id: val })}
                placeholder="-- Gunakan Jadwal Grup / Tanpa Jadwal --"
                options={[
                  { value: '', label: '-- Gunakan Jadwal Grup / Tanpa Jadwal --' },
                  ...schedules.map((s) => ({
                    value: s.id,
                    label: s.name,
                  })),
                ]}
              />
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
              <SingleSelect
                value={formData.timezone}
                onChange={(val) => setFormData({ ...formData, timezone: val })}
                options={[
                  { value: 'Asia/Jakarta', label: 'WIB · Asia/Jakarta' },
                  { value: 'Asia/Makassar', label: 'WITA · Asia/Makassar' },
                  { value: 'Asia/Jayapura', label: 'WIT · Asia/Jayapura' },
                  { value: 'UTC', label: 'UTC' },
                ]}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Grup Layar (Display Group)
              </label>
              <SingleSelect
                value={formData.displayGroupId}
                onChange={(val) => setFormData({ ...formData, displayGroupId: val })}
                placeholder="-- Tidak Tergabung --"
                options={[
                  { value: '', label: '-- Tidak Tergabung --' },
                  ...groups.map((g) => ({
                    value: g.id,
                    label: g.name,
                  })),
                ]}
              />
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
