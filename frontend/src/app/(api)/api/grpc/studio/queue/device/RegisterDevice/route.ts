import { NextRequest, NextResponse } from 'next/server';
import { QueueDeviceServiceClient } from '@/lib/api/components/v1/queue/device/device_grpc_pb';
import { RegisterQueueDeviceRequest, PinMapping } from '@/lib/api/components/v1/queue/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueDeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new RegisterQueueDeviceRequest();

    request.setQueueDisplayId(body.queueDisplayId || body.queue_display_id || '');
    request.setDeviceUid(body.deviceUid || body.device_uid || '');
    request.setName(body.name || '');
    request.setDeviceRole(body.deviceRole || body.device_role || 'COUNTER_REMOTE');
    if (body.counterId || body.counter_id) request.setCounterId(body.counterId || body.counter_id);
    if (body.ticketPrefix || body.ticket_prefix) request.setTicketPrefix(body.ticketPrefix || body.ticket_prefix);
    request.setIsActive(body.isActive !== undefined ? Boolean(body.isActive) : true);

    const rawMappings = body.pinMappings || body.pin_mappings;
    if (Array.isArray(rawMappings)) {
      const mappings = rawMappings.map((p: any) => {
        const pm = new PinMapping();
        pm.setPin(Number(p.pin));
        pm.setAction(String(p.action || 'CALL_NEXT'));
        pm.setEnabled(p.enabled !== undefined ? Boolean(p.enabled) : true);
        pm.setLabel(String(p.label || ''));
        return pm;
      });
      request.setPinMappingsList(mappings);
    }

    return new Promise<NextResponse>((resolve) => {
      client.registerDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
