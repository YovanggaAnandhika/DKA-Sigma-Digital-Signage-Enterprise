import { NextRequest, NextResponse } from 'next/server';
import { QueueDisplayServiceClient } from '@/lib/api/components/v1/queue/display/display_grpc_pb';
import { DeleteQueueDisplayRequest } from '@/lib/api/components/v1/queue/display/display.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueDisplayServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new DeleteQueueDisplayRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.deleteQueueDisplay(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
