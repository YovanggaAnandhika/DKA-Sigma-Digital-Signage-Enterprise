import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Layout, Zone } from './types';

// Layout proto field mapping (layout.common.proto):
// Layout: id=1, name=2, description=3, canvas_width=4, canvas_height=5, orientation=6(enum), background_color=7, background_image_url=8, zones=9, created_at=10, updated_at=11
// Zone:   id=1, layout_id=2, name=3, x=4, y=5, width=6, height=7, z_index=8, assigned_playlist_id=9, assigned_playlist=10, background_color=11, created_at=12, updated_at=13

function decodeZone(bytes: Uint8Array): Zone | null {
  const zReader = new ProtoReader(bytes);
  const z: Partial<Zone> = {};
  while (zReader.hasMore()) {
    const zTag = zReader.readTag();
    if (!zTag) break;
    if (zTag.fieldNumber === 1) z.id = zReader.readString();
    else if (zTag.fieldNumber === 2) zReader.readString(); // layout_id — skip
    else if (zTag.fieldNumber === 3) z.name = zReader.readString();
    else if (zTag.fieldNumber === 4) z.x = zReader.readInt32();
    else if (zTag.fieldNumber === 5) z.y = zReader.readInt32();
    else if (zTag.fieldNumber === 6) z.width = zReader.readInt32();
    else if (zTag.fieldNumber === 7) z.height = zReader.readInt32();
    else if (zTag.fieldNumber === 8) z.z_index = zReader.readInt32();
    else if (zTag.fieldNumber === 9) z.assigned_playlist_id = zReader.readString();
    else if (zTag.fieldNumber === 11) z.background_color = zReader.readString();
    else zReader.skip(zTag.wireType);
  }
  return z.id ? (z as Zone) : null;
}

function decodeLayout(reader: ProtoReader): Partial<Layout> {
  const l: Partial<Layout> = { zones: [] };
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) l.id = reader.readString();
    else if (tag.fieldNumber === 2) l.name = reader.readString();
    else if (tag.fieldNumber === 3) l.description = reader.readString();
    else if (tag.fieldNumber === 4) l.canvas_width = reader.readInt32();
    else if (tag.fieldNumber === 5) l.canvas_height = reader.readInt32();
    else if (tag.fieldNumber === 6) l.orientation = reader.readVarint() === 2 ? 'portrait' : 'landscape';
    else if (tag.fieldNumber === 7) l.background_color = reader.readString();
    else if (tag.fieldNumber === 8) l.background_image_url = reader.readString();
    else if (tag.fieldNumber === 9 && tag.wireType === 2) {
      const zBytes = reader.readBytes();
      const z = decodeZone(zBytes);
      if (z) l.zones?.push(z);
    }
    else if (tag.fieldNumber === 10) l.created_at = reader.readString();
    else if (tag.fieldNumber === 11) l.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }
  return l;
}

export async function getLayouts(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Layout[]; total: number }> {
  const writer = new ProtoWriter();
  const pagWriter = new ProtoWriter();
  pagWriter.writeInt32(1, params?.page || 1);
  pagWriter.writeInt32(2, params?.limit || 25);
  writer.writeSubMessage(1, pagWriter);
  if (params?.search) writer.writeString(2, params.search);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'ListLayouts', writer);
  const reader = new ProtoReader(resBytes);
  const layouts: Layout[] = [];
  let total = 0;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      const itemBytes = reader.readBytes();
      const lReader = new ProtoReader(itemBytes);
      const l = decodeLayout(lReader);
      if (l.id) layouts.push(l as Layout);
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

  return { data: layouts, total: total || layouts.length };
}

export async function getLayout(id: string): Promise<Layout> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'GetLayout', writer);
  const reader = new ProtoReader(resBytes);
  const l = decodeLayout(reader);

  if (!l.id) throw new Error(`Layout ID ${id} tidak ditemukan`);
  return l as Layout;
}

export async function createLayout(data: { name: string; description?: string; canvas_width: number; canvas_height: number; orientation: string; background_color?: string }): Promise<Layout> {
  const writer = new ProtoWriter();
  // CreateLayoutRequest: name=1, description=2, canvas_width=3, canvas_height=4, orientation=5(enum), background_color=6, background_image_url=7
  writer.writeString(1, data.name);
  if (data.description) writer.writeString(2, data.description);
  writer.writeInt32(3, data.canvas_width);
  writer.writeInt32(4, data.canvas_height);
  writer.writeInt32(5, data.orientation === 'portrait' ? 2 : 1); // DeviceOrientation enum
  if (data.background_color) writer.writeString(6, data.background_color);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'CreateLayout', writer);
  const reader = new ProtoReader(resBytes);
  const l = decodeLayout(reader);
  if (!l.id) throw new Error('CreateLayout: tidak ada ID yang dikembalikan');
  return l as Layout;
}

export async function updateLayout(id: string, data: { name?: string; description?: string; canvas_width?: number; canvas_height?: number; orientation?: string; background_color?: string }): Promise<Layout> {
  const writer = new ProtoWriter();
  // UpdateLayoutRequest: id=1, name=2, description=3, canvas_width=4, canvas_height=5, orientation=6(enum), background_color=7, background_image_url=8
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.description !== undefined) writer.writeString(3, data.description);
  if (data.canvas_width) writer.writeInt32(4, data.canvas_width);
  if (data.canvas_height) writer.writeInt32(5, data.canvas_height);
  if (data.orientation) writer.writeInt32(6, data.orientation === 'portrait' ? 2 : 1);
  if (data.background_color) writer.writeString(7, data.background_color);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'UpdateLayout', writer);
  const reader = new ProtoReader(resBytes);
  const l = decodeLayout(reader);
  if (!l.id) throw new Error(`UpdateLayout: ID ${id} tidak ditemukan`);
  return l as Layout;
}

export async function deleteLayout(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'DeleteLayout', writer);
  return true;
}

// Zone operations
export async function createZone(data: { layout_id: string; name: string; x: number; y: number; width: number; height: number; z_index: number; assigned_playlist_id?: string; background_color?: string }): Promise<Zone> {
  const writer = new ProtoWriter();
  // CreateZoneRequest: layout_id=1, name=2, x=3, y=4, width=5, height=6, z_index=7, assigned_playlist_id=8, background_color=9
  writer.writeString(1, data.layout_id);
  writer.writeString(2, data.name);
  writer.writeInt32(3, data.x);
  writer.writeInt32(4, data.y);
  writer.writeInt32(5, data.width);
  writer.writeInt32(6, data.height);
  writer.writeInt32(7, data.z_index);
  if (data.assigned_playlist_id) writer.writeString(8, data.assigned_playlist_id);
  if (data.background_color) writer.writeString(9, data.background_color);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'CreateZone', writer);
  const reader = new ProtoReader(resBytes);
  const z = decodeZone(resBytes);
  if (!z) throw new Error('CreateZone gagal');
  return z;
}

export async function updateZone(id: string, data: { name?: string; x?: number; y?: number; width?: number; height?: number; z_index?: number; assigned_playlist_id?: string; background_color?: string }): Promise<Zone> {
  const writer = new ProtoWriter();
  // UpdateZoneRequest: id=1, name=2, x=3, y=4, width=5, height=6, z_index=7, assigned_playlist_id=8, background_color=9
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.x !== undefined) writer.writeInt32(3, data.x);
  if (data.y !== undefined) writer.writeInt32(4, data.y);
  if (data.width) writer.writeInt32(5, data.width);
  if (data.height) writer.writeInt32(6, data.height);
  if (data.z_index !== undefined) writer.writeInt32(7, data.z_index);
  if (data.assigned_playlist_id !== undefined) writer.writeString(8, data.assigned_playlist_id);
  if (data.background_color) writer.writeString(9, data.background_color);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'UpdateZone', writer);
  const z = decodeZone(resBytes);
  if (!z) throw new Error('UpdateZone gagal');
  return z;
}

export async function deleteZone(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'DeleteZone', writer);
  return true;
}

export async function assignPlaylistToZone(zone_id: string, playlist_id: string): Promise<Zone> {
  const writer = new ProtoWriter();
  // AssignPlaylistToZoneRequest: zone_id=1, playlist_id=2
  writer.writeString(1, zone_id);
  writer.writeString(2, playlist_id);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'AssignPlaylistToZone', writer);
  // AssignPlaylistToZoneResponse: success=1, zone=2
  const reader = new ProtoReader(resBytes);
  let zone: Zone | null = null;
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 2 && tag.wireType === 2) {
      zone = decodeZone(reader.readBytes());
    } else {
      reader.skip(tag.wireType);
    }
  }
  if (!zone) throw new Error('AssignPlaylistToZone gagal');
  return zone;
}
