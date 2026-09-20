import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { Permission } from './types';

export async function getPermissions(): Promise<Permission[]> {
  const writer = new ProtoWriter();
  const resBytes = await invokeGrpcMethod('signage.iam.v1.permission.PermissionService', 'ListPermissions', writer);
  const reader = new ProtoReader(resBytes);
  const perms: Permission[] = [];

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1 && tag.wireType === 2) {
      const itemBytes = reader.readBytes();
      const pReader = new ProtoReader(itemBytes);
      const p: Partial<Permission> = {};
      while (pReader.hasMore()) {
        const pTag = pReader.readTag();
        if (!pTag) break;
        if (pTag.fieldNumber === 1) p.id = pReader.readString();
        else if (pTag.fieldNumber === 2) p.code = pReader.readString();
        else if (pTag.fieldNumber === 3) p.name = pReader.readString();
        else if (pTag.fieldNumber === 4) p.description = pReader.readString();
        else if (pTag.fieldNumber === 5) p.module = pReader.readString();
        else pReader.skip(pTag.wireType);
      }
      if (p.id) perms.push(p as Permission);
    } else {
      reader.skip(tag.wireType);
    }
  }
  return perms;
}
