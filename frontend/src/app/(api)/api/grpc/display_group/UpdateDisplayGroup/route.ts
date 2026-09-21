import { NextRequest, NextResponse } from 'next/server';
import { DisplayGroupServiceClient } from '@/lib/api/generated/hardware/v1/display_group/display_group_grpc_pb';
import { UpdateDisplayGroupRequest } from '@/lib/api/generated/hardware/v1/display_group/display_group.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DisplayGroupServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateDisplayGroupRequest();
    if(body.id) request.setId(body.id); if(body.name) request.setName(body.name); if(body.description !== undefined) request.setDescription(body.description);

    return new Promise((resolve) => {
      client.updateDisplayGroup(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
