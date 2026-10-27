import { NextRequest } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { ListDevicesRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export const dynamic = 'force-dynamic';

/**
 * Server-Sent Events (SSE) Route for Real-time Fleet Status & Telemetry Observability.
 * Broadcasts device online/offline transitions and heartbeats to connected browser CMS clients.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();
  const token = getTokenFromRequest(req);
  const client = getGrpcClient(DeviceServiceClient);

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial handshake event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'connected', timestamp: Date.now() })}\n\n`)
      );

      // 2. Poll fleet status every 3 seconds and push SSE events
      let isRequesting = false;
      const interval = setInterval(() => {
        if (!token || isRequesting) return;
        isRequesting = true;
        const request = new ListDevicesRequest();

        client.listDevices(request, getGrpcMetadata(token), (err: any, response: any) => {
          isRequesting = false;
          if (err || !response) {
            if (err?.code === 16) {
              clearInterval(interval);
            }
            return;
          }

          try {
            const data = response.toObject();
            const items = (data.itemsList || []).map((d: any) => ({
              id: d.id,
              name: d.name,
              isOnline: d.isOnline,
              lastHeartbeatAt: d.lastHeartbeatAt,
              ipAddress: d.ipAddress,
            }));

            controller.enqueue(
              encoder.encode(`event: fleet_status\ndata: ${JSON.stringify({ devices: items, timestamp: Date.now() })}\n\n`)
            );
          } catch (_) {
            clearInterval(interval);
          }
        });
      }, 3000);

      req.signal.addEventListener('abort', () => {
        clearInterval(interval);
        try { controller.close(); } catch (_) {}
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
