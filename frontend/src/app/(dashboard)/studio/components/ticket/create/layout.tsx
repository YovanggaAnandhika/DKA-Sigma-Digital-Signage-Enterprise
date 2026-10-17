import React from 'react';
import { QueueEditorProvider } from '../context/QueueEditorContext';

export default function QueueCreateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <QueueEditorProvider isNew={true}>
      {children}
    </QueueEditorProvider>
  );
}
