'use client';

import React from 'react';
import { SidebarProvider } from '@/components/SidebarProvider';
import { Sidebar } from '@/components/Sidebar';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useAppContext } from './AppContext';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { isFullscreen } = useAppContext();

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', minHeight: '100vh', height: isFullscreen ? '100vh' : undefined, backgroundColor: 'var(--bg-primary)', overflow: isFullscreen ? 'hidden' : undefined }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: '100vh', height: isFullscreen ? '100vh' : undefined, overflow: isFullscreen ? 'hidden' : undefined }}>
          <Navbar />
          <main
            style={{
              flex: 1,
              padding: isFullscreen ? 0 : '24px',
              overflow: isFullscreen ? 'hidden' : undefined,
              overflowY: isFullscreen ? 'hidden' : 'auto',
              backgroundColor: 'var(--bg-primary)',
              display: 'flex',
              flexDirection: 'column',
              minHeight: 0,
            }}
          >
            <div
              style={{
                maxWidth: isFullscreen ? 'none' : '1440px',
                width: '100%',
                margin: '0 auto',
                display: 'flex',
                flexDirection: 'column',
                gap: isFullscreen ? 0 : '24px',
                flex: 1,
                minHeight: 0,
              }}
            >
              {children}
            </div>
          </main>
          {!isFullscreen && <Footer />}
        </div>
      </div>
    </SidebarProvider>
  );
}
