'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/services';
import type { DisplayGroup, Layout, Schedule } from '@/lib/services';
import { ArrowLeft, Save, RefreshCw, MonitorPlay } from 'lucide-react';
import { SingleSelect } from '@/components/ui/SingleSelect';

export default function EditDisplayGroupPage() {
  const params = useParams() as { id: string };
  const router = useRouter();
  const [group, setGroup] = useState<DisplayGroup | null>(null);
  const [layouts, setLayouts] = useState<Layout[]>([]);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    defaultLayoutId: '',
    schedule_id: '',
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [groupData, layoutsData, schedulesData] = await Promise.all([
          api.getDisplayGroups({ search: '' }),
          api.getLayouts({ limit: 1000 }),
          api.getSchedules({ limit: 1000 }),
        ]);

        const found = groupData.data.find((g) => g.id === params.id);
        if (!found) throw new Error('Display group tidak ditemukan');

        setGroup(found);
        setLayouts(layoutsData.data);
        setSchedules(schedulesData.data);
        setFormData({
          name: found.name,
          description: found.description || '',
          defaultLayoutId: found.default_layout_id || '',
          schedule_id: found.scheduleId || found.schedule_id || '',
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat grup layar');
        router.push('/hardware/displays/groups');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params.id, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      await api.updateDisplayGroup(params.id, {
        name: formData.name,
        description: formData.description,
        default_layout_id: formData.defaultLayoutId,
        schedule_id: formData.schedule_id,
      });
      router.push('/hardware/displays/groups');
    } catch (err: any) {
      alert(err.message || 'Gagal memperbarui grup layar');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !group) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data grup layar...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <Link
          href="/hardware/displays/groups"
          className="btn btn-outline"
          style={{
            width: '42px',
            minWidth: '42px',
            height: '42px',
            padding: 0,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '50%',
          }}
          aria-label="Kembali ke Grup Layar"
          title="Kembali ke Grup Layar"
        >
          <ArrowLeft size={18} />
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              padding: '10px',
              borderRadius: '14px',
              backgroundColor: 'rgba(37, 99, 235, 0.12)',
              color: 'var(--primary-400)',
              border: '1px solid rgba(59, 130, 246, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MonitorPlay size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)', margin: 0 }}>
              Edit Konfigurasi Grup Layar
            </h1>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px', marginBottom: 0 }}>
              Ubah nama grup atau preferensi distribusi tayang.
            </p>
          </div>
        </div>
      </div>

      <div className="card-elevated" style={{ padding: '24px', width: '100%' }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Nama Grup Layar *
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

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Layout Standar (Fallback Layout)
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
              Layout yang ditampilkan pada layar dalam grup ini ketika tidak ada jadwal aktif.
            </p>
            <SingleSelect
              options={[
                { value: '', label: '-- Pilih Layout (Tidak Ada / Gunakan Default Sistem) --' },
                ...layouts.map((l) => ({ value: l.id, label: l.name })),
              ]}
              value={formData.defaultLayoutId}
              onChange={(val) => setFormData({ ...formData, defaultLayoutId: val })}
              placeholder="Pilih layout fallback..."
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Jadwal Aktif Terhubung
            </label>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', margin: '0 0 8px 0' }}>
              Hubungkan seluruh anggota display dalam grup ini ke jadwal tayang tertentu.
            </p>
            <SingleSelect
              options={[
                { value: '', label: '-- Tidak Terhubung ke Jadwal Apapun --' },
                ...schedules.map((s) => ({ value: s.id, label: s.name })),
              ]}
              value={formData.schedule_id}
              onChange={(val) => setFormData({ ...formData, schedule_id: val })}
              placeholder="Pilih jadwal siaran..."
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/hardware/displays/groups" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" disabled={saving || !formData.name} className="btn btn-primary">
              <Save size={14} />
              <span>{saving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
