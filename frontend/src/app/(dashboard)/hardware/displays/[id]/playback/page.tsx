'use client';

import dynamic from 'next/dynamic';

const DisplayPlaybackDiagnostics = dynamic(() => import('../components/DisplayPlaybackDiagnostics'), {
  ssr: false,
  loading: () => <p style={{ color: 'var(--text-muted)', padding: 16 }}>Memuat diagnostik pemutaran...</p>,
});

export default function DisplayPlaybackPage() {
  return <DisplayPlaybackDiagnostics />;
}
