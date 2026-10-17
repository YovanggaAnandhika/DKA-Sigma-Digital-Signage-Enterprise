import React from 'react';
import { QueueEditorProvider } from '../../context/QueueEditorContext';

export default function QueueEditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string };
}) {
  return (
    <QueueEditorProvider initialId={params.id} isNew={false}>
      {children}
    </QueueEditorProvider>
  );
}
