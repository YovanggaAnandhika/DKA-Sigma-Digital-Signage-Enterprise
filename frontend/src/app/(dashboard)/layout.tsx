import React from 'react';
import { SidebarProvider } from '@/components/SidebarProvider';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import AuthGuard from '@/components/AuthGuard';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <SidebarProvider>
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-primary)' }}>
          <Sidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh' }}>
            <Navbar />
            <main style={{ flex: 1, padding: '24px', overflowY: 'auto', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              <div style={{ maxWidth: '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, minHeight: 0 }}>
                {children}
              </div>
            </main>
            <Footer />
          </div>
        </div>
      </SidebarProvider>
    </AuthGuard>
  );
}
