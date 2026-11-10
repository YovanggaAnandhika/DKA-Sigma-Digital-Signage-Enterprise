'use client';

import dynamic from 'next/dynamic';

const DisplayAnalyticsChart = dynamic(() => import('../components/DisplayAnalyticsChart'), {
  ssr: false,
  loading: () => <p style={{ color: 'var(--text-muted)', padding: 16 }}>Memuat grafik telemetri...</p>,
});
const DisplayPlaybackAuditTable = dynamic(() => import('../components/DisplayPlaybackAuditTable'), {
  ssr: false,
  loading: () => <p style={{ color: 'var(--text-muted)', padding: 16 }}>Memuat riwayat tayang...</p>,
});

export default function DisplayHistoryPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DisplayAnalyticsChart />
      <DisplayPlaybackAuditTable />
    </div>
  );
}
