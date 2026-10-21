import { invokeApi } from '@/lib/core/invokeApi';

export interface PinMappingData {
  pin: number;
  action: 'CALL_NEXT' | 'RECALL' | 'CALL_PREV' | 'TOGGLE_BREAK' | 'TOGGLE_CLOSE' | 'ISSUE_TICKET' | string;
  enabled: boolean;
  label?: string;
}

export interface DiscoveredDeviceData {
  deviceUid: string;
  ipAddress?: string;
  firmwareVersion?: string;
  lastSeenAt?: string;
  isPaired: boolean;
  boundDisplayName?: string;
}

export interface QueueIotDeviceData {
  id: string;
  queueDisplayId: string;
  deviceUid: string;
  name: string;
  deviceRole: 'COUNTER_REMOTE' | 'TICKET_DISPENSER' | 'HYBRID' | string;
  counterId?: string;
  ticketPrefix?: string;
  pinMappings: PinMappingData[];
  isActive: boolean;
  ipAddress?: string;
  firmwareVersion?: string;
  lastSeenAt?: string;
  lastAction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listDiscoveredDevices(): Promise<DiscoveredDeviceData[]> {
  const res = await invokeApi<{ itemsList?: any[]; items?: any[] }>(
    '/api/grpc/studio/queue/device/ListDiscoveredDevices',
    {}
  );
  const items = res?.itemsList || res?.items || [];
  return items.map((d: any) => ({
    deviceUid: d.deviceUid || d.device_uid,
    ipAddress: d.ipAddress || d.ip_address,
    firmwareVersion: d.firmwareVersion || d.firmware_version,
    lastSeenAt: d.lastSeenAt || d.last_seen_at,
    isPaired: Boolean(d.isPaired ?? d.is_paired),
    boundDisplayName: d.boundDisplayName || d.bound_display_name,
  }));
}

export async function listQueueDevices(queueDisplayId: string): Promise<QueueIotDeviceData[]> {
  const res = await invokeApi<{ itemsList?: any[]; items?: any[] }>(
    '/api/grpc/studio/queue/device/ListDevices',
    { queueDisplayId }
  );
  const items = res?.itemsList || res?.items || [];
  return items.map((d: any) => ({
    id: d.id,
    queueDisplayId: d.queueDisplayId || d.queue_display_id,
    deviceUid: d.deviceUid || d.device_uid,
    name: d.name,
    deviceRole: d.deviceRole || d.device_role || 'COUNTER_REMOTE',
    counterId: d.counterId || d.counter_id,
    ticketPrefix: d.ticketPrefix || d.ticket_prefix || 'A',
    pinMappings: (d.pinMappingsList || d.pin_mappings || []).map((p: any) => ({
      pin: Number(p.pin),
      action: p.action,
      enabled: p.enabled !== undefined ? Boolean(p.enabled) : true,
      label: p.label || '',
    })),
    isActive: d.isActive !== undefined ? Boolean(d.isActive) : true,
    ipAddress: d.ipAddress || d.ip_address,
    firmwareVersion: d.firmwareVersion || d.firmware_version,
    lastSeenAt: d.lastSeenAt || d.last_seen_at,
    lastAction: d.lastAction || d.last_action,
    createdAt: d.createdAt || d.created_at,
    updatedAt: d.updatedAt || d.updated_at,
  }));
}

export async function registerQueueDevice(payload: {
  queueDisplayId: string;
  deviceUid: string;
  name: string;
  deviceRole: string;
  counterId?: string;
  ticketPrefix?: string;
  pinMappings: PinMappingData[];
  isActive: boolean;
}): Promise<any> {
  return await invokeApi('/api/grpc/studio/queue/device/RegisterDevice', payload);
}

export async function updateQueueDevice(payload: {
  id: string;
  name: string;
  deviceRole: string;
  counterId?: string;
  ticketPrefix?: string;
  pinMappings: PinMappingData[];
  isActive: boolean;
}): Promise<any> {
  return await invokeApi('/api/grpc/studio/queue/device/UpdateDevice', payload);
}

export async function deleteQueueDevice(id: string): Promise<any> {
  return await invokeApi('/api/grpc/studio/queue/device/DeleteDevice', { id });
}

export async function triggerQueueDeviceAction(
  queueDisplayId: string,
  deviceUid: string,
  pin: number
): Promise<{ success: boolean; action: string; message: string }> {
  return await invokeApi('/api/grpc/studio/queue/device/TriggerAction', {
    queueDisplayId,
    deviceUid,
    pin,
  });
}
