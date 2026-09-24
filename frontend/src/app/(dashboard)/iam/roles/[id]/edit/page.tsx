'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { api, Role, Permission } from '@/lib/services';
import { 
  ArrowLeft, 
  Save, 
  Check, 
  AlertCircle,
  Clock
} from 'lucide-react';
import RoleBasicInfo from './components/RoleBasicInfo';
import RolePermissionsMatrix from './components/RolePermissionsMatrix';

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
        setAvailablePermissions(perms.data || []);
        
        // Match permissions: if role.permissionsList contains codes or IDs, match them
        const permIds = (perms.data || [])
          .filter((p: Permission) => (role.permissionsList || []).some((rp: Permission) => rp.code === p.code || rp.id === p.id))
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
        router.push(`/iam/roles/${roleId}`);
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
          <Link href={`/iam/roles/${roleId}`} className="btn btn-outline" style={{ padding: '8px' }}>
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
          <Link href={`/iam/roles/${roleId}`} className="btn btn-outline">
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
        <RoleBasicInfo 
          name={name} 
          setName={setName} 
          roleId={roleId} 
          description={description} 
          setDescription={setDescription} 
        />

        {/* Permissions Assignment Matrix */}
        <RolePermissionsMatrix 
          groupedPermissions={groupedPermissions} 
          selectedPermIds={selectedPermIds} 
          togglePermission={togglePermission} 
          handleSelectAll={handleSelectAll} 
          handleClearAll={handleClearAll} 
        />

        {/* Action Bottom Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '8px' }}>
          <span style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            Total izin terpilih: <strong style={{ color: 'var(--text-primary)' }}>{selectedPermIds.length}</strong> dari {availablePermissions.length}
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Link href={`/iam/roles/${roleId}`} className="btn btn-outline">
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
