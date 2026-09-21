import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { DisplayGroup } from './display-group.types';

export async function getDisplayGroups(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: DisplayGroup[]; total: number }> {
  const writer = new ProtoWriter();
  const pagWriter = new ProtoWriter();
  pagWriter.writeInt32(1, params?.page || 1);
  pagWriter.writeInt32(2, params?.limit || 25);
  writer.writeSubMessage(1, pagWriter);
  if (params?.search) writer.writeString(2, params.search);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.display_group.DisplayGroupService', 'ListDisplayGroups', writer);
  const reader = new ProtoReader(resBytes);
  const groups: DisplayGroup[] = [];
  let total = 0;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      const itemBytes = reader.readBytes();
      const dReader = new ProtoReader(itemBytes);
      const group: Partial<DisplayGroup> = {};
      while (dReader.hasMore()) {
        const dTag = dReader.readTag();
        if (!dTag) break;
        if (dTag.fieldNumber === 1) group.id = dReader.readString();
        else if (dTag.fieldNumber === 2) group.name = dReader.readString();
        else if (dTag.fieldNumber === 3) group.description = dReader.readString();
        else if (dTag.fieldNumber === 4) group.default_layout_id = dReader.readString();
        else if (dTag.fieldNumber === 5) group.default_layout_name = dReader.readString();
        else if (dTag.fieldNumber === 6) group.schedule_id = dReader.readString();
        else if (dTag.fieldNumber === 7) group.schedule_name = dReader.readString();
        else if (dTag.fieldNumber === 8) group.created_at = dReader.readString();
        else if (dTag.fieldNumber === 9) group.updated_at = dReader.readString();
        else dReader.skip(dTag.wireType);
      }
      if (group.id) groups.push(group as DisplayGroup);
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

  return { data: groups, total: total || groups.length };
}

export async function createDisplayGroup(data: { name: string; description?: string; default_layout_id?: string; schedule_id?: string }): Promise<DisplayGroup> {
  const writer = new ProtoWriter();
  writer.writeString(1, data.name);
  if (data.description) writer.writeString(2, data.description);
  if (data.default_layout_id) writer.writeString(3, data.default_layout_id);
  if (data.schedule_id) writer.writeString(4, data.schedule_id);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.display_group.DisplayGroupService', 'CreateDisplayGroup', writer);
  return parseDisplayGroup(resBytes);
}

export async function updateDisplayGroup(id: string, data: { name?: string; description?: string; default_layout_id?: string; schedule_id?: string }): Promise<DisplayGroup> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.description) writer.writeString(3, data.description);
  if (data.default_layout_id) writer.writeString(4, data.default_layout_id);
  if (data.schedule_id) writer.writeString(5, data.schedule_id);

  const resBytes = await invokeGrpcMethod('signage.hardware.v1.display_group.DisplayGroupService', 'UpdateDisplayGroup', writer);
  return parseDisplayGroup(resBytes);
}

export async function deleteDisplayGroup(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.hardware.v1.display_group.DisplayGroupService', 'DeleteDisplayGroup', writer);
  return true;
}

function parseDisplayGroup(bytes: Uint8Array): DisplayGroup {
  const reader = new ProtoReader(bytes);
  const group: Partial<DisplayGroup> = {};
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) group.id = reader.readString();
    else if (tag.fieldNumber === 2) group.name = reader.readString();
    else if (tag.fieldNumber === 3) group.description = reader.readString();
    else if (tag.fieldNumber === 4) group.default_layout_id = reader.readString();
    else if (tag.fieldNumber === 5) group.default_layout_name = reader.readString();
    else if (tag.fieldNumber === 6) group.schedule_id = reader.readString();
    else if (tag.fieldNumber === 7) group.schedule_name = reader.readString();
    else if (tag.fieldNumber === 8) group.created_at = reader.readString();
    else if (tag.fieldNumber === 9) group.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }
  if (!group.id) throw new Error('Invalid DisplayGroup data');
  return group as DisplayGroup;
}
