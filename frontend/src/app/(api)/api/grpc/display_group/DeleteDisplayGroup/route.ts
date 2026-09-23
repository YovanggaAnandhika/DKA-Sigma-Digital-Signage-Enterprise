import { NextRequest, NextResponse } from 'next/server';
import { DisplayGroupServiceClient } from '@/lib/api/hardware/v1/display_group/display_group_grpc_pb';
import { DeleteDisplayGroupRequest } from '@/lib/api/hardware/v1/display_group/display_group.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DisplayGroupServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new DeleteDisplayGroupRequest();
    if(body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.deleteDisplayGroup(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
