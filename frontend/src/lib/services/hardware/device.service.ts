import { invokeApi } from '../../core/invokeApi';
import { Device } from './types';

export async function getDevices(params?: { search?: string; page?: number; limit?: number; status?: string }): Promise<{ data: Device[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/device/ListDevices', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 },
    status: params?.status
  });
  return {
    data: result.devicesList || [],
    total: result.pagination?.totalItems || result.devicesList?.length || 0
  };
}

export async function getDevice(id: string): Promise<Device> {
  const result = await invokeApi<any>('/api/grpc/device/GetDevice', { id });
  if (!result.device) throw new Error(`Device ID ${id} tidak ditemukan`);
  return result.device as Device;
}

export async function pairDevice(data: { pairing_code: string; device_name: string; default_layout_id?: string; canary_group_id?: string; }): Promise<Device> {
  const result = await invokeApi<any>('/api/grpc/device/PairDevice', data);
  if (!result.device) throw new Error('Gagal pair device');
  return result.device as Device;
}

export async function updateDevice(id: string, data: { name?: string; display_group_id?: string; status?: string; screen_width?: number; screen_height?: number; orientation?: number; timezone?: string; schedule_id?: string; }): Promise<Device> {
  await invokeApi<any>('/api/grpc/device/UpdateDevice', { id, ...data });
  return getDevice(id);
}

export async function deleteDevice(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/device/DeleteDevice', { id });
  return true;
}
