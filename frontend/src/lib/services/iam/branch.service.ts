import { invokeApi } from '../../core/invokeApi';
import { Branch } from './types';

export async function getBranches(params?: {
  corporationId?: string;
  search?: string;
}): Promise<{ data: Branch[]; total: number }> {
  const res = await invokeApi<{ itemsList: Branch[]; pagination?: { totalItems: number } }>(
    '/api/grpc/iam/branch/ListBranches',
    {
      corporationId: params?.corporationId || '',
      search: params?.search || '',
    }
  );
  return {
    data: res.itemsList || [],
    total: res.pagination?.totalItems || (res.itemsList || []).length,
  };
}

export async function getBranch(id: string): Promise<Branch> {
  return invokeApi<Branch>('/api/grpc/iam/branch/GetBranch', { id });
}

export async function createBranch(data: {
  corporationId: string;
  name: string;
  code: string;
  address?: string;
}): Promise<Branch> {
  return invokeApi<Branch>('/api/grpc/iam/branch/CreateBranch', data);
}

export async function updateBranch(data: {
  id: string;
  name?: string;
  code?: string;
  address?: string;
  isActive?: boolean;
}): Promise<Branch> {
  return invokeApi<Branch>('/api/grpc/iam/branch/UpdateBranch', data);
}

export async function deleteBranch(id: string): Promise<{ success: boolean }> {
  return invokeApi<{ success: boolean }>('/api/grpc/iam/branch/DeleteBranch', { id });
}

