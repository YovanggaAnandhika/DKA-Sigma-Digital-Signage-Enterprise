import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Role } from './types';

export async function getRoles(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Role[]; total: number }> {
  const writer = new ProtoWriter();
  const pagWriter = new ProtoWriter();
  pagWriter.writeInt32(1, params?.page || 1);
  pagWriter.writeInt32(2, params?.limit || 25);
  writer.writeSubMessage(1, pagWriter);
  if (params?.search) writer.writeString(2, params.search);

  const resBytes = await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'ListRoles', writer);
  const reader = new ProtoReader(resBytes);
  const roles: Role[] = [];
  let total = 0;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      const itemBytes = reader.readBytes();
      const rReader = new ProtoReader(itemBytes);
      const r: Partial<Role> = { permissions: [] };
      while (rReader.hasMore()) {
        const rTag = rReader.readTag();
        if (!rTag) break;
        if (rTag.fieldNumber === 1) r.id = rReader.readString();
        else if (rTag.fieldNumber === 2) r.name = rReader.readString();
        else if (rTag.fieldNumber === 3) r.slug = rReader.readString();
        else if (rTag.fieldNumber === 4) r.description = rReader.readString();
        else if (rTag.fieldNumber === 5 && rTag.wireType === 2) {
          const pBytes = rReader.readBytes();
          const pReader = new ProtoReader(pBytes);
          while (pReader.hasMore()) {
            const pTag = pReader.readTag();
            if (!pTag) break;
            if (pTag.fieldNumber === 2) r.permissions?.push(pReader.readString());
            else pReader.skip(pTag.wireType);
          }
        } else if (rTag.fieldNumber === 6) r.created_at = rReader.readString();
        else if (rTag.fieldNumber === 7) r.updated_at = rReader.readString();
        else rReader.skip(rTag.wireType);
      }
      if (r.id) roles.push(r as Role);
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

  return { data: roles, total: total || roles.length };
}

export async function getRole(id: string): Promise<Role> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);

  const resBytes = await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'GetRole', writer);
  const reader = new ProtoReader(resBytes);
  const r: Partial<Role> = { permissions: [] };

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) r.id = reader.readString();
    else if (tag.fieldNumber === 2) r.name = reader.readString();
    else if (tag.fieldNumber === 3) r.slug = reader.readString();
    else if (tag.fieldNumber === 4) r.description = reader.readString();
    else if (tag.fieldNumber === 5 && tag.wireType === 2) {
      const pBytes = reader.readBytes();
      const pReader = new ProtoReader(pBytes);
      while (pReader.hasMore()) {
        const pTag = pReader.readTag();
        if (!pTag) break;
        if (pTag.fieldNumber === 2) r.permissions?.push(pReader.readString());
        else pReader.skip(pTag.wireType);
      }
    } else if (tag.fieldNumber === 6) r.created_at = reader.readString();
    else if (tag.fieldNumber === 7) r.updated_at = reader.readString();
    else reader.skip(tag.wireType);
  }

  if (!r.id) throw new Error(`Role ID ${id} tidak ditemukan`);
  return r as Role;
}

export async function createRole(data: { name: string; slug: string; description: string; permission_ids?: string[] }): Promise<Role> {
  const writer = new ProtoWriter();
  writer.writeString(1, data.name);
  writer.writeString(2, data.slug);
  writer.writeString(3, data.description || '');
  if (data.permission_ids) {
    for (const pId of data.permission_ids) {
      writer.writeString(4, pId);
    }
  }

  const resBytes = await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'CreateRole', writer);
  const reader = new ProtoReader(resBytes);
  let roleId = '';
  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) roleId = reader.readString();
    else reader.skip(tag.wireType);
  }
  return getRole(roleId);
}

export async function updateRole(id: string, data: { name?: string; description?: string; permission_ids?: string[] }): Promise<Role> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  if (data.name) writer.writeString(2, data.name);
  if (data.description !== undefined) writer.writeString(3, data.description);
  if (data.permission_ids) {
    for (const pId of data.permission_ids) {
      writer.writeString(4, pId);
    }
  }

  await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'UpdateRole', writer);
  return getRole(id);
}

export async function deleteRole(id: string): Promise<boolean> {
  const writer = new ProtoWriter();
  writer.writeString(1, id);
  await invokeGrpcMethod('signage.iam.v1.role.RoleService', 'DeleteRole', writer);
  return true;
}
