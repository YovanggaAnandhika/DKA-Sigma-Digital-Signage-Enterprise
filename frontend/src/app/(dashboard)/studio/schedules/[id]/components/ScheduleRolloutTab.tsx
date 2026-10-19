'use client';

import React from 'react';
import ScheduleRolloutSyncSection from './ScheduleRolloutSyncSection';
import ScheduleChunkUploadSection from './ScheduleChunkUploadSection';
import ScheduleManifestAssetsTable from './ScheduleManifestAssetsTable';

export default function ScheduleRolloutTab() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
      <ScheduleRolloutSyncSection />
      <ScheduleChunkUploadSection />
      <ScheduleManifestAssetsTable />
    </div>
  );
}
