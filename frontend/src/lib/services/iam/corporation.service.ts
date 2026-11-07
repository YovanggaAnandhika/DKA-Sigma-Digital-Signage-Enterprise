import { invokeApi } from '../../core/invokeApi';
import { Corporation, ImpersonatedCorporation } from './types';

const SESSION_STORAGE_KEY = 'dkasigma_impersonated_corp_session';

export async function getCorporations(params?: { search?: string }): Promise<{ data: Corporation[]; total: number }> {
  const res = await invokeApi<{ itemsList: Corporation[]; pagination?: { totalItems: number } }>(
    '/api/grpc/iam/corporation/ListCorporations',
    { search: params?.search || '' }
  );
  return {
    data: res.itemsList || [],
    total: res.pagination?.totalItems || (res.itemsList || []).length,
  };
}

export async function getCorporation(id: string): Promise<Corporation> {
  return invokeApi<Corporation>('/api/grpc/iam/corporation/GetCorporation', { id });
}

export async function createCorporation(data: {
  name: string;
  slug: string;
  description?: string;
  activeUntil?: string;
  maxScreens?: number;
  maxBranches?: number;
  subscriptionTier?: string;
}): Promise<Corporation> {
  return invokeApi<Corporation>('/api/grpc/iam/corporation/CreateCorporation', data);
}

export async function updateCorporation(data: {
  id: string;
  name?: string;
  description?: string;
  activeUntil?: string;
  maxScreens?: number;
  maxBranches?: number;
  subscriptionTier?: string;
  isActive?: boolean;
}): Promise<Corporation> {
  return invokeApi<Corporation>('/api/grpc/iam/corporation/UpdateCorporation', data);
}

export async function deleteCorporation(id: string): Promise<{ success: boolean }> {
  return invokeApi<{ success: boolean }>('/api/grpc/iam/corporation/DeleteCorporation', { id });
}

// Impersonation Client Helpers (Tab-Scoped SessionStorage + React Context In-Memory)
export function getImpersonatedCorporation(): ImpersonatedCorporation | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.slug === 'default-corp' || parsed?.id === '00000000-0000-0000-0000-000000000001') {
        clearImpersonatedCorporation();
        return null;
      }
      return parsed;
    }
  } catch {}
  return null;
}

export function setImpersonatedCorporation(corp: ImpersonatedCorporation): void {
  if (typeof window === 'undefined') return;
  if (corp.slug === 'default-corp' || corp.id === '00000000-0000-0000-0000-000000000001') {
    clearImpersonatedCorporation();
    return;
  }
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(corp));
  // Clean legacy localStorage keys
  try {
    localStorage.removeItem('dkasigma_impersonated_corp_id');
    localStorage.removeItem('dkasigma_impersonated_corp_meta');
  } catch {}
  window.dispatchEvent(new Event('dkasigma_impersonation_change'));
}

export function clearImpersonatedCorporation(): void {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
  // Clean legacy localStorage keys
  try {
    localStorage.removeItem('dkasigma_impersonated_corp_id');
    localStorage.removeItem('dkasigma_impersonated_corp_meta');
  } catch {}
  window.dispatchEvent(new Event('dkasigma_impersonation_change'));
}

