import React from 'react';
import AuthGuard from '@/components/AuthGuard';

export default function EditorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div style={{ height: '100vh', width: '100vw', overflow: 'hidden', backgroundColor: 'var(--bg-primary)' }}>
        {children}
      </div>
    </AuthGuard>
  );
}
