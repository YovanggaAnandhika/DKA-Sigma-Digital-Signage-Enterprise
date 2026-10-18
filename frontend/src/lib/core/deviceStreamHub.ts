type DeviceListener = (data: any) => void;

class DeviceStreamHub {
  private listeners: Map<string, Set<DeviceListener>> = new Map();

  subscribe(deviceId: string, listener: DeviceListener): () => void {
    if (!this.listeners.has(deviceId)) {
      this.listeners.set(deviceId, new Set());
    }
    this.listeners.get(deviceId)!.add(listener);

    return () => {
      const set = this.listeners.get(deviceId);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          this.listeners.delete(deviceId);
        }
      }
    };
  }

  broadcast(deviceId: string, data: any) {
    const set = this.listeners.get(deviceId);
    if (set) {
      set.forEach((listener) => {
        try {
          listener(data);
        } catch (_) {}
      });
    }
  }

  hasSubscribers(deviceId: string): boolean {
    const set = this.listeners.get(deviceId);
    return !!set && set.size > 0;
  }
}

const globalForHub = global as unknown as { deviceStreamHub?: DeviceStreamHub };
export const deviceStreamHub = globalForHub.deviceStreamHub || new DeviceStreamHub();
if (process.env.NODE_ENV !== 'production') {
  globalForHub.deviceStreamHub = deviceStreamHub;
}
