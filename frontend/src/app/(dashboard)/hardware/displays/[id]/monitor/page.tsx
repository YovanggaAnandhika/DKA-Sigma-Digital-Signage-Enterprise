'use client';

import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const LiveDeviceMonitor = dynamic(() => import('../components/LiveDeviceMonitor'), {
  ssr: false,
  loading: () => <p style={{ color: 'var(--text-muted)', padding: 16 }}>Menghubungkan monitor realtime...</p>,
});

export default function DisplayMonitorPage() {
  const { id } = useParams() as { id: string };
  return <LiveDeviceMonitor deviceId={id} />;
}
