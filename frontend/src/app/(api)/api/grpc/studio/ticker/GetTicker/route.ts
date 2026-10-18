import { NextRequest, NextResponse } from 'next/server';
import { TickerServiceClient } from '@/lib/api/studio/v1/ticker/ticker_grpc_pb';
import { GetTickerRequest } from '@/lib/api/studio/v1/ticker/ticker.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new TickerServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new GetTickerRequest();
    if (body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getTicker(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
