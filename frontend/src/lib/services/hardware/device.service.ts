import { invokeApi } from '../../core/invokeApi';
import { Device } from './types';

export async function getDevices(params?: { search?: string; page?: number; limit?: number; status?: string }): Promise<{ data: Device[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/device/ListDevices', {
    search: params?.search,
    pagination: { page: params?.page || 1, limit: params?.limit || 25 },
    status: params?.status
  });
  const data: Device[] = result.itemsList || [];
  return {
    data,
    total: result.pagination?.totalItems ?? data.length
  };
}

export async function getDevice(id: string): Promise<Device> {
  const result = await invokeApi<any>('/api/grpc/device/GetDevice', { id });
  const d = result.device || result;
  if (!d || !d.id) throw new Error(`Device ID ${id} tidak ditemukan`);
  return d as Device;
}

export async function pairDevice(data: { pairingCode: string; deviceName: string; defaultLayoutId?: string; canaryGroupId?: string; }): Promise<Device> {
  const result = await invokeApi<any>('/api/grpc/device/PairDevice', {
    pairingCode: data.pairingCode,
    deviceName: data.deviceName,
    default_layout_id: data.defaultLayoutId,
    defaultLayoutId: data.defaultLayoutId,
    canary_group_id: data.canaryGroupId,
    canaryGroupId: data.canaryGroupId,
  });
  const d = result.device || result;
  if (!d || !d.id) throw new Error('Gagal pair device');
  return d as Device;
}

export async function updateDevice(id: string, data: { name?: string; display_group_id?: string; status?: string; screen_width?: number; screen_height?: number; orientation?: number; timezone?: string; schedule_id?: string; }): Promise<Device> {
  await invokeApi<any>('/api/grpc/device/UpdateDevice', { id, ...data });
  return getDevice(id);
}

export async function deleteDevice(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/device/DeleteDevice', { id });
  return true;
}

