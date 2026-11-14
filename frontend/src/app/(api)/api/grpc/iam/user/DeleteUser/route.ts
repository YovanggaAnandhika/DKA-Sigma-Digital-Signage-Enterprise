import { NextRequest, NextResponse } from 'next/server';
import { UserServiceClient } from '@/lib/api/iam/v1/user/user_grpc_pb';
import { DeleteUserRequest } from '@/lib/api/iam/v1/user/user.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(UserServiceClient);
    
    const request = new DeleteUserRequest();
    if(body.id) request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.deleteUser(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
