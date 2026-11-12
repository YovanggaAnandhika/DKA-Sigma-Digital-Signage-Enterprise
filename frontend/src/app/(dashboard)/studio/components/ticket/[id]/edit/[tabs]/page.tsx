import React from 'react';
import QueueEditorShell from '../../../components/QueueEditorShell';

export default async function QueueEditTabPage({
  params,
}: {
  params: Promise<{ id: string; tabs: string }>;
}) {
  const { tabs } = await params;
  return <QueueEditorShell activeTab={tabs || 'layout'} />;
}
