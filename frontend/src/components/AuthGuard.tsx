'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredSession, UserSession } from '../lib/auth';
import { Sparkles } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<UserSession | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const currentSession = getStoredSession();
    setSession(currentSession);
    setIsCheckingAuth(false);

    if (!currentSession) {
      router.push('/login');
    }
  }, [router]);

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

  return <>{children}</>;
}
