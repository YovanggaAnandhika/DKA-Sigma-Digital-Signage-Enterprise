import React from 'react';
import QueueEditorShell from '../../components/QueueEditorShell';

export default function QueueCreateTabPage({
  params,
}: {
  params: { tabs: string };
}) {
  return <QueueEditorShell activeTab={params.tabs || 'layout'} />;
}
