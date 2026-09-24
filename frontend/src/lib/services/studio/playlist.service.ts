import { invokeApi } from '../../core/invokeApi';
import { Playlist, PlaylistItem } from './types';

export async function getPlaylists(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Playlist[]; total: number }> {
  const payload = {
    search: params?.search,
    pagination: {
      page: params?.page || 1,
      limit: params?.limit || 25
    }
  };
  const result = await invokeApi<any>('/api/grpc/studio/playlist/ListPlaylists', payload);
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getPlaylist(id: string): Promise<Playlist> {
  const result = await invokeApi<any>('/api/grpc/studio/playlist/GetPlaylist', { id });
  const p = result.playlist || result;
  if (!p || !p.id) throw new Error(`Playlist ID ${id} tidak ditemukan`);
  return p as Playlist;
}

export async function createPlaylist(data: { name: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  const result = await invokeApi<any>('/api/grpc/studio/playlist/CreatePlaylist', data);
  const playlistId = result.playlistId || result.id;
  if (!playlistId) throw new Error('CreatePlaylist: tidak ada ID yang dikembalikan');
  return getPlaylist(playlistId);
}

export async function updatePlaylist(id: string, data: { name?: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/studio/playlist/UpdatePlaylist', { id, ...data });
  return getPlaylist(id);
}

export async function deletePlaylist(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/studio/playlist/DeletePlaylist', { id });
  return true;
}

export async function addPlaylistItem(data: { playlistId: string; mediaItemId: string; durationSeconds: number; transitionType?: string; position?: number }): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/studio/playlist/AddPlaylistItem', {
    playlistId: data.playlistId,
    mediaItemId: data.mediaItemId,
    durationSeconds: data.durationSeconds,
    transitionType: data.transitionType,
    position: data.position,
  });
  return getPlaylist(data.playlistId);
}

export async function removePlaylistItem(item_id: string, playlistId: string): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/studio/playlist/RemovePlaylistItem', { id: item_id });
  return getPlaylist(playlistId);
}

export async function updatePlaylistItem(id: string, data: { durationSeconds?: number; transitionType?: string; position?: number; isMuted?: boolean }): Promise<void> {
  await invokeApi<any>('/api/grpc/studio/playlist/UpdatePlaylistItem', { id, ...data });
}

export async function reorderPlaylistItems(playlistId: string, item_ids_in_order: string[]): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/studio/playlist/ReorderPlaylistItems', { playlistId, item_ids_in_order });
  return getPlaylist(playlistId);
}
