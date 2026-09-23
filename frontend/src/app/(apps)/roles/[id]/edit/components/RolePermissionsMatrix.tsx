'use client';

import React from 'react';
import { KeyRound } from 'lucide-react';
import type { Permission } from '@/lib/services';

interface RolePermissionsMatrixProps {
  groupedPermissions: Record<string, Permission[]>;
  selectedPermIds: string[];
  togglePermission: (id: string) => void;
  handleSelectAll: () => void;
  handleClearAll: () => void;
}

export default function RolePermissionsMatrix({
  groupedPermissions,
  selectedPermIds,
  togglePermission,
  handleSelectAll,
  handleClearAll,
}: RolePermissionsMatrixProps) {
  return (
    <div className="card-elevated" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <KeyRound size={16} style={{ color: 'var(--accent-amber)' }} />
          <div>
            <h2 style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--text-primary)' }}>
              Matriks Hak Akses (Permissions)
            </h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Centang izin endpoint gRPC yang dialokasikan untuk role ini.
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={handleSelectAll}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Pilih Semua
          </button>
          <button
            type="button"
            onClick={handleClearAll}
            className="btn btn-secondary"
            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
          >
            Reset
          </button>
        </div>
      </div>

      {Object.keys(groupedPermissions).length === 0 ? (
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', textAlign: 'center', padding: '20px' }}>
          Belum ada permissions yang terdaftar di database.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          {Object.entries(groupedPermissions).map(([group, perms]) => (
            <div key={group} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    color: 'var(--primary-400)',
                    backgroundColor: 'rgba(37, 99, 235, 0.12)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    border: '1px solid rgba(59, 130, 246, 0.25)',
                  }}
                >
                  {group}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({perms.filter((p) => selectedPermIds.includes(p.id)).length}/{perms.length} aktif)
                </span>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                  gap: '10px',
                }}
              >
                {perms.map((perm) => {
                  const isChecked = selectedPermIds.includes(perm.id);
                  return (
                    <div
                      key={perm.id}
                      onClick={() => togglePermission(perm.id)}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        backgroundColor: isChecked ? 'rgba(37, 99, 235, 0.14)' : 'var(--bg-surface-elevated)',
                        border: isChecked ? '1px solid rgba(59, 130, 246, 0.4)' : '1px solid var(--border-subtle)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ accentColor: '#2563eb', cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, fontFamily: 'monospace', color: 'var(--text-primary)' }}>
                          {perm.code}
                        </span>
                        <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                          {perm.name || perm.description || 'Akses gRPC'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
