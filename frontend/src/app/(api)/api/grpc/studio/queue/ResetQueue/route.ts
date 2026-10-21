import { NextRequest, NextResponse } from 'next/server';
import { QueueTicketServiceClient } from '@/lib/api/components/v1/queue/ticket/ticket_grpc_pb';
import { ResetQueueRequest } from '@/lib/api/components/v1/queue/ticket/ticket.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueTicketServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new ResetQueueRequest();
    if (body.queueDisplayId || body.queue_display_id) request.setQueueDisplayId(body.queueDisplayId || body.queue_display_id);
    if (typeof body.startSequence === 'number') request.setStartSequence(body.startSequence);
    if (typeof body.start_sequence === 'number') request.setStartSequence(body.start_sequence);
    if (body.counterId || body.counter_id) request.setCounterId(body.counterId || body.counter_id);

    return new Promise<NextResponse>((resolve) => {
      client.resetQueue(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
