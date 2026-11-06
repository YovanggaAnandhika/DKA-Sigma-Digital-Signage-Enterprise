'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

const DisplayGroupListView = dynamic(
  () => import('../components/DisplayGroupListView'),
  {
    loading: () => (
      <div className="card-elevated" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
        <span>Memuat daftar grup layar...</span>
      </div>
    ),
  }
);

export default function DisplayGroupsTabPage() {
  return <DisplayGroupListView />;
}
