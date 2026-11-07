import { invokeApi } from '../../core/invokeApi';

export interface AppRelease {
  id: string;
  versionCode: number;
  versionName: string;
  apkFileUrl: string;
  fileSizeBytes: number;
  sha256Hash: string;
  releaseNotes: string;
  isForceUpdate: boolean;
  minSupportedVersionCode: number;
  isActive: boolean;
  createdAt: string;
}

export interface DeviceReleaseStatus {
  deviceId: string;
  deviceName: string;
  branchName: string;
  ipAddress: string;
  currentAppVersion: string;
  isUpdated: boolean;
  isOnline: boolean;
  lastSeenAt: string;
}

export interface AppReleaseDetail {
  release: AppRelease;
  totalDevices: number;
  updatedDevicesCount: number;
  outdatedDevicesCount: number;
  devices: DeviceReleaseStatus[];
}

export async function listAppReleases(params?: {
  page?: number;
  pageSize?: number;
  onlyActive?: boolean;
}): Promise<{ items: AppRelease[]; total: number; page: number; pageSize: number }> {
  const res = await invokeApi<{
    itemsList: AppRelease[];
    total: number;
    page: number;
    pageSize: number;
  }>('/api/grpc/system/update/ListAppReleases', {
    page: params?.page || 1,
    pageSize: params?.pageSize || 20,
    onlyActive: params?.onlyActive,
  });
  return {
    items: res.itemsList || [],
    total: res.total || (res.itemsList || []).length,
    page: res.page || 1,
    pageSize: res.pageSize || 20,
  };
}

export async function getLatestAppRelease(currentVersionCode?: number): Promise<AppRelease> {
  return invokeApi<AppRelease>('/api/grpc/system/update/GetLatestAppRelease', { currentVersionCode });
}

export async function getAppRelease(id: string): Promise<AppReleaseDetail> {
  const res = await invokeApi<{
    release: AppRelease;
    totalDevices: number;
    updatedDevicesCount: number;
    outdatedDevicesCount: number;
    devicesList?: DeviceReleaseStatus[];
  }>('/api/grpc/system/update/GetAppRelease', { id });

  return {
    release: res.release,
    totalDevices: res.totalDevices || 0,
    updatedDevicesCount: res.updatedDevicesCount || 0,
    outdatedDevicesCount: res.outdatedDevicesCount || 0,
    devices: res.devicesList || [],
  };
}

export async function createAppRelease(data: {
  versionCode: number;
  versionName: string;
  apkFileUrl: string;
  fileSizeBytes: number;
  sha256Hash: string;
  releaseNotes?: string;
  isForceUpdate?: boolean;
  minSupportedVersionCode?: number;
}): Promise<AppRelease> {
  return invokeApi<AppRelease>('/api/grpc/system/update/CreateAppRelease', data);
}

export async function deleteAppRelease(id: string): Promise<{ success: boolean }> {
  return invokeApi<{ success: boolean }>('/api/grpc/system/update/DeleteAppRelease', { id });
}

export async function toggleAppReleaseActive(id: string, isActive: boolean): Promise<AppRelease> {
  return invokeApi<AppRelease>('/api/grpc/system/update/ToggleAppReleaseActive', { id, isActive });
}
