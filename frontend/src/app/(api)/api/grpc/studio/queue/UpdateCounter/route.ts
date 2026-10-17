import { NextRequest, NextResponse } from 'next/server';
import { QueueServiceClient } from '@/lib/api/studio/v1/queue/queue_grpc_pb';
import { UpdateCounterRequest } from '@/lib/api/studio/v1/queue/queue.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new UpdateCounterRequest();
    if (body.id) request.setId(body.id);
    if (body.counterNumber || body.counter_number) request.setCounterNumber(body.counterNumber || body.counter_number);
    if (body.counterName || body.counter_name) request.setCounterName(body.counterName || body.counter_name);
    if (body.operatorName || body.operator_name) request.setOperatorName(body.operatorName || body.operator_name);
    if (body.isActive !== undefined || body.is_active !== undefined) request.setIsActive(body.isActive ?? body.is_active);

    return new Promise<NextResponse>((resolve) => {
      client.updateCounter(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
