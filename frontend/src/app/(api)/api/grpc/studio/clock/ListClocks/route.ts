import { NextRequest, NextResponse } from 'next/server';
import { ClockServiceClient } from '@/lib/api/components/v1/clock/clock_grpc_pb';
import { ListClocksRequest } from '@/lib/api/components/v1/clock/clock.common_pb';
import { getGrpcClient, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const client = getGrpcClient(ClockServiceClient);
    const request = new ListClocksRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listClocks(request, getGrpcMetadata(getTokenFromRequest(req)), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
