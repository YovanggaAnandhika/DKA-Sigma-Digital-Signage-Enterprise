import { invokeApi } from '../../core/invokeApi';
import { Transition } from './types';

export async function getTransitions(params?: { search?: string; page?: number; limit?: number }): Promise<{ data: Transition[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/transition/ListTransitions', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 }
  });
  return {
    data: result.transitionsList || result.itemsList || [],
    total: result.pagination?.totalItems || result.transitionsList?.length || result.itemsList?.length || 0
  };
}

export async function getTransition(id: string): Promise<Transition> {
  const result = await invokeApi<any>('/api/grpc/transition/GetTransition', { id });
  const t = result.transition || result;
  if (!t || !t.id) throw new Error(`Transition ID ${id} tidak ditemukan`);
  return t as Transition;
}

export async function createTransition(data: Omit<Transition, 'id' | 'createdAt'>): Promise<Transition> {
  const result = await invokeApi<any>('/api/grpc/transition/CreateTransition', data);
  const t = result.transition || result;
  if (!t || !t.id) throw new Error('CreateTransition failed');
  return t as Transition;
}

export async function updateTransition(id: string, data: Partial<Omit<Transition, 'id' | 'createdAt'>>): Promise<Transition> {
  const result = await invokeApi<any>('/api/grpc/transition/UpdateTransition', { id, ...data });
  const t = result.transition || result;
  if (!t || !t.id) throw new Error('UpdateTransition failed');
  return t as Transition;
}

export async function deleteTransition(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/transition/DeleteTransition', { id });
  return true;
}
