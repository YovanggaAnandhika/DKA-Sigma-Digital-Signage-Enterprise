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
  sleep_time?: string;
  wake_time?: string;
  power_schedule_enabled?: boolean;
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

export interface DeviceScreenshot {
  id: string;
  deviceId: string;
  fileUrl: string;
  capturedAt: string;
}

export async function listDeviceScreenshots(deviceId: string, limit?: number): Promise<DeviceScreenshot[]> {
  const res = await invokeApi<any>('/api/grpc/distribution/stream/ListDeviceScreenshots', {
    deviceId,
    limit: limit || 10,
  });
  return res.itemsList || [];
}

export interface LatestTelemetry {
  memoryPercent: number;
  storageFreeBytes: number;
  storageTotalBytes: number;
  ipAddress: string;
  currentPlayingMediaId: string;
  reportedAt: string;
}

export async function getLatestDeviceTelemetry(deviceId: string): Promise<LatestTelemetry | null> {
  const res = await invokeApi<any>('/api/grpc/distribution/stream/GetLatestDeviceTelemetry', {
    deviceId,
  });
  return res.telemetry || null;
}

export interface HardwareInputOutput {
  cpu_percent?: number;
  cpuPercent?: number;
  cpu_cores?: number;
  cpuCores?: number;
  ram_used_bytes?: number;
  ramUsedBytes?: number;
  ram_total_bytes?: number;
  ramTotalBytes?: number;
  ram_percent?: number;
  ramPercent?: number;
  storage_free_bytes?: number;
  storageFreeBytes?: number;
  storage_total_bytes?: number;
  storageTotalBytes?: number;
  battery_temp_celsius?: number;
  batteryTempCelsius?: number;
  fps?: number;
  network_type?: string;
  networkType?: string;
}

export interface AssetStats {
  media_id?: string;
  mediaId?: string;
  media_name?: string;
  mediaName?: string;
  mime_type?: string;
  mimeType?: string;
  codec?: string;
  resolution?: string;
  bitrate_kbps?: number;
  bitrateKbps?: number;
  decoder_name?: string;
  decoderName?: string;
  is_hardware_accelerated?: boolean;
  isHardwareAccelerated?: boolean;
  dropped_frames?: number;
  droppedFrames?: number;
  total_frames?: number;
  totalFrames?: number;
  dropped_frame_rate_percent?: number;
  droppedFrameRatePercent?: number;
  playback_status?: string;
  playbackStatus?: string;
  diagnostic_flag?: string;
  diagnosticFlag?: string;
  diagnostic_note?: string;
  diagnosticNote?: string;
}

export interface DeviceAnalyticsRecord {
  id: string;
  deviceId: string;
  inputOutputJson: string;
  assetsStatsJson: string;
  recordedAt: string;
  inputOutput?: HardwareInputOutput;
  assetsStats?: AssetStats;
}

export async function getDeviceAnalyticsHistory(
  deviceId: string,
  timeRange: string = '1h',
  limit: number = 100
): Promise<DeviceAnalyticsRecord[]> {
  const res = await invokeApi<any>('/api/grpc/hardware/device/GetDeviceAnalyticsHistory', {
    deviceId,
    timeRange,
    limit,
  });

  const rawList: any[] = res.recordsList || [];
  return rawList.map((item) => {
    let io: HardwareInputOutput = {};
    let assets: AssetStats = {};
    try {
      io = JSON.parse(item.inputOutputJson || '{}');
    } catch (_) {}
    try {
      assets = JSON.parse(item.assetsStatsJson || '{}');
    } catch (_) {}

    return {
      id: item.id,
      deviceId: item.deviceId,
      inputOutputJson: item.inputOutputJson,
      assetsStatsJson: item.assetsStatsJson,
      recordedAt: item.recordedAt,
      inputOutput: io,
      assetsStats: assets,
    };
  });
}





