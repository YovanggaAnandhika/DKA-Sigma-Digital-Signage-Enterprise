'use client';

import dynamic from 'next/dynamic';
import { RefreshCw } from 'lucide-react';

const ScheduleCalendarView = dynamic(
  () => import('../components/ScheduleCalendarView'),
  {
    loading: () => (
      <div className="card-elevated" style={{ padding: 48, textAlign: 'center', color: 'var(--text-muted)' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px auto' }} />
        <span>Memuat kalender rundown operasional...</span>
      </div>
    ),
  }
);

export default function ScheduleCalendarPage() {
  return <ScheduleCalendarView />;
}

