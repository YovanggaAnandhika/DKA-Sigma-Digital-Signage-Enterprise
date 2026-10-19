import { NextRequest, NextResponse } from 'next/server';
import { QueueServiceClient } from '@/lib/api/studio/v1/queue/queue_grpc_pb';
import { SetCounterStatusRequest } from '@/lib/api/studio/v1/queue/queue.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new SetCounterStatusRequest();
    if (body.counterId || body.counter_id) request.setCounterId(body.counterId || body.counter_id);
    if (body.status) request.setStatus(body.status);
    if (body.statusNote || body.status_note) request.setStatusNote(body.statusNote || body.status_note);

    return new Promise<NextResponse>((resolve) => {
      client.setCounterStatus(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
