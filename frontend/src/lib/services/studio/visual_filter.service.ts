import { invokeApi } from '../../core/invokeApi';
import { VisualFilter } from './types';

export async function getVisualFilters(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: VisualFilter[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/visual_filter/ListVisualFilters', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getVisualFilter(id: string): Promise<VisualFilter> {
  const result = await invokeApi<any>('/api/grpc/visual_filter/GetVisualFilter', { id });
  const f = result.filter || result;
  if (!f || !f.id) throw new Error(`VisualFilter ID ${id} tidak ditemukan`);
  return f as VisualFilter;
}

export async function createVisualFilter(data: Omit<VisualFilter, 'id' | 'createdAt'>): Promise<VisualFilter> {
  const result = await invokeApi<any>('/api/grpc/visual_filter/CreateVisualFilter', data);
  const f = result.filter || result;
  if (!f || !f.id) throw new Error('CreateVisualFilter failed');
  return f as VisualFilter;
}

export async function updateVisualFilter(id: string, data: Partial<Omit<VisualFilter, 'id' | 'createdAt'>>): Promise<VisualFilter> {
  const result = await invokeApi<any>('/api/grpc/visual_filter/UpdateVisualFilter', { id, ...data });
  const f = result.filter || result;
  if (!f || !f.id) throw new Error('UpdateVisualFilter failed');
  return f as VisualFilter;
}

export async function deleteVisualFilter(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/visual_filter/DeleteVisualFilter', { id });
  return true;
}
