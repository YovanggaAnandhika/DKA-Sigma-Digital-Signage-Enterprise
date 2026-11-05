'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredSession, UserSession } from '../lib/auth';
import DashboardLoadingOverlay from './DashboardLoadingOverlay';

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
    return <DashboardLoadingOverlay />;
  }

  return <>{children}</>;
}
