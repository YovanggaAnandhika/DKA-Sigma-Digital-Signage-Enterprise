import React from 'react';
import AuthGuard from '@/components/AuthGuard';
import { AppProvider } from '@/components/AppContext';
import MainLayout from '@/components/MainLayout';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <AppProvider>
        <MainLayout>
          {children}
        </MainLayout>
      </AppProvider>
    </AuthGuard>
  );
}
