import { invokeApi } from '../../core/invokeApi';

export interface Orientation {
  id: string;
  name: string;
  value: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getOrientations(): Promise<Orientation[]> {
  const result = await invokeApi<{ itemsList?: Orientation[] }>('/api/grpc/common/orientation/ListOrientations', {});
  return result.itemsList || [];
}

export async function getOrientation(id: string): Promise<Orientation> {
  const result = await invokeApi<Orientation>('/api/grpc/common/orientation/GetOrientation', { id });
  return result;
}

export async function createOrientation(data: { name: string; value: string }): Promise<Orientation> {
  const result = await invokeApi<Orientation>('/api/grpc/common/orientation/CreateOrientation', data);
  return result;
}

export async function updateOrientation(id: string, data: { name: string; value: string }): Promise<Orientation> {
  const result = await invokeApi<Orientation>('/api/grpc/common/orientation/UpdateOrientation', { id, ...data });
  return result;
}

export async function deleteOrientation(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/common/orientation/DeleteOrientation', { id });
  return true;
}
