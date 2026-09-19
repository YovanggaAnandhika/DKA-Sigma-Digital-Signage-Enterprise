'use client';

import { useState } from 'react';

interface RolePermissionItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

export default function RolesPage() {
  const [roles] = useState<RolePermissionItem[]>([
    {
      id: 'r1',
      name: 'Super Admin',
      slug: 'superadmin',
      description: 'Akses tak terbatas ke seluruh konfigurasi server, display, dan pengguna',
      permissions: [
        'can_manage_settings',
        'can_manage_users',
        'can_manage_roles',
        'can_manage_devices',
        'can_edit_layouts',
        'can_publish_playlists',
        'can_upload_media',
        'can_manage_canary',
      ],
    },
    {
      id: 'r2',
      name: 'Content Editor',
      slug: 'editor',
      description: 'Hanya dapat mendesain template, mengunggah media, dan mengatur rotasi playlist',
      permissions: [
        'can_edit_layouts',
        'can_publish_playlists',
        'can_upload_media',
      ],
    },
    {
      id: 'r3',
      name: 'Store Branch Manager',
      slug: 'store_manager',
      description: 'Dapat memonitor status display dan meminta refresh konten lokal',
      permissions: [
        'can_view_displays',
        'can_reboot_display',
        'can_view_analytics',
      ],
    },
  ]);

  const allPermissions = [
    { code: 'can_edit_layouts', name: 'Edit Layout & Appearance Designer', module: 'studio' },
    { code: 'can_publish_playlists', name: 'Publish & Order Playlists', module: 'studio' },
    { code: 'can_upload_media', name: 'Upload Video & Image Assets', module: 'studio' },
    { code: 'can_manage_devices', name: 'Register & Pair Android Displays', module: 'hardware' },
    { code: 'can_reboot_display', name: 'Remote Reboot & Screenshot Displays', module: 'hardware' },
    { code: 'can_manage_settings', name: 'Full System Settings Access', module: 'iam' },
    { code: 'can_manage_users', name: 'Manage User Accounts', module: 'iam' },
    { code: 'can_manage_canary', name: 'Configure Canary Gradual Rollouts', module: 'distribution' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, letterSpacing: '-0.02em' }}>
            Roles, Groups & Permission Engine ("can_*")
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px' }}>
            Pengaturan izin hak akses berbasis permission code (Editor, Admin, Settings, dll)
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => alert('Fitur tambah role baru!')}>
          <span>+ Buat Role Baru</span>
        </button>
      </div>

      <div className="glass-panel" style={{ padding: '24px' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '28%' }}>Hak Akses ("can_*")</th>
              <th style={{ width: '15%' }}>Kategori</th>
              {roles.map((r) => (
                <th key={r.id} style={{ textAlign: 'center' }}>
                  {r.name}
                  <div style={{ fontSize: '0.7rem', textTransform: 'lowercase', color: '#6366f1', fontWeight: 400 }}>
                    @{r.slug}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allPermissions.map((perm) => (
              <tr key={perm.code}>
                <td>
                  <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{perm.name}</div>
                  <code style={{ fontSize: '0.75rem', color: '#a5b4fc', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>
                    {perm.code}
                  </code>
                </td>
                <td>
                  <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', textTransform: 'uppercase', color: '#94a3b8' }}>
                    {perm.module}
                  </span>
                </td>
                {roles.map((r) => {
                  const hasPerm = r.permissions.includes(perm.code);
                  return (
                    <td key={r.id} style={{ textAlign: 'center' }}>
                      {hasPerm ? (
                        <span style={{ color: 'var(--accent-emerald)', fontWeight: 800, fontSize: '1.1rem' }}>
                          ✓
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: '1.1rem' }}>
                          —
                        </span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
