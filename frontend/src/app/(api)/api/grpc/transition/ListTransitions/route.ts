import { NextRequest, NextResponse } from 'next/server';
import { TransitionServiceClient } from '@/lib/api/studio/v1/transition/transition_grpc_pb';
import { ListTransitionsRequest } from '@/lib/api/studio/v1/transition/transition.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const token = getTokenFromRequest(req);
    const client = new TransitionServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListTransitionsRequest();
    
    return new Promise<NextResponse>((resolve) => {
      client.listTransitions(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
