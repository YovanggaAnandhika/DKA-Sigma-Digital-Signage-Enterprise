import { NextRequest, NextResponse } from 'next/server';
import { deviceStreamHub } from '@/lib/core/deviceStreamHub';

export const dynamic = 'force-dynamic';

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
    return NextResponse.json({
      success: true,
      delivered: deviceStreamHub.hasSubscribers(deviceId),
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Galat internal server' }, { status: 500 });
  }
}
