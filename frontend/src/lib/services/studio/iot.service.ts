import { invokeApi } from '@/lib/core/invokeApi';

export interface IotPinMapping {
  pin: number;
  action: string;
  enabled: boolean;
  label: string;
}

export interface IotDevice {
  id: string;
  deviceUid: string;
  name: string;
  deviceRole: string;
  pinMappingsList: IotPinMapping[];
  isActive: boolean;
  isApproved: boolean;
  ipAddress: string;
  firmwareVersion: string;
  lastSeenAt: string;
  lastAction: string;
}

export async function listIotDevices(): Promise<IotDevice[]> {
  const response = await invokeApi<{ itemsList?: IotDevice[] }>('/api/grpc/iot/device/ListDevices', {});
  return response.itemsList ?? [];
}

export async function approveIotDevice(id: string): Promise<IotDevice> {
  return invokeApi('/api/grpc/iot/device/ApproveDevice', { id });
}

export async function updateIotDevice(device: {
  id: string;
  name: string;
  deviceRole: string;
  pinMappings: IotPinMapping[];
  isActive: boolean;
}): Promise<IotDevice> {
  return invokeApi('/api/grpc/iot/device/UpdateDevice', device);
}

export async function deleteIotDevice(id: string): Promise<void> {
  await invokeApi('/api/grpc/iot/device/DeleteDevice', { id });
}

export async function triggerIotDeviceAction(deviceUid: string, pin: number) {
  return invokeApi<{ success: boolean; action: string; message: string }>(
    '/api/grpc/iot/device/TriggerAction',
    { deviceUid, pin }
  );
}

export interface QueueIotBinding {
  iotDeviceId: string;
  deviceUid: string;
  deviceName: string;
  deviceRole: string;
  counterId: string;
  counterName: string;
  isActive: boolean;
  isBound: boolean;
}

export async function listQueueIotBindings(queueDisplayId: string): Promise<QueueIotBinding[]> {
  const response = await invokeApi<{ itemsList?: QueueIotBinding[] }>(
    '/api/grpc/studio/queue/binding/ListBindings',
    { queueDisplayId }
  );
  return response.itemsList ?? [];
}

export async function bindIotDevice(queueDisplayId: string, iotDeviceId: string, counterId?: string) {
  return invokeApi('/api/grpc/studio/queue/binding/BindDevice', {
    queueDisplayId,
    iotDeviceId,
    counterId,
  });
}

export async function unbindIotDevice(queueDisplayId: string, iotDeviceId: string) {
  return invokeApi('/api/grpc/studio/queue/binding/UnbindDevice', { queueDisplayId, iotDeviceId });
}
