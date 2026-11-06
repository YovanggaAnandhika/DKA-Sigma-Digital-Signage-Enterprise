'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

const ScheduleTableView = dynamic(
  () => import('../components/ScheduleTableView'),
  {
    loading: () => (
      <div className="card-elevated" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
        <span>Memuat daftar tabel jadwal...</span>
      </div>
    ),
  }
);

export default function ScheduleTablePage() {
  return <ScheduleTableView />;
}

