'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface ImpersonatedCorporation {
  id: string;
  name: string;
  slug: string;
}

interface ImpersonationContextType {
  impersonatedCorp: ImpersonatedCorporation | null;
  startImpersonation: (corp: ImpersonatedCorporation) => void;
  stopImpersonation: () => void;
}

const SESSION_STORAGE_KEY = 'dkasigma_impersonated_corp_session';

// In-memory module state for direct non-React access (e.g. inside invokeApi)
let inMemoryImpersonatedCorp: ImpersonatedCorporation | null = null;

export function getActiveImpersonationId(): string | null {
  if (inMemoryImpersonatedCorp) {
    return inMemoryImpersonatedCorp.id;
  }
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.id && parsed.slug !== 'default-corp') {
          inMemoryImpersonatedCorp = parsed;
          return parsed.id;
        }
      }
    } catch {}
  }
  return null;
}

export function clearActiveImpersonationState(): void {
  inMemoryImpersonatedCorp = null;
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      // Clean any legacy localStorage keys to prevent stale residue
      localStorage.removeItem('dkasigma_impersonated_corp_id');
      localStorage.removeItem('dkasigma_impersonated_corp_meta');
      window.dispatchEvent(new Event('dkasigma_impersonation_change'));
    } catch {}
  }
}

const ImpersonationContext = createContext<ImpersonationContextType | undefined>(undefined);

export function ImpersonationProvider({ children }: { children: React.ReactNode }) {
  const [impersonatedCorp, setImpersonatedCorp] = useState<ImpersonatedCorporation | null>(null);

  // Initialize from tab-scoped sessionStorage on client mount
  useEffect(() => {
    // Also clean any legacy localStorage keys once
    try {
      localStorage.removeItem('dkasigma_impersonated_corp_id');
      localStorage.removeItem('dkasigma_impersonated_corp_meta');
    } catch {}

    try {
      const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
      if (raw) {
        const parsed: ImpersonatedCorporation = JSON.parse(raw);
        // Master HQ default-corp is never impersonated
        if (parsed?.slug === 'default-corp' || parsed?.id === '00000000-0000-0000-0000-000000000001') {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          inMemoryImpersonatedCorp = null;
          setImpersonatedCorp(null);
        } else {
          inMemoryImpersonatedCorp = parsed;
          setImpersonatedCorp(parsed);
        }
      }
    } catch {
      inMemoryImpersonatedCorp = null;
      setImpersonatedCorp(null);
    }

    const handleSync = () => {
      try {
        const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          inMemoryImpersonatedCorp = parsed;
          setImpersonatedCorp(parsed);
        } else {
          inMemoryImpersonatedCorp = null;
          setImpersonatedCorp(null);
        }
      } catch {
        inMemoryImpersonatedCorp = null;
        setImpersonatedCorp(null);
      }
    };

    window.addEventListener('dkasigma_impersonation_change', handleSync);
    return () => window.removeEventListener('dkasigma_impersonation_change', handleSync);
  }, []);

  const startImpersonation = useCallback((corp: ImpersonatedCorporation) => {
    if (corp.slug === 'default-corp' || corp.id === '00000000-0000-0000-0000-000000000001') {
      stopImpersonation();
      return;
    }
    inMemoryImpersonatedCorp = corp;
    setImpersonatedCorp(corp);
    try {
      sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(corp));
      window.dispatchEvent(new Event('dkasigma_impersonation_change'));
    } catch {}
  }, []);

  const stopImpersonation = useCallback(() => {
    inMemoryImpersonatedCorp = null;
    setImpersonatedCorp(null);
    try {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      window.dispatchEvent(new Event('dkasigma_impersonation_change'));
    } catch {}
  }, []);

  return (
    <ImpersonationContext.Provider value={{ impersonatedCorp, startImpersonation, stopImpersonation }}>
      {children}
    </ImpersonationContext.Provider>
  );
}

export function useImpersonation(): ImpersonationContextType {
  const context = useContext(ImpersonationContext);
  if (context === undefined) {
    // Graceful fallback for components rendered outside provider
    return {
      impersonatedCorp: inMemoryImpersonatedCorp,
      startImpersonation: (corp) => {
        inMemoryImpersonatedCorp = corp;
        try {
          sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(corp));
          window.dispatchEvent(new Event('dkasigma_impersonation_change'));
        } catch {}
      },
      stopImpersonation: () => {
        inMemoryImpersonatedCorp = null;
        try {
          sessionStorage.removeItem(SESSION_STORAGE_KEY);
          window.dispatchEvent(new Event('dkasigma_impersonation_change'));
        } catch {}
      },
    };
  }
  return context;
}

