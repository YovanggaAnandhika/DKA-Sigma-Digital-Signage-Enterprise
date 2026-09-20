import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Playlist, PlaylistItem } from './types';

// Playlist proto field mapping (playlist.common.proto):
// PlaylistItem: id=1, playlist_id=2, media_item_id=3, media_item=4(msg), position=5, duration_seconds=6, transition_type=7, created_at=8
// Playlist:     id=1, name=2, description=3, is_shuffle=4, items=5(repeated), total_duration_seconds=6, created_at=7, updated_at=8

function decodePlaylistItem(bytes: Uint8Array): PlaylistItem | null {
  const iReader = new ProtoReader(bytes);
  const item: Partial<PlaylistItem> = {};
  while (iReader.hasMore()) {
    const iTag = iReader.readTag();
    if (!iTag) break;
    if (iTag.fieldNumber === 1) item.id = iReader.readString();
    else if (iTag.fieldNumber === 2) iReader.readString(); // playlist_id — skip
    else if (iTag.fieldNumber === 3) item.media_item_id = iReader.readString();
    else if (iTag.fieldNumber === 4 && iTag.wireType === 2) iReader.readBytes(); // embedded media_item — skip for list
    else if (iTag.fieldNumber === 5) item.order_index = iReader.readInt32();
    else if (iTag.fieldNumber === 6) item.duration_seconds = iReader.readInt32();
    else if (iTag.fieldNumber === 7) item.transition_type = iReader.readString();
    else if (iTag.fieldNumber === 8) iReader.readString();
    else if (iTag.fieldNumber === 9) item.is_muted = iReader.readBool();
    else iReader.skip(iTag.wireType);
  }
  return item.id ? (item as PlaylistItem) : null;
}

function decodePlaylist(reader: ProtoReader): Partial<Playlist> {
  const pl: Partial<Playlist> = { items: [] };
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) pl.id = reader.readString();
    else if (tag.fieldNumber === 2) pl.name = reader.readString();
    else if (tag.fieldNumber === 3) pl.description = reader.readString();
    else if (tag.fieldNumber === 4) pl.is_shuffle = reader.readBool();
    else if (tag.fieldNumber === 5 && tag.wireType === 2) {
      const iBytes = reader.readBytes();
      const item = decodePlaylistItem(iBytes);
      if (item) pl.items?.push(item);
    }
    else if (tag.fieldNumber === 6) pl.total_duration_seconds = reader.readInt32();
    else if (tag.fieldNumber === 7) pl.created_at = reader.readString();
    else if (tag.fieldNumber === 8) pl.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }
  return pl;
}

export async function getPlaylists(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Playlist[]; total: number }> {
  const writer = new ProtoWriter();
  const pagWriter = new ProtoWriter();
  pagWriter.writeInt32(1, params?.page || 1);
  pagWriter.writeInt32(2, params?.limit || 25);
  writer.writeSubMessage(1, pagWriter);
  if (params?.search) writer.writeString(2, params.search);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'ListPlaylists', writer);
  const reader = new ProtoReader(resBytes);
  const playlists: Playlist[] = [];
  let total = 0;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      const itemBytes = reader.readBytes();
      const pReader = new ProtoReader(itemBytes);
      const pl = decodePlaylist(pReader);
      if (pl.id) playlists.push(pl as Playlist);
    } else if (tag.fieldNumber === 2 && tag.wireType === 2) {
      const pagBytes = reader.readBytes();
      const pReader = new ProtoReader(pagBytes);
      while (pReader.hasMore()) {
        const pTag = pReader.readTag();
        if (!pTag) break;
        if (pTag.fieldNumber === 3) total = pReader.readInt64();
        else pReader.skip(pTag.wireType);
      }
    } else {
      reader.skip(tag.wireType);
    }
  }

  return { data: playlists, total: total || playlists.length };
}

export async function getPlaylist(id: string): Promise<Playlist> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'GetPlaylist', writer);
  const reader = new ProtoReader(resBytes);
  const pl = decodePlaylist(reader);

  if (!pl.id) throw new Error(`Playlist ID ${id} tidak ditemukan`);
  return pl as Playlist;
}

export async function createPlaylist(data: { name: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  const writer = new ProtoWriter();
  // CreatePlaylistRequest: name=1, description=2, is_shuffle=3
  writer.writeString(1, data.name);
  writer.writeString(2, data.description || '');
  writer.writeBool(3, data.is_shuffle ?? false);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'CreatePlaylist', writer);
  const reader = new ProtoReader(resBytes);
  const pl = decodePlaylist(reader);
  if (!pl.id) throw new Error('CreatePlaylist: tidak ada ID yang dikembalikan');
  return pl as Playlist;
}

export async function updatePlaylist(id: string, data: { name?: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  const writer = new ProtoWriter();
  // UpdatePlaylistRequest: id=1, name=2, description=3, is_shuffle=4
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.description !== undefined) writer.writeString(3, data.description);
  if (data.is_shuffle !== undefined) writer.writeBool(4, data.is_shuffle);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'UpdatePlaylist', writer);
  const reader = new ProtoReader(resBytes);
  const pl = decodePlaylist(reader);
  if (!pl.id) throw new Error(`UpdatePlaylist: ID ${id} tidak ditemukan`);
  return pl as Playlist;
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'DeletePlaylist', writer);
  return true;
}

export async function addPlaylistItem(data: { playlist_id: string; media_item_id: string; duration_seconds: number; transition_type?: string; position?: number }): Promise<Playlist> {
  const writer = new ProtoWriter();
  // AddPlaylistItemRequest: playlist_id=1, media_item_id=2, duration_seconds=3, transition_type=4, position=5
  writer.writeString(1, data.playlist_id);
  writer.writeString(2, data.media_item_id);
  writer.writeInt32(3, data.duration_seconds);
  writer.writeString(4, data.transition_type || 'none');
  if (data.position !== undefined) writer.writeInt32(5, data.position);

  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'AddPlaylistItem', writer);
  return getPlaylist(data.playlist_id);
}

export async function removePlaylistItem(item_id: string, playlist_id: string): Promise<Playlist> {
  const writer = new ProtoWriter();
  // RemovePlaylistItemRequest: id=1
  writer.writeString(1, item_id);
  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'RemovePlaylistItem', writer);
  return getPlaylist(playlist_id);
}

export async function updatePlaylistItem(id: string, data: { duration_seconds?: number; transition_type?: string; position?: number; is_muted?: boolean }): Promise<void> {
  const writer = new ProtoWriter();
  // UpdatePlaylistItemRequest: id=1, duration_seconds=2, transition_type=3, position=4, is_muted=5
  writer.writeString(1, id);
  if (data.duration_seconds !== undefined) writer.writeInt32(2, data.duration_seconds);
  if (data.transition_type) writer.writeString(3, data.transition_type);
  if (data.position !== undefined) writer.writeInt32(4, data.position);
  if (data.is_muted !== undefined) writer.writeBool(5, data.is_muted);
  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'UpdatePlaylistItem', writer);
}

export async function reorderPlaylistItems(playlist_id: string, item_ids_in_order: string[]): Promise<Playlist> {
  const writer = new ProtoWriter();
  // ReorderPlaylistItemsRequest: playlist_id=1, item_ids_in_order=2(repeated string)
  writer.writeString(1, playlist_id);
  for (const item_id of item_ids_in_order) {
    writer.writeString(2, item_id);
  }
  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'ReorderPlaylistItems', writer);
  return getPlaylist(playlist_id);
}
