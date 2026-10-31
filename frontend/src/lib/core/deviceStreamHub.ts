import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { StreamClientMessage, HeartbeatPing } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';

type DeviceListener = (data: any) => void;

class DeviceStreamHub {
  private listeners: Map<string, Set<DeviceListener>> = new Map();
  private bridgeStarted = false;

  constructor() {
    this.ensureBackendStreamBridge();
  }

  /**
   * Menghubungkan hub SSE frontend ke gRPC DisplayStream backend agar event yang berasal
   * langsung dari backend (seperti tombol fisik MQTT ESP32 atau sentuhan layar Android)
   * otomatis diteruskan ke browser (Monitor Live, Web Player, dan Tab IoT).
   */
  private ensureBackendStreamBridge() {
    if (this.bridgeStarted || typeof window !== 'undefined') return;
    this.bridgeStarted = true;

    const connect = () => {
      try {
        const client = new StreamServiceClient(getGrpcHost(), getGrpcCredentials());
        const call = client.displayStream();

        const sendPing = () => {
          try {
            const msg = new StreamClientMessage();
            msg.setDeviceId('web-sse-bridge');
            msg.setTimestamp(Date.now());
            const ping = new HeartbeatPing();
            ping.setMemoryPercent(0);
            ping.setStorageFreeBytes(0);
            msg.setPing(ping);
            call.write(msg);
          } catch (_) {}
        };

        sendPing();
        const pingTimer = setInterval(sendPing, 15000);

        call.on('data', (serverMsg: any) => {
          try {
            const obj = serverMsg.toObject ? serverMsg.toObject() : serverMsg;
            const rawJson = obj.payloadJson || obj.payload_json;
            if (rawJson && typeof rawJson === 'string' && rawJson.trim().startsWith('{')) {
              const parsed = JSON.parse(rawJson);
              this.broadcast('all', parsed);
            }
          } catch (_) {}
        });

        const cleanupAndReconnect = () => {
          clearInterval(pingTimer);
          setTimeout(connect, 2000);
        };

        call.on('error', cleanupAndReconnect);
        call.on('end', cleanupAndReconnect);
      } catch (_) {
        setTimeout(connect, 3000);
      }
    };

    connect();
  }

  subscribe(deviceId: string, listener: DeviceListener): () => void {
    this.ensureBackendStreamBridge();
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
    if (deviceId === 'all') {
      this.listeners.forEach((set) => {
        set.forEach((listener) => {
          try {
            listener(data);
          } catch (_) {}
        });
      });
      return;
    }

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
