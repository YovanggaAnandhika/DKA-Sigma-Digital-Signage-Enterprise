'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { Device, DisplayGroup, Schedule } from '@/lib/services';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

export default function EditDisplayPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [device, setDevice] = useState<Device | null>(null);
  const [groups, setGroups] = useState<DisplayGroup[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    resolution: '1920x1080',
    orientation: 'landscape',
    timezone: 'Asia/Jakarta',
    displayGroupId: '',
    schedule_id: '',
  });

  useEffect(() => {
    const fetchDevice = async () => {
      try {
        setLoading(true);
        const [data, groupsData, schedulesData] = await Promise.all([
          api.getDevice(params.id),
          api.getDisplayGroups({ limit: 1000 }),
          api.getSchedules({ limit: 1000 })
        ]);
        setDevice(data);
        setGroups(groupsData.data);
        setSchedules(schedulesData.data);
        setFormData({
          name: data.name,
          resolution: data.screenWidth && data.screenHeight ? `${data.screenWidth}x${data.screenHeight}` : '1920x1080',
          orientation: String(data.orientation) === '2' ? 'portrait' : 'landscape',
          timezone: data.timezone || 'Asia/Jakarta',
          displayGroupId: data.displayGroupId || '',
          schedule_id: data.scheduleId || '',
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat display');
        router.push('/displays');
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
        display_group_id: formData.displayGroupId,
        schedule_id: formData.schedule_id,
      });
      router.push(`/displays/${params.id}`);
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
        <Link href={`/displays/${params.id}`} className="btn btn-outline" style={{ padding: '8px' }}>
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
                <option value="1920x1080">1920 × 1080 (FHD)</option>
                <option value="3840x2160">3840 × 2160 (4K UHD)</option>
                <option value="1280x720">1280 × 720 (HD)</option>
                <option value="1080x1920">1080 × 1920 (Portrait FHD)</option>
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
                <option value="landscape">Landscape (Mendatar)</option>
                <option value="portrait">Portrait (Tegak)</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Zona Waktu (Timezone)
              </label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="form-select"
              >
                <option value="Asia/Jakarta">WIB (Asia/Jakarta)</option>
                <option value="Asia/Makassar">WITA (Asia/Makassar)</option>
                <option value="Asia/Jayapura">WIT (Asia/Jayapura)</option>
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

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Jadwal Perangkat
              </label>
              <select
                value={formData.schedule_id}
                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Gunakan Jadwal Grup/Tanpa Jadwal --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href={`/displays/${params.id}`} className="btn btn-secondary">
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
