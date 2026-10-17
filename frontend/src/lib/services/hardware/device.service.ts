import { invokeApi } from '../../core/invokeApi';
import { Device } from './types';

export async function getDevices(params?: { search?: string; page?: number; limit?: number; status?: string }): Promise<{ data: Device[]; total: number }> {
  const result = await invokeApi<any>('/api/grpc/hardware/device/ListDevices', {
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
  const result = await invokeApi<any>('/api/grpc/hardware/device/GetDevice', { id });
  const d = result.device || result;
  if (!d || !d.id) throw new Error(`Device ID ${id} tidak ditemukan`);
  return d as Device;
}

export async function pairDevice(data: { pairingCode: string; deviceName: string; defaultLayoutId?: string; canaryGroupId?: string; }): Promise<Device> {
  const result = await invokeApi<any>('/api/grpc/hardware/device/PairDevice', {
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

export async function updateDevice(id: string, data: {
  name?: string;
  display_group_id?: string;
  status?: string;
  screen_width?: number;
  screen_height?: number;
  orientation?: number;
  timezone?: string;
  schedule_id?: string;
  current_layout_id?: string;
  canary_group_id?: string;
}): Promise<Device> {
  await invokeApi<any>('/api/grpc/hardware/device/UpdateDevice', { id, ...data });
  return getDevice(id);
}

export async function deleteDevice(id: string): Promise<boolean> {
  await invokeApi<any>('/api/grpc/hardware/device/DeleteDevice', { id });
  return true;
}

export enum ServerCommandType {
  COMMAND_UNSPECIFIED = 0,
  COMMAND_RELOAD_MANIFEST = 1,
  COMMAND_CAPTURE_SCREENSHOT = 2,
  COMMAND_REBOOT_PLAYER = 3,
  COMMAND_EMERGENCY_BROADCAST = 4,
  COMMAND_CLEAR_CACHE = 5,
}

export async function pushDeviceCommand(deviceId: string, commandType: ServerCommandType, payloadJson?: string): Promise<{ queued: boolean; commandId: string }> {
  return invokeApi<any>('/api/grpc/distribution/stream/PushCommand', {
    deviceId,
    commandType,
    payloadJson: payloadJson || '',
  });
}

export interface PlaybackRecord {
  id: string;
  deviceId: string;
  deviceName: string;
  mediaId: string;
  mediaName: string;
  layoutId: string;
  layoutName: string;
  startedAt: string;
  durationSeconds: number;
  isCompleted: boolean;
}

export async function listPlaybackLogs(params?: {
  deviceId?: string;
  mediaId?: string;
  limit?: number;
  offset?: number;
}): Promise<{ items: PlaybackRecord[]; totalCount: number }> {
  const res = await invokeApi<any>('/api/grpc/distribution/stream/ListPlaybackLogs', {
    deviceId: params?.deviceId,
    mediaId: params?.mediaId,
    limit: params?.limit || 50,
    offset: params?.offset || 0,
  });
  return {
    items: res.itemsList || [],
    totalCount: res.totalCount || 0,
  };
}

export async function reportPlaybackBatch(
  deviceId: string,
  items: Array<{
    mediaId: string;
    layoutId: string;
    startedAt: number;
    durationSeconds: number;
    isCompleted: boolean;
  }>,
  deviceToken?: string
): Promise<{ success: boolean; recordedCount: number }> {
  return invokeApi<any>('/api/grpc/distribution/stream/ReportPlaybackBatch', {
    deviceId,
    deviceToken: deviceToken || '',
    items,
  });
}



