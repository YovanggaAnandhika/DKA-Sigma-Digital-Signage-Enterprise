import { invokeApi } from '../../core/invokeApi';
import { DisplayGroup } from './types';

export async function getDisplayGroups(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: DisplayGroup[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/display_group/ListDisplayGroups', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.groupsList || [],
    total: result.pagination?.totalItems || result.groupsList?.length || 0
  };
}

export async function createDisplayGroup(data: { name: string; description?: string }): Promise<DisplayGroup> {
  const result = await invokeApi<any>('/api/grpc/display_group/CreateDisplayGroup', data);
  if (!result.group) throw new Error('CreateDisplayGroup failed');
  return result.group as DisplayGroup;
}

export async function updateDisplayGroup(id: string, data: { name?: string; description?: string }): Promise<DisplayGroup> {
  const result = await invokeApi<any>('/api/grpc/display_group/UpdateDisplayGroup', { id, ...data });
  if (!result.group) throw new Error('UpdateDisplayGroup failed');
  return result.group as DisplayGroup;
}

export async function deleteDisplayGroup(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/display_group/DeleteDisplayGroup', { id });
  return true;
}
