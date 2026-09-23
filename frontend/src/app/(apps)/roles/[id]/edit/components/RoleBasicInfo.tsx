'use client';

import React from 'react';
import { Layers } from 'lucide-react';

interface RoleBasicInfoProps {
  name: string;
  setName: (val: string) => void;
  roleId: string;
  description: string;
  setDescription: (val: string) => void;
}

export default function RoleBasicInfo({
  name,
  setName,
  roleId,
  description,
  setDescription,
}: RoleBasicInfoProps) {
  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <Layers size={16} style={{ color: 'var(--primary-400)' }} />
        <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          Informasi Dasar Role
        </h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Nama Role <span style={{ color: 'var(--accent-rose)' }}>*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Content Operator"
            className="form-input"
            required
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Identifier ID
          </label>
          <input
            type="text"
            value={roleId}
            disabled
            className="form-input"
            style={{ opacity: 0.6, cursor: 'not-allowed', fontFamily: 'monospace' }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
          Deskripsi Peran
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsikan wewenang peran ini..."
          rows={3}
          className="form-textarea"
        />
      </div>
    </div>
  );
}
