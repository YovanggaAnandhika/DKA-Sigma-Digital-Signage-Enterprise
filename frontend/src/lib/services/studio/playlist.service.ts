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
  const result = await invokeApi<any>('/api/grpc/playlist/ListPlaylists', payload);
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getPlaylist(id: string): Promise<Playlist> {
  const result = await invokeApi<any>('/api/grpc/playlist/GetPlaylist', { id });
  const p = result.playlist || result;
  if (!p || !p.id) throw new Error(`Playlist ID ${id} tidak ditemukan`);
  return p as Playlist;
}

export async function createPlaylist(data: { name: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  const result = await invokeApi<any>('/api/grpc/playlist/CreatePlaylist', data);
  if (!result.playlistId) throw new Error('CreatePlaylist: tidak ada ID yang dikembalikan');
  return getPlaylist(result.playlistId);
}

export async function updatePlaylist(id: string, data: { name?: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/playlist/UpdatePlaylist', { id, ...data });
  return getPlaylist(id);
}

export async function deletePlaylist(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/playlist/DeletePlaylist', { id });
  return true;
}

export async function addPlaylistItem(data: { playlist_id: string; media_item_id: string; duration_seconds: number; transition_type?: string; position?: number }): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/playlist/AddPlaylistItem', data);
  return getPlaylist(data.playlist_id);
}

export async function removePlaylistItem(item_id: string, playlist_id: string): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/playlist/RemovePlaylistItem', { id: item_id });
  return getPlaylist(playlist_id);
}

export async function updatePlaylistItem(id: string, data: { duration_seconds?: number; transition_type?: string; position?: number; is_muted?: boolean }): Promise<void> {
  await invokeApi<any>('/api/grpc/playlist/UpdatePlaylistItem', { id, ...data });
}

export async function reorderPlaylistItems(playlist_id: string, item_ids_in_order: string[]): Promise<Playlist> {
  await invokeApi<any>('/api/grpc/playlist/ReorderPlaylistItems', { playlist_id, item_ids_in_order });
  return getPlaylist(playlist_id);
}
