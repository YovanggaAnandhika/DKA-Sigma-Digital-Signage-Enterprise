'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { DisplayGroup, Layout, Schedule } from '@/lib/api';
import { ArrowLeft, Save, RefreshCw } from 'lucide-react';

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
    default_layout_id: '',
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
        
        // Find the group manually since we don't have getDisplayGroup(id) in the API spec, just list
        const found = groupData.data.find(g => g.id === params.id);
        if (!found) throw new Error('Display group not found');

        setGroup(found);
        setLayouts(layoutsData.data);
        setSchedules(schedulesData.data);
        setFormData({
          name: found.name,
          description: found.description || '',
          default_layout_id: found.default_layout_id || '',
          schedule_id: found.schedule_id || '',
        });
      } catch (err: any) {
        alert(err.message || 'Gagal memuat display group');
        router.push('/groups');
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
        default_layout_id: formData.default_layout_id,
        schedule_id: formData.schedule_id,
      });
      router.push('/groups');
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
        <span>Memuat data grup...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link href="/groups" className="btn btn-outline" style={{ padding: '8px' }}>
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
            Edit Konfigurasi Grup Layar
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Ubah nama grup atau preferensi distribusi tayang.
          </p>
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Layout Default (Fallback)
              </label>
              <select
                value={formData.default_layout_id}
                onChange={(e) => setFormData({ ...formData, default_layout_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Pilih Layout --</option>
                {layouts.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Jadwal Prioritas (Aktif)
              </label>
              <select
                value={formData.schedule_id}
                onChange={(e) => setFormData({ ...formData, schedule_id: e.target.value })}
                className="form-select"
              >
                <option value="">-- Tanpa Jadwal --</option>
                {schedules.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
            <Link href="/groups" className="btn btn-secondary">
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
