import { invokeApi } from '../core/invokeApi';
import { Permission } from './types';

export async function getPermissions(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Permission[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/permission/ListPermissions', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 100 }
  });
  return {
    data: result.permissionsList || [],
    total: result.pagination?.totalItems || result.permissionsList?.length || 0
  };
}
