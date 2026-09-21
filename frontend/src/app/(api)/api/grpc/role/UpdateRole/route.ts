import { NextRequest, NextResponse } from 'next/server';
import { RoleServiceClient } from '@/lib/api/generated/iam/v1/role/role_grpc_pb';
import { UpdateRoleRequest } from '@/lib/api/generated/iam/v1/role/role.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/api/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new RoleServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateRoleRequest();
    if(body.id) request.setId(body.id); if(body.name) request.setName(body.name); if(body.description) request.setDescription(body.description); if(body.permission_ids) request.setPermissionIdsList(body.permission_ids);

    return new Promise((resolve) => {
      client.updateRole(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
