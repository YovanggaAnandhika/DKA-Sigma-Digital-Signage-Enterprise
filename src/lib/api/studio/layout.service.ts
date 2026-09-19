import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Layout, Zone } from './types';

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
      const l: Partial<Layout> = { zones: [] };
      while (lReader.hasMore()) {
        const lTag = lReader.readTag();
        if (!lTag) break;
        if (lTag.fieldNumber === 1) l.id = lReader.readString();
        else if (lTag.fieldNumber === 2) l.name = lReader.readString();
        else if (lTag.fieldNumber === 3) l.width = lReader.readInt32();
        else if (lTag.fieldNumber === 4) l.height = lReader.readInt32();
        else if (lTag.fieldNumber === 5) l.orientation = lReader.readString();
        else if (lTag.fieldNumber === 6 && lTag.wireType === 2) {
          const zBytes = lReader.readBytes();
          const zReader = new ProtoReader(zBytes);
          const z: Partial<Zone> = {};
          while (zReader.hasMore()) {
            const zTag = zReader.readTag();
            if (!zTag) break;
            if (zTag.fieldNumber === 1) z.id = zReader.readString();
            else if (zTag.fieldNumber === 2) z.name = zReader.readString();
            else if (zTag.fieldNumber === 3) z.x = zReader.readInt32();
            else if (zTag.fieldNumber === 4) z.y = zReader.readInt32();
            else if (zTag.fieldNumber === 5) z.width = zReader.readInt32();
            else if (zTag.fieldNumber === 6) z.height = zReader.readInt32();
            else if (zTag.fieldNumber === 7) z.z_index = zReader.readInt32();
            else zReader.skip(zTag.wireType);
          }
          if (z.id) l.zones?.push(z as Zone);
        } else if (lTag.fieldNumber === 7) l.created_at = lReader.readString();
        else if (lTag.fieldNumber === 8) l.updated_at = lReader.readString();
        else lReader.skip(lTag.wireType);
      }
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
  const l: Partial<Layout> = { zones: [] };

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) l.id = reader.readString();
    else if (tag.fieldNumber === 2) l.name = reader.readString();
    else if (tag.fieldNumber === 3) l.width = reader.readInt32();
    else if (tag.fieldNumber === 4) l.height = reader.readInt32();
    else if (tag.fieldNumber === 5) l.orientation = reader.readString();
    else if (tag.fieldNumber === 6 && tag.wireType === 2) {
      const zBytes = reader.readBytes();
      const zReader = new ProtoReader(zBytes);
      const z: Partial<Zone> = {};
      while (zReader.hasMore()) {
        const zTag = zReader.readTag();
        if (!zTag) break;
        if (zTag.fieldNumber === 1) z.id = zReader.readString();
        else if (zTag.fieldNumber === 2) z.name = zReader.readString();
        else if (zTag.fieldNumber === 3) z.x = zReader.readInt32();
        else if (zTag.fieldNumber === 4) z.y = zReader.readInt32();
        else if (zTag.fieldNumber === 5) z.width = zReader.readInt32();
        else if (zTag.fieldNumber === 6) z.height = zReader.readInt32();
        else if (zTag.fieldNumber === 7) z.z_index = zReader.readInt32();
        else zReader.skip(zTag.wireType);
      }
      if (z.id) l.zones?.push(z as Zone);
    } else if (tag.fieldNumber === 7) l.created_at = reader.readString();
    else if (tag.fieldNumber === 8) l.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }

  if (!l.id) throw new Error(`Layout ID ${id} tidak ditemukan`);
  return l as Layout;
}

export async function createLayout(data: { name: string; width: number; height: number; orientation: string }): Promise<Layout> {
  const writer = new ProtoWriter();
  writer.writeString(1, data.name);
  writer.writeInt32(2, data.width);
  writer.writeInt32(3, data.height);
  writer.writeString(4, data.orientation);

  const resBytes = await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'CreateLayout', writer);
  const reader = new ProtoReader(resBytes);
  let layoutId = '';
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) layoutId = reader.readString();
    else reader.skip(tag.wireType);
  }
  return getLayout(layoutId);
}

export async function updateLayout(id: string, data: { name?: string; width?: number; height?: number; orientation?: string }): Promise<Layout> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.width) writer.writeInt32(3, data.width);
  if (data.height) writer.writeInt32(4, data.height);
  if (data.orientation) writer.writeString(5, data.orientation);

  await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'UpdateLayout', writer);
  return getLayout(id);
}

export async function deleteLayout(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.studio.v1.layout.LayoutService', 'DeleteLayout', writer);
  return true;
}
