import { invokeApi } from '../../core/invokeApi';

export interface Resolution {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function getResolutions(): Promise<Resolution[]> {
  const result = await invokeApi<{ itemsList?: Resolution[] }>('/api/grpc/common/resolution/ListResolutions', {});
  return result.itemsList || [];
}

export async function getResolution(id: string): Promise<Resolution> {
  const result = await invokeApi<Resolution>('/api/grpc/common/resolution/GetResolution', { id });
  return result;
}

export async function createResolution(data: { name: string; width: number; height: number; aspectRatio?: string }): Promise<Resolution> {
  const result = await invokeApi<Resolution>('/api/grpc/common/resolution/CreateResolution', data);
  return result;
}

export async function updateResolution(id: string, data: { name: string; width: number; height: number; aspectRatio?: string }): Promise<Resolution> {
  const result = await invokeApi<Resolution>('/api/grpc/common/resolution/UpdateResolution', { id, ...data });
  return result;
}

export async function deleteResolution(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/common/resolution/DeleteResolution', { id });
  return true;
}

