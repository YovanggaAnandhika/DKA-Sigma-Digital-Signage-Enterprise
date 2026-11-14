import { NextRequest, NextResponse } from 'next/server';
import { TickerServiceClient } from '@/lib/api/components/v1/ticker/ticker_grpc_pb';
import { ListTickersRequest } from '@/lib/api/components/v1/ticker/ticker.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const client = getGrpcClient(TickerServiceClient);
    const request = new ListTickersRequest();

    return new Promise<NextResponse>((resolve) => {
      client.listTickers(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}
