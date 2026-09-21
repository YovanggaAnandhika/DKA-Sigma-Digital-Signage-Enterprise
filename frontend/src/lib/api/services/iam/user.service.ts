import { invokeApi } from '../../core/invokeApi';
import { User } from './types';

export async function getUsers(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: User[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/user/ListUsers', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.usersList || [],
    total: result.pagination?.totalItems || result.usersList?.length || 0
  };
}

export async function getUser(id: string): Promise<User> {
  const result = await invokeApi<any>('/api/grpc/user/GetUser', { id });
  if (!result.user) throw new Error(`User ID ${id} tidak ditemukan`);
  return result.user as User;
}

export async function createUser(data: { email: string; full_name: string; role_id: string; password?: string }): Promise<User> {
  const result = await invokeApi<any>('/api/grpc/user/CreateUser', data);
  if (!result.user) throw new Error('CreateUser failed');
  return result.user as User;
}

export async function updateUser(id: string, data: { email?: string; full_name?: string; role_id?: string; is_active?: boolean; password?: string }): Promise<User> {
  const result = await invokeApi<any>('/api/grpc/user/UpdateUser', { id, ...data });
  if (!result.user) throw new Error('UpdateUser failed');
  return result.user as User;
}

export async function deleteUser(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/user/DeleteUser', { id });
  return true;
}
