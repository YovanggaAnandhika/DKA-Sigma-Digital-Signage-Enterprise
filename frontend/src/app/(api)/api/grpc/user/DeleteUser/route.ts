import { NextRequest, NextResponse } from 'next/server';
import { UserServiceClient } from '@/lib/api/generated/iam/v1/user/user_grpc_pb';
import { DeleteUserRequest } from '@/lib/api/generated/iam/v1/user/user.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new UserServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new DeleteUserRequest();
    if(body.id) request.setId(body.id);

    return new Promise((resolve) => {
      client.deleteUser(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
