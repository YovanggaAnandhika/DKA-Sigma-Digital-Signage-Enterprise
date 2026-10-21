import { NextRequest, NextResponse } from 'next/server';
import { QueueLayoutItemServiceClient } from '@/lib/api/components/v1/queue/layout_item/layout_item_grpc_pb';
import { GetQueueLayoutRequest } from '@/lib/api/components/v1/queue/layout_item/layout_item.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueLayoutItemServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new GetQueueLayoutRequest();
    if (body.queueDisplayId || body.queue_display_id) {
      request.setQueueDisplayId(body.queueDisplayId || body.queue_display_id);
    }

    return new Promise<NextResponse>((resolve) => {
      client.getQueueLayout(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
