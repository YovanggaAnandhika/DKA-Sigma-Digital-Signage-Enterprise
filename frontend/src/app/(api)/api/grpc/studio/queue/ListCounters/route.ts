import { NextRequest, NextResponse } from 'next/server';
import { QueueCounterServiceClient } from '@/lib/api/components/v1/queue/counter/counter_grpc_pb';
import { ListCountersRequest } from '@/lib/api/components/v1/queue/counter/counter.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(QueueCounterServiceClient);
    const request = new ListCountersRequest();
    if (body.queueDisplayId || body.queue_display_id) {
      request.setQueueDisplayId(body.queueDisplayId || body.queue_display_id);
    }

    return new Promise<NextResponse>((resolve) => {
      client.listCounters(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
