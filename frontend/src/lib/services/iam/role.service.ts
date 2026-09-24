import { invokeApi } from '../../core/invokeApi';
import { Role } from './types';

export async function getRoles(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Role[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/iam/role/ListRoles', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getRole(id: string): Promise<Role> {
  const result = await invokeApi<any>('/api/grpc/iam/role/GetRole', { id });
  const r = result.role || result;
  if (!r || !r.id) throw new Error(`Role ID ${id} tidak ditemukan`);
  return r as Role;
}

export async function createRole(data: { name: string; description?: string; permission_ids: string[] }): Promise<Role> {
  const result = await invokeApi<any>('/api/grpc/iam/role/CreateRole', data);
  const r = result.role || result;
  if (!r || !r.id) throw new Error('CreateRole failed');
  return r as Role;
}

export async function updateRole(id: string, data: { name?: string; description?: string; permission_ids?: string[] }): Promise<Role> {
  const result = await invokeApi<any>('/api/grpc/iam/role/UpdateRole', { id, ...data });
  const r = result.role || result;
  if (!r || !r.id) throw new Error('UpdateRole failed');
  return r as Role;
}

export async function deleteRole(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/iam/role/DeleteRole', { id });
  return true;
}
