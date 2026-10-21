import { NextRequest, NextResponse } from 'next/server';
import { QueueTicketServiceClient } from '@/lib/api/components/v1/queue/ticket/ticket_grpc_pb';
import { GetQueueSyncStateRequest } from '@/lib/api/components/v1/queue/ticket/ticket.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function GET(req: NextRequest) {
  try {
    const queueDisplayId = req.nextUrl.searchParams.get('queueDisplayId') || req.nextUrl.searchParams.get('queue_display_id') || '';
    const token = getTokenFromRequest(req);
    const client = new QueueTicketServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new GetQueueSyncStateRequest();
    if (queueDisplayId) request.setQueueDisplayId(queueDisplayId);

    return new Promise<NextResponse>((resolve) => {
      client.getQueueSyncState(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else {
          const obj = response.toObject();
          const primaryCounter = obj.countersList?.[0];
          const enriched = {
            ...obj,
            latestCalledNumber: obj.currentTicketNumber,
            currentCounterName: primaryCounter?.counterName || 'LOKET 01',
            status: primaryCounter?.status || 'ACTIVE',
            counterStatus: primaryCounter?.status || 'ACTIVE',
          };
          resolve(NextResponse.json(enriched));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueTicketServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new GetQueueSyncStateRequest();
    if (body.queueDisplayId || body.queue_display_id) request.setQueueDisplayId(body.queueDisplayId || body.queue_display_id);

    return new Promise<NextResponse>((resolve) => {
      client.getQueueSyncState(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else {
          const obj = response.toObject();
          const primaryCounter = obj.countersList?.[0];
          const enriched = {
            ...obj,
            latestCalledNumber: obj.currentTicketNumber,
            currentCounterName: primaryCounter?.counterName || 'LOKET 01',
            status: primaryCounter?.status || 'ACTIVE',
            counterStatus: primaryCounter?.status || 'ACTIVE',
          };
          resolve(NextResponse.json(enriched));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

