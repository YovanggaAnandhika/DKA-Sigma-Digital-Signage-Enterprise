import { NextRequest, NextResponse } from 'next/server';
import { TickerServiceClient } from '@/lib/api/components/v1/ticker/ticker_grpc_pb';
import { DeleteTickerRequest } from '@/lib/api/components/v1/ticker/ticker.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const request = new DeleteTickerRequest().setId(body.id || '');
    const client = getGrpcClient(TickerServiceClient);

    return new Promise<NextResponse>((resolve) => {
      client.deleteTicker(request, getGrpcMetadataFromRequest(req), (error, response) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Internal Server Error' }, { status: 500 });
  }
}

