'use client';

import React from 'react';
import { Save } from 'lucide-react';

interface ScheduleDetailsFormProps {
  formData: { name: string; description: string };
  setFormData: (val: any) => void;
  handleSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}

export default function ScheduleDetailsForm({
  formData,
  setFormData,
  handleSubmit,
  saving,
}: ScheduleDetailsFormProps) {
  return (
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
  );
}
