import React from 'react';
import QueueEditorShell from '../../../components/QueueEditorShell';

export default function QueueEditTabPage({
  params,
}: {
  params: { id: string; tabs: string };
}) {
  return <QueueEditorShell activeTab={params.tabs || 'layout'} />;
}
