'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Role, Permission } from '@/lib/services';
import { 
  ShieldCheck, 
  ArrowLeft, 
  Save, 
  Check, 
  KeyRound, 
  AlertCircle,
  Clock,
  Layers
} from 'lucide-react';

export default function EditRolePage() {
  const router = useRouter();
  const params = useParams() as { id: string };
  const roleId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [availablePermissions, setAvailablePermissions] = useState<Permission[]>([]);
  const [selectedPermIds, setSelectedPermIds] = useState<string[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [rolesRes, perms] = await Promise.all([
          api.getRoles({ limit: 100 }),
          api.getPermissions()
        ]);

        const role = rolesRes.data.find((r: Role) => r.id === roleId);
        if (!role) {
          setError(`Role dengan ID "${roleId}" tidak ditemukan.`);
          setLoading(false);
          return;
        }

        setName(role.name);
        setDescription(role.description || '');
        setAvailablePermissions(perms || []);
        
        // Match permissions: if role.permissions contains codes or IDs, match them
        const permIds = (perms || [])
          .filter((p: Permission) => (role.permissions || []).includes(p.code) || (role.permissions || []).includes(p.id))
          .map((p: Permission) => p.id);

        setSelectedPermIds(permIds);
      } catch (err: any) {
        setError(err.message || 'Gagal memuat data role dan permissions dari server.');
      } finally {
        setLoading(false);
      }
    }

    if (roleId) {
      loadData();
    }
  }, [roleId]);

  const togglePermission = (permId: string) => {
    setSelectedPermIds(prev => 
      prev.includes(permId) 
        ? prev.filter(p => p !== permId) 
        : [...prev, permId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPermIds(availablePermissions.map(p => p.id));
  };

  const handleClearAll = () => {
    setSelectedPermIds([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama role wajib diisi.');
      return;
    }

    try {
      setSaving(true);
      setError(null);

      await api.updateRole(roleId, {
        name: name.trim(),
        description: description.trim(),
        permission_ids: selectedPermIds
      });

      setSuccess(true);
      setTimeout(() => {
        router.push(`/roles/${roleId}`);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Gagal memperbarui role ke gRPC backend.');
      setSaving(false);
    }
  };

  // Group permissions by module prefix
  const groupedPermissions: Record<string, Permission[]> = availablePermissions.reduce((acc: Record<string, Permission[]>, perm: Permission) => {
    const group = perm.module || perm.code.split(':')[0] || 'general';
    if (!acc[group]) acc[group] = [];
    acc[group].push(perm);
    return acc;
  }, {});

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
        <Clock size={24} className="animate-spin" style={{ margin: '0 auto 12px auto' }} />
        <span>Memuat data konfigurasi role dari database...</span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '32px' }}>
      {/* Header Breadcrumbs */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Link href={`/roles/${roleId}`} className="btn btn-outline" style={{ padding: '8px' }}>
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-primary)' }}>
                Edit Role: {name || roleId}
              </h1>
            </div>
            <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginTop: '2px' }}>
              Sesuaikan wewenang, deskripsi peran, dan hak akses kontrol gRPC
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Link href={`/roles/${roleId}`} className="btn btn-outline">
            Batal
          </Link>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="btn btn-primary"
          >
            {saving ? (
              <>
                <Clock size={14} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : success ? (
              <>
                <Check size={14} style={{ color: '#34d399' }} />
                <span>Tersimpan!</span>
              </>
            ) : (
              <>
                <Save size={14} />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid rgba(244, 63, 94, 0.3)',
            color: '#fda4af',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} style={{ color: '#f43f5e', flexShrink: 0 }} />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#6ee7b7',
            fontSize: '0.8125rem',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Check size={18} style={{ color: '#10b981', flexShrink: 0 }} />
          <span>Role berhasil diperbarui! Mengalihkan...</span>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Basic Information Card */}
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

        {/* Permissions Assignment Matrix */}
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
                      ({perms.filter(p => selectedPermIds.includes(p.id)).length}/{perms.length} aktif)
                    </span>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                      gap: '10px',
                    }}
                  >
                    {perms.map(perm => {
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

        {/* Action Bottom Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total izin terpilih: <strong style={{ color: 'var(--text-primary)' }}>{selectedPermIds.length}</strong> dari {availablePermissions.length}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/roles/${roleId}`} className="btn btn-outline">
              Batal
            </Link>
            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? (
                <>
                  <Clock size={14} className="animate-spin" />
                  <span>Menyimpan...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>Simpan Perubahan</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
