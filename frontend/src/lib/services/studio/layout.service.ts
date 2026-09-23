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

export async function createLayout(data: { name: string; description?: string; canvasWidth: number; canvasHeight: number; background_color?: string }): Promise<Layout> {
  const payload = {
    ...data,
    width: data.canvasWidth,
    height: data.canvasHeight
  };
  const result = await invokeApi<any>('/api/grpc/layout/CreateLayout', payload);
  const l = result.layout || result;
  if (!l || !l.id) throw new Error('CreateLayout failed');
  return l as Layout;
}

export async function updateLayout(id: string, data: { name?: string; description?: string; canvasWidth?: number; canvasHeight?: number; background_color?: string }): Promise<Layout> {
  const payload = {
    ...data,
    width: data.canvasWidth,
    height: data.canvasHeight
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

export async function createZone(data: { layoutId?: string; layout_id?: string; name: string; x: number; y: number; width: number; height: number; zIndex: number; backgroundColor?: string; background_color?: string }): Promise<any> {
  const result = await invokeApi<any>('/api/grpc/layout/CreateZone', {
    ...data,
    layout_id: data.layoutId || data.layout_id,
    layoutId: data.layoutId || data.layout_id,
    backgroundColor: data.backgroundColor || data.background_color,
  });
  return result.zone || result;
}

export async function updateZone(id: string, data: { name?: string; x?: number; y?: number; width?: number; height?: number; zIndex?: number; z_index?: number; backgroundColor?: string; background_color?: string; layoutId?: string; layout_id?: string }): Promise<Layout | any> {
  const payload = {
    ...data,
    zIndex: data.zIndex ?? data.z_index,
    backgroundColor: data.backgroundColor || data.background_color,
    background_color: data.backgroundColor || data.background_color,
  };
  const res = await invokeApi<any>('/api/grpc/layout/UpdateZone', { id, ...payload });
  const targetLayoutId = data.layoutId || data.layout_id;
  if (targetLayoutId) {
    return getLayout(targetLayoutId);
  }
  return res;
}

export async function deleteZone(id: string, layout_id: string): Promise<Layout> {
  await invokeApi<any>('/api/grpc/layout/DeleteZone', { id });
  return getLayout(layout_id);
}

export async function addPlaylistBlock(zone_id: string, playlistId: string, startTimeSeconds: number, durationSeconds: number): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/AddPlaylistBlock', { zone_id, playlistId, startTimeSeconds, durationSeconds });
}

export async function updatePlaylistBlock(id: string, data: { startTimeSeconds?: number; durationSeconds?: number; transitionType?: string; transition_type?: string; isMuted?: boolean; position?: number; }): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/UpdatePlaylistBlock', {
    id,
    ...data,
    transitionType: data.transitionType || data.transition_type,
  });
}

export async function addMediaBlock(zone_id: string, media_id: string, startTimeSeconds: number, durationSeconds: number): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/AddMediaBlock', { zone_id, media_id, startTimeSeconds, durationSeconds });
}

export async function setPlaylistItemOverride(zonePlaylistId: string, playlistItemId: string, isMuted: boolean): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/SetPlaylistItemOverride', {
    zonePlaylistId,
    zone_playlistId: zonePlaylistId,
    zone_playlist_id: zonePlaylistId,
    playlistItemId,
    isMuted
  });
}

export async function removePlaylistBlock(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/layout/RemovePlaylistBlock', { id });
}

