import { NextRequest, NextResponse } from 'next/server';
import { UserServiceClient } from '@/lib/api/iam/v1/user/user_grpc_pb';
import { ListUsersRequest } from '@/lib/api/iam/v1/user/user.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new UserServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new ListUsersRequest();
    if(body.search) request.setSearch(body.search);

    return new Promise<NextResponse>((resolve) => {
      client.listUsers(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else { const o = response.toObject(); resolve(NextResponse.json({ itemsList: (o.itemsList || []), pagination: o.pagination })); }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
