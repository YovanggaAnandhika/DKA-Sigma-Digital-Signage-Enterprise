import { NextRequest, NextResponse } from 'next/server';
import { RoleServiceClient } from '@/lib/api/iam/v1/role/role_grpc_pb';
import { CreateRoleRequest } from '@/lib/api/iam/v1/role/role.common_pb';
import { getGrpcClient, getGrpcMetadata, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(RoleServiceClient);
    
    const request = new CreateRoleRequest();
    if(body.name) request.setName(body.name); if(body.description) request.setDescription(body.description); if(body.permission_ids) request.setPermissionIdsList(body.permission_ids);

    return new Promise<NextResponse>((resolve) => {
      client.createRole(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
