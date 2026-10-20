import { NextRequest, NextResponse } from 'next/server';
import { deviceStreamHub } from '@/lib/core/deviceStreamHub';
import { StreamServiceClient } from '@/lib/api/distribution/v1/stream/stream_grpc_pb';
import { PushCommandRequest, ServerCommandType } from '@/lib/api/distribution/v1/stream/stream.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export const dynamic = 'force-dynamic';

const NATIVE_COMMANDS: Record<string, ServerCommandType> = {
  RELOAD: ServerCommandType.COMMAND_RELOAD_MANIFEST,
  CLEAR_CACHE: ServerCommandType.COMMAND_CLEAR_CACHE,
  CAPTURE_SCREENSHOT: ServerCommandType.COMMAND_CAPTURE_SCREENSHOT,
  SCREENSHOT: ServerCommandType.COMMAND_CAPTURE_SCREENSHOT,
  REBOOT: ServerCommandType.COMMAND_REBOOT_PLAYER,
};

// shortcut: stub frontend belum punya COMMAND_CUSTOM (protoc grpc-tools arm64 gagal); upgrade saat generator tersedia.
const COMMAND_CUSTOM = 6 as ServerCommandType;

function pushCommand(deviceId: string, commandType: ServerCommandType, payloadJson: string, token: string) {
  return new Promise<void>((resolve) => {
    const client = new StreamServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new PushCommandRequest();
    request.setDeviceId(deviceId);
    request.setCommandType(commandType);
    request.setPayloadJson(payloadJson);
    client.pushCommand(request, getGrpcMetadata(token), () => {
      client.close();
      resolve();
    });
  });
}

/**
 * GET /api/stream/device?deviceId=<id>
 * Establishes real-time SSE stream between server and Android Player
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const deviceId = searchParams.get('deviceId');

  if (!deviceId) {
    return new NextResponse('Device ID query parameter is required', { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 1. Initial Handshake event
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'CONNECTED', deviceId, timestamp: Date.now() })}\n\n`)
      );

      // 2. Subscribe to real-time events targeted to this device
      const unsubscribe = deviceStreamHub.subscribe(deviceId, (eventData) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(eventData)}\n\n`));
        } catch (_) {}
      });

      // 3. Keep-alive ping every 15 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`:ping\n\n`));
        } catch (_) {
          clearInterval(pingInterval);
        }
      }, 15000);

      req.signal.addEventListener('abort', () => {
        unsubscribe();
        clearInterval(pingInterval);
        try {
          controller.close();
        } catch (_) {}
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

/**
 * POST /api/stream/device
 * Broadcasts live chunk progress, test commands, or sync events to a device's open SSE stream
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, ...eventData } = body;

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 });
    }

    deviceStreamHub.broadcast(deviceId, eventData);

    const token = getTokenFromRequest(req);
    if (token && eventData.type) {
      const commandType = NATIVE_COMMANDS[eventData.type] ?? COMMAND_CUSTOM;
      await pushCommand(deviceId, commandType, JSON.stringify(eventData), token).catch(() => null);
    }

    return NextResponse.json({
      success: true,
      delivered: deviceStreamHub.hasSubscribers(deviceId),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Galat internal server' }, { status: 500 });
  }
}
