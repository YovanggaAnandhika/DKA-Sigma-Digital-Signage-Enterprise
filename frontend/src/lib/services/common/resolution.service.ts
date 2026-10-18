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
