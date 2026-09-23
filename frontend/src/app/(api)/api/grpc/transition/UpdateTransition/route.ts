import { NextRequest, NextResponse } from 'next/server';
import { TransitionServiceClient } from '@/lib/api/studio/v1/transition/transition_grpc_pb';
import { UpdateTransitionRequest } from '@/lib/api/studio/v1/transition/transition.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new TransitionServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateTransitionRequest();
    if (body.id) request.setId(body.id);
    if (body.name !== undefined) request.setName(body.name);
    if (body.name !== undefined) request.setName(body.name);
    if (body.cssClass !== undefined) request.setCssClass(body.cssClass);
    if (body.css_class !== undefined) request.setCssClass(body.css_class);
    if (body.durationMs !== undefined) request.setDurationMs(body.durationMs);
    if (body.duration_ms !== undefined) request.setDurationMs(body.duration_ms);
    
    return new Promise<NextResponse>((resolve) => {
      client.updateTransition(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
