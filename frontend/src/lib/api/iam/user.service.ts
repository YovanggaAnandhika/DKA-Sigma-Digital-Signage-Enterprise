import { ProtoWriter, ProtoReader, invokeGrpcMethod } from '../core/client';
import { UserSession } from './types';

export async function login(email: string, password: string): Promise<UserSession> {
  const writer = new ProtoWriter();
  writer.writeString(1, email);
  writer.writeString(2, password);

  const resBytes = await invokeGrpcMethod(
    'signage.iam.v1.user.UserService',
    'Login',
    writer
  );

  const reader = new ProtoReader(resBytes);
  let token = '';
  let userSub: { id: string; email: string; fullName: string; permissions: string[] } = {
    id: '',
    email: '',
    fullName: '',
    permissions: [],
  };
  let expiresAt = Date.now() + 86400 * 1000;

  while (reader.hasMore()) {
    const tag = reader.readTag();
    if (!tag) break;
    if (tag.fieldNumber === 1) {
      token = reader.readString();
    } else if (tag.fieldNumber === 2 && tag.wireType === 2) {
      const userBytes = reader.readBytes();
      const uReader = new ProtoReader(userBytes);
      while (uReader.hasMore()) {
        const uTag = uReader.readTag();
        if (!uTag) break;
        if (uTag.fieldNumber === 1) userSub.id = uReader.readString();
        else if (uTag.fieldNumber === 2) userSub.email = uReader.readString();
        else if (uTag.fieldNumber === 3) userSub.fullName = uReader.readString();
        else if (uTag.fieldNumber === 7) userSub.permissions.push(uReader.readString());
        else uReader.skip(uTag.wireType);
      }
    } else if (tag.fieldNumber === 3) {
      expiresAt = reader.readInt64() * 1000;
    } else {
      reader.skip(tag.wireType);
    }
  }

  if (!token) {
    throw new Error('Gagal menerima token autentikasi dari backend');
  }

  const session: UserSession = {
    id: userSub.id,
    email: userSub.email || email,
    fullName: userSub.fullName || 'Signage Administrator',
    token,
    effectivePermissions: userSub.permissions,
    expiresAt,
  };

  if (typeof window !== 'undefined') {
    localStorage.setItem('omnisign_session', JSON.stringify(session));
  }

  return session;
}
