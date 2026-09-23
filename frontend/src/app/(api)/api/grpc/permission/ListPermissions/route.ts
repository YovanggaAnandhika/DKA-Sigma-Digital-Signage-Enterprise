import { NextRequest, NextResponse } from 'next/server';
import { PermissionServiceClient } from '@/lib/api/iam/v1/permission/permission_grpc_pb';
import { ListPermissionsRequest } from '@/lib/api/iam/v1/permission/permission.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new PermissionServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListPermissionsRequest();
    if(body.search) request.setSearch(body.search);

    return new Promise((resolve) => {
      client.listPermissions(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else { const o = response.toObject(); resolve(NextResponse.json({ itemsList: (o.itemsList || []), pagination: o.pagination })); }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
