import { invokeApi } from '../../core/invokeApi';
import { Corporation, ImpersonatedCorporation } from './types';

const IMPERSONATION_STORAGE_KEY = 'dkasigma_impersonated_corp_id';
const IMPERSONATION_META_KEY = 'dkasigma_impersonated_corp_meta';

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

// Impersonation Client Helpers
export function getImpersonatedCorporation(): ImpersonatedCorporation | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawMeta = localStorage.getItem(IMPERSONATION_META_KEY);
    if (rawMeta) {
      const parsed = JSON.parse(rawMeta);
      // Default corporation is master/home, never impersonated
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
  // Superadmin own tenant cannot be impersonated
  if (corp.slug === 'default-corp' || corp.id === '00000000-0000-0000-0000-000000000001') {
    clearImpersonatedCorporation();
    return;
  }
  localStorage.setItem(IMPERSONATION_STORAGE_KEY, corp.id);
  localStorage.setItem(IMPERSONATION_META_KEY, JSON.stringify(corp));
  window.dispatchEvent(new Event('dkasigma_impersonation_change'));
}

export function clearImpersonatedCorporation(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(IMPERSONATION_STORAGE_KEY);
  localStorage.removeItem(IMPERSONATION_META_KEY);
  window.dispatchEvent(new Event('dkasigma_impersonation_change'));
}

