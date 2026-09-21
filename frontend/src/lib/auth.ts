import { api, getStoredSession, saveSession, clearSession } from './services';
import type { UserSession } from './services/iam';

export type { UserSession };
export { getStoredSession, saveSession, clearSession };

export async function loginWithGrpc(email: string, password: string): Promise<UserSession> {
  return await api.login(email, password);
}
