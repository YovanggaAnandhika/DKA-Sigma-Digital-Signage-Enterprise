export interface Device {
  id: string;
  name: string;
  pairingCode: string;
  isPaired: boolean;
  deviceToken: string;
  screenWidth: number;
  screenHeight: number;
  orientation: number | string;
  ipAddress: string;
  macAddress: string;
  appVersion: string;
  androidVersion: string;
  storageTotalBytes: number;
  storageFreeBytes: number;
  currentLayoutId: string;
  currentLayoutName: string;
  canaryGroupId: string;
  isOnline: boolean;
  lastHeartbeatAt: string;
  createdAt: string;
  updatedAt: string;
  displayGroupId: string;
  scheduleId: string;
  timezone: string;
}


