'use client';

import dynamic from 'next/dynamic';
import DisplayCommandToolbar from '../components/DisplayCommandToolbar';

const DisplayTelemetryCard = dynamic(() => import('../components/DisplayTelemetryCard'), { ssr: false });
const DisplayScreenshotModal = dynamic(() => import('../components/DisplayScreenshotModal'), { ssr: false });

export default function DisplayOverviewPage() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <DisplayCommandToolbar />
      <DisplayTelemetryCard />
      <DisplayScreenshotModal />
    </div>
  );
}
