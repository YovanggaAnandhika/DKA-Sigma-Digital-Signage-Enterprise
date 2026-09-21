import { invokeApi } from '../../core/invokeApi';
import { Layout } from './types';

export async function getLayouts(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Layout[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/layout/ListLayouts', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getLayout(id: string): Promise<Layout> {
  const result = await invokeApi<any>('/api/grpc/layout/GetLayout', { id });
  const l = result.layout || result;
  if (!l || !l.id) throw new Error(`Layout ID ${id} tidak ditemukan`);
  return l as Layout;
}

export async function createLayout(data: { name: string; description?: string; canvas_width: number; canvas_height: number; background_color?: string }): Promise<Layout> {
  const payload = {
    ...data,
    width: data.canvas_width,
    height: data.canvas_height
  };
  const result = await invokeApi<any>('/api/grpc/layout/CreateLayout', payload);
  const l = result.layout || result;
  if (!l || !l.id) throw new Error('CreateLayout failed');
  return l as Layout;
}

export async function updateLayout(id: string, data: { name?: string; description?: string; canvas_width?: number; canvas_height?: number; background_color?: string }): Promise<Layout> {
  const payload = {
    ...data,
    width: data.canvas_width,
    height: data.canvas_height
  };
  const result = await invokeApi<any>('/api/grpc/layout/UpdateLayout', { id, ...payload });
  const l = result.layout || result;
  if (!l || !l.id) throw new Error('UpdateLayout failed');
  return l as Layout;
}

export async function deleteLayout(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/layout/DeleteLayout', { id });
  return true;
}

export async function createZone(data: { layout_id: string; name: string; x: number; y: number; width: number; height: number; z_index: number; background_color?: string }): Promise<Layout> {
  await invokeApi<any>('/api/grpc/layout/CreateZone', data);
  return getLayout(data.layout_id);
}

export async function updateZone(id: string, data: { name?: string; x?: number; y?: number; width?: number; height?: number; z_index?: number; background_color?: string; layout_id?: string }): Promise<Layout | any> {
  const res = await invokeApi<any>('/api/grpc/layout/UpdateZone', { id, ...data });
  if (data.layout_id) {
    return getLayout(data.layout_id);
  }
  return res;
}

export async function deleteZone(id: string, layout_id: string): Promise<Layout> {
  await invokeApi<any>('/api/grpc/layout/DeleteZone', { id });
  return getLayout(layout_id);
}

export async function addPlaylistBlock(zone_id: string, playlist_id: string, start_time_seconds: number, duration_seconds: number): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/AddPlaylistBlock', { zone_id, playlist_id, start_time_seconds, duration_seconds });
}

export async function updatePlaylistBlock(id: string, data: { start_time_seconds?: number; duration_seconds?: number; transition_type?: string; }): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/UpdatePlaylistBlock', { id, ...data });
}

export async function addMediaBlock(zone_id: string, media_id: string, start_time_seconds: number, duration_seconds: number): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/AddMediaBlock', { zone_id, media_id, start_time_seconds, duration_seconds });
}

export async function setPlaylistItemOverride(zone_playlist_id: string, playlist_item_id: string, is_muted: boolean): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/SetPlaylistItemOverride', { zone_playlist_id, playlist_item_id, is_muted });
}

export async function removePlaylistBlock(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/RemovePlaylistBlock', { id });
}

