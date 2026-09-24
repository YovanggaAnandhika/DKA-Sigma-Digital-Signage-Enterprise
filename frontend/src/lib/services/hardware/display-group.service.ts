import { invokeApi } from '../../core/invokeApi';
import { DisplayGroup } from './display-group.types';

export async function getDisplayGroups(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: DisplayGroup[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/hardware/display_group/ListDisplayGroups', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function createDisplayGroup(data: { name: string; description?: string }): Promise<DisplayGroup> {
  const result = await invokeApi<any>('/api/grpc/hardware/display_group/CreateDisplayGroup', data);
  const g = result.group || result;
  if (!g || !g.id) throw new Error('CreateDisplayGroup failed');
  return g as DisplayGroup;
}

export async function updateDisplayGroup(id: string, data: { name?: string; description?: string; default_layout_id?: string; schedule_id?: string; }): Promise<DisplayGroup> {
  const result = await invokeApi<any>('/api/grpc/hardware/display_group/UpdateDisplayGroup', { id, ...data });
  const g = result.group || result;
  if (!g || !g.id) throw new Error('UpdateDisplayGroup failed');
  return g as DisplayGroup;
}

export async function deleteDisplayGroup(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/hardware/display_group/DeleteDisplayGroup', { id });
  return true;
}
