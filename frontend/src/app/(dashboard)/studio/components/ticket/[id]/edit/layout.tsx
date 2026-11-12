import React from 'react';
import { QueueEditorProvider } from '../../context/QueueEditorContext';

export default async function QueueEditLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <QueueEditorProvider initialId={id} isNew={false}>
      {children}
    </QueueEditorProvider>
  );
}
