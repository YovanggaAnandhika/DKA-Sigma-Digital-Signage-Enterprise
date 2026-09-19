import { api, UserSession, getStoredSession, saveSession, clearSession } from './api';

export type { UserSession };
export { getStoredSession, saveSession, clearSession };

export async function loginWithGrpc(email: string, password: string): Promise<UserSession> {
  return await api.login(email, password);
}
