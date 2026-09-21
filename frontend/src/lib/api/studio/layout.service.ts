import { invokeApi } from '../core/invokeApi';
import { Layout } from './types';

export async function getLayouts(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Layout[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/layout/ListLayouts', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.layoutsList || [],
    total: result.pagination?.totalItems || result.layoutsList?.length || 0
  };
}

export async function getLayout(id: string): Promise<Layout> {
  const result = await invokeApi<any>('/api/grpc/layout/GetLayout', { id });
  if (!result.layout) throw new Error(`Layout ID ${id} tidak ditemukan`);
  return result.layout as Layout;
}

export async function createLayout(data: { name: string; description?: string; width: number; height: number; background_color?: string }): Promise<Layout> {
  const result = await invokeApi<any>('/api/grpc/layout/CreateLayout', data);
  if (!result.layout) throw new Error('CreateLayout failed');
  return result.layout as Layout;
}

export async function updateLayout(id: string, data: { name?: string; description?: string; width?: number; height?: number; background_color?: string }): Promise<Layout> {
  const result = await invokeApi<any>('/api/grpc/layout/UpdateLayout', { id, ...data });
  if (!result.layout) throw new Error('UpdateLayout failed');
  return result.layout as Layout;
}

export async function deleteLayout(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/layout/DeleteLayout', { id });
  return true;
}

export async function addZone(data: { layout_id: string; name: string; x: number; y: number; width: number; height: number; z_index: number }): Promise<Layout> {
  await invokeApi<any>('/api/grpc/layout/AddZone', data);
  return getLayout(data.layout_id);
}

export async function updateZone(id: string, data: { name?: string; x?: number; y?: number; width?: number; height?: number; z_index?: number; layout_id: string }): Promise<Layout> {
  await invokeApi<any>('/api/grpc/layout/UpdateZone', { id, ...data });
  return getLayout(data.layout_id);
}

export async function removeZone(id: string, layout_id: string): Promise<Layout> {
  await invokeApi<any>('/api/grpc/layout/RemoveZone', { id });
  return getLayout(layout_id);
}
