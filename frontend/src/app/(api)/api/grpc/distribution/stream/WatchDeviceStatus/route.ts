import { NextRequest, NextResponse } from 'next/server';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { WatchDeviceStatusRequest } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const deviceId = new URL(req.url).searchParams.get('deviceId');
  if (!deviceId) {
    return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
  }

  try {
    const request = new WatchDeviceStatusRequest();
    request.setDeviceId(deviceId);
    const grpcStream = getGrpcClient(StreamServiceClient).watchDeviceStatus(
      request,
      getGrpcMetadataFromRequest(req),
    );

    let cancelStream = () => {};
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        const encoder = new TextEncoder();
        let closed = false;
        let heartbeat: ReturnType<typeof setInterval>;
        const close = (cancel = false) => {
          if (closed) return;
          closed = true;
          clearInterval(heartbeat);
          if (cancel) grpcStream.cancel();
          try {
            controller.close();
          } catch {
            // The browser may already have canceled the response stream.
          }
        };
        const send = (data: string) => {
          if (closed) return;
          try {
            controller.enqueue(encoder.encode(data));
          } catch {
            close(true);
          }
        };
        cancelStream = () => close(true);
        heartbeat = setInterval(() => send(':ping\n\n'), 15_000);

        grpcStream.on('data', (event) => {
          send(`data: ${JSON.stringify(event.toObject())}\n\n`);
        });
        grpcStream.on('error', () => {
          send(`event: error\ndata: ${JSON.stringify({ message: 'Device status stream unavailable' })}\n\n`);
          close();
        });
        grpcStream.on('end', close);
        req.signal.addEventListener('abort', () => close(true), { once: true });
      },
      cancel() {
        cancelStream();
      },
    });

    return new Response(body, {
      headers: {
        'Content-Type': 'text/event-stream; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Accel-Buffering': 'no',
      },
    });
  } catch {
    return NextResponse.json({ error: 'Unable to open device status stream' }, { status: 500 });
  }
}
