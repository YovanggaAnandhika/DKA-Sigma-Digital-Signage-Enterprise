import { NextRequest, NextResponse } from 'next/server';
import { UserServiceClient } from '@/lib/api/iam/v1/user/user_grpc_pb';
import { UpdateUserRequest } from '@/lib/api/iam/v1/user/user.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new UserServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateUserRequest();
    if(body.id) request.setId(body.id); if(body.email) request.setEmail(body.email); if(body.full_name) request.setFullName(body.full_name); if(body.role_id) request.setRoleId(body.role_id); if(body.is_active !== undefined) request.setIsActive(body.is_active); if(body.password) request.setPassword(body.password);

    return new Promise((resolve) => {
      client.updateUser(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
