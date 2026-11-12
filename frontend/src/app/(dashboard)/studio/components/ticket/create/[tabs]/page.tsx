import React from 'react';
import QueueEditorShell from '../../components/QueueEditorShell';

export default async function QueueCreateTabPage({
  params,
}: {
  params: Promise<{ tabs: string }>;
}) {
  const { tabs } = await params;
  return <QueueEditorShell activeTab={tabs || 'layout'} />;
}
