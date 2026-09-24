import { invokeApi } from '../../core/invokeApi';
import { Layout, Layer } from './types';

export async function getLayouts(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Layout[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/studio/layout/ListLayouts', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getLayout(id: string): Promise<Layout> {
  const result = await invokeApi<any>('/api/grpc/studio/layout/GetLayout', { id });
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
  const result = await invokeApi<any>('/api/grpc/studio/layout/CreateLayout', payload);
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
  const result = await invokeApi<any>('/api/grpc/studio/layout/UpdateLayout', { id, ...payload });
  const l = result.layout || result;
  if (!l || !l.id) throw new Error('UpdateLayout failed');
  return l as Layout;
}

export async function deleteLayout(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/studio/layout/DeleteLayout', { id });
  return true;
}

export async function createLayer(data: { layoutId?: string; layout_id?: string; name: string; x: number; y: number; width: number; height: number; zIndex?: number; backgroundColor?: string; }): Promise<any> {
  const result = await invokeApi<any>('/api/grpc/studio/layer/CreateLayer', {
    ...data,
    layout_id: data.layoutId || data.layout_id,
    layoutId: data.layoutId || data.layout_id,
  });
  return result.layer || result;
}

export async function updateLayer(id: string, data: { name?: string; x?: number; y?: number; width?: number; height?: number; zIndex?: number; backgroundColor?: string; layoutId?: string; }): Promise<Layout | any> {
  const payload = {
    ...data,
  };
  const res = await invokeApi<any>('/api/grpc/studio/layer/UpdateLayer', { id, ...payload });
  const targetLayoutId = data.layoutId;
  if (targetLayoutId) {
    return getLayout(targetLayoutId);
  }
  return res;
}

export async function deleteLayer(id: string, layout_id: string): Promise<Layout> {
  await invokeApi<any>('/api/grpc/studio/layer/DeleteLayer', { id });
  return getLayout(layout_id);
}

export async function addPlaylistBlock(layer_id: string, playlistId: string, startTimeSeconds: number, durationSeconds: number): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/layer_block/CreateLayerBlock', { layer_id, playlistId, startTimeSeconds, durationSeconds });
}

export async function addMediaBlock(layer_id: string, media_id: string, startTimeSeconds: number, durationSeconds: number): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/layer_block/CreateLayerBlock', { layer_id, media_item_id: media_id, startTimeSeconds, durationSeconds });
}

export async function updatePlaylistBlock(id: string, data: { startTimeSeconds?: number; durationSeconds?: number; transitionId?: string; isMuted?: boolean; orderIndex?: number; volumeLevel?: number; visualFilterId?: string; }): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/layer_block/UpdateLayerBlock', {
    id,
    ...data,
  });
}

export async function removePlaylistBlock(id: string): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/layer_block/DeleteLayerBlock', { id });
}

export async function setPlaylistItemOverride(layerPlaylistId: string, playlistItemId: string, isMuted: boolean): Promise<any> {
  return await invokeApi<any>('/api/grpc/studio/layer_override/SetItemOverride', {
    layerPlaylistId,
    playlistItemId,
    isMuted
  });
}
