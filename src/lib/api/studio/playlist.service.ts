import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Playlist, PlaylistItem } from './types';

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
      const pl: Partial<Playlist> = { items: [] };
      while (pReader.hasMore()) {
        const plTag = pReader.readTag();
        if (!plTag) break;
        if (plTag.fieldNumber === 1) pl.id = pReader.readString();
        else if (plTag.fieldNumber === 2) pl.name = pReader.readString();
        else if (plTag.fieldNumber === 3) pl.description = pReader.readString();
        else if (plTag.fieldNumber === 4) pl.is_shuffle = pReader.readBool();
        else if (plTag.fieldNumber === 5 && plTag.wireType === 2) {
          const iBytes = pReader.readBytes();
          const iReader = new ProtoReader(iBytes);
          const item: Partial<PlaylistItem> = {};
          while (iReader.hasMore()) {
            const iTag = iReader.readTag();
            if (!iTag) break;
            if (iTag.fieldNumber === 1) item.id = iReader.readString();
            else if (iTag.fieldNumber === 3) item.media_id = iReader.readString();
            else if (iTag.fieldNumber === 4) item.duration_seconds = iReader.readInt32();
            else if (iTag.fieldNumber === 5) item.order_index = iReader.readInt32();
            else if (iTag.fieldNumber === 6) item.transition_type = iReader.readString();
            else iReader.skip(iTag.wireType);
          }
          if (item.id) pl.items?.push(item as PlaylistItem);
        } else if (plTag.fieldNumber === 6) pl.created_at = pReader.readString();
        else if (plTag.fieldNumber === 7) pl.updated_at = pReader.readString();
        else pReader.skip(plTag.wireType);
      }
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
      const iReader = new ProtoReader(iBytes);
      const item: Partial<PlaylistItem> = {};
      while (iReader.hasMore()) {
        const iTag = iReader.readTag();
        if (!iTag) break;
        if (iTag.fieldNumber === 1) item.id = iReader.readString();
        else if (iTag.fieldNumber === 3) item.media_id = iReader.readString();
        else if (iTag.fieldNumber === 4) item.duration_seconds = iReader.readInt32();
        else if (iTag.fieldNumber === 5) item.order_index = iReader.readInt32();
        else if (iTag.fieldNumber === 6) item.transition_type = iReader.readString();
        else iReader.skip(iTag.wireType);
      }
      if (item.id) pl.items?.push(item as PlaylistItem);
    } else if (tag.fieldNumber === 6) pl.created_at = reader.readString();
    else if (tag.fieldNumber === 7) pl.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }

  if (!pl.id) throw new Error(`Playlist ID ${id} tidak ditemukan`);
  return pl as Playlist;
}

export async function createPlaylist(data: { name: string; description: string; is_shuffle: boolean }): Promise<Playlist> {
  const writer = new ProtoWriter();
  writer.writeString(1, data.name);
  writer.writeString(2, data.description || '');
  writer.writeBool(3, data.is_shuffle);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'CreatePlaylist', writer);
  const reader = new ProtoReader(resBytes);
  let playlistId = '';
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) playlistId = reader.readString();
    else reader.skip(tag.wireType);
  }
  return getPlaylist(playlistId);
}

export async function updatePlaylist(id: string, data: { name?: string; description?: string; is_shuffle?: boolean }): Promise<Playlist> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.description !== undefined) writer.writeString(3, data.description);
  if (data.is_shuffle !== undefined) writer.writeBool(4, data.is_shuffle);

  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'UpdatePlaylist', writer);
  return getPlaylist(id);
}

export async function deletePlaylist(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.playlist.PlaylistService', 'DeletePlaylist', writer);
  return true;
}
