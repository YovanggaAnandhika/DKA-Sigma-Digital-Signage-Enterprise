import { NextRequest, NextResponse } from 'next/server';
import { QueueSectorServiceClient } from '@/lib/api/components/v1/queue/sector/sector_grpc_pb';
import { ListQueueSectorsRequest } from '@/lib/api/components/v1/queue/sector/sector.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const token = getTokenFromRequest(req);
    const client = new QueueSectorServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new ListQueueSectorsRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listQueueSectors(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
