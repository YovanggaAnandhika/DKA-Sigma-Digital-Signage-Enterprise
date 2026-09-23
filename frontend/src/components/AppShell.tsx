'use client';

import React, { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider } from './SidebarProvider';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { getStoredSession, UserSession } from '../lib/auth';
import { Sparkles } from 'lucide-react';

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const pathname = usePathname() || '';
  const router = useRouter();
  const isLoginPage = pathname === '/login';
  const isEditorPage = pathname.includes('/layouts/') && pathname.includes('/edit');

  useEffect(() => {
    const currentSession = getStoredSession();
    setSession(currentSession);
    setIsCheckingAuth(false);

    if (!currentSession && !isLoginPage) {
      router.push('/login');
    }
  }, [pathname, isLoginPage, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isCheckingAuth || !session) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'var(--bg-primary)',
          color: 'var(--text-secondary)',
          fontSize: '0.875rem',
          gap: '10px',
        }}
      >
        <Sparkles size={20} className="animate-spin" style={{ color: 'var(--primary-500)' }} />
        <span>Memvalidasi sesi gRPC DKASigma...</span>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div style={{ display: 'flex', height: isEditorPage ? '100vh' : undefined, minHeight: '100vh', backgroundColor: 'var(--bg-primary)', overflow: isEditorPage ? 'hidden' : undefined }}>
        <Sidebar />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, height: isEditorPage ? '100vh' : undefined, minHeight: isEditorPage ? undefined : '100vh', overflow: isEditorPage ? 'hidden' : undefined }}>
          <Navbar />
          <main style={{ flex: 1, padding: isEditorPage ? 0 : '24px', overflow: isEditorPage ? 'hidden' : undefined, overflowY: isEditorPage ? 'hidden' : 'auto', backgroundColor: 'var(--bg-primary)', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
            <div style={{ maxWidth: isEditorPage ? 'none' : '1440px', width: '100%', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: isEditorPage ? 0 : '24px', flex: 1, minHeight: 0 }}>
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </SidebarProvider>
  );
}
