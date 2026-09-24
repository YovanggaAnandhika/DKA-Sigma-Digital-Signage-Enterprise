import { invokeApi } from '../../core/invokeApi';
import { User } from './types';

export async function getUsers(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: User[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/iam/user/ListUsers', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.itemsList || [],
    total: result.pagination?.totalItems || result.itemsList?.length || 0
  };
}

export async function getUser(id: string): Promise<User> {
  const result = await invokeApi<any>('/api/grpc/iam/user/GetUser', { id });
  const u = result.user || result;
  if (!u || !u.id) throw new Error(`User ID ${id} tidak ditemukan`);
  return u as User;
}

export async function createUser(data: { email: string; full_name: string; role_id: string; password?: string }): Promise<User> {
  const result = await invokeApi<any>('/api/grpc/iam/user/CreateUser', data);
  const u = result.user || result;
  if (!u || !u.id) throw new Error('CreateUser failed');
  return u as User;
}

export async function updateUser(id: string, data: { email?: string; full_name?: string; role_id?: string; is_active?: boolean; password?: string }): Promise<User> {
  const result = await invokeApi<any>('/api/grpc/iam/user/UpdateUser', { id, ...data });
  const u = result.user || result;
  if (!u || !u.id) throw new Error('UpdateUser failed');
  return u as User;
}

export async function deleteUser(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/iam/user/DeleteUser', { id });
  return true;
}

export async function login(email: string, password: string): Promise<any> {
  const result = await invokeApi<any>('/api/auth/login', { email, password });
  return result;
}
