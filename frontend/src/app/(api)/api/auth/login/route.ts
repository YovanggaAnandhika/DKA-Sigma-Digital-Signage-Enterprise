import { NextRequest, NextResponse } from 'next/server';
import { UserServiceClient } from '@/lib/api/iam/v1/user/user_grpc_pb';
import { LoginRequest } from '@/lib/api/iam/v1/user/user.common_pb';
import { getGrpcHost, getGrpcCredentials } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = new UserServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new LoginRequest();
    if (body.email) request.setEmail(body.email);
    if (body.password) request.setPassword(body.password);

    return new Promise<NextResponse>((resolve) => {
      client.login(request, (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message || 'Authentication failed' }, { status: 401 }));
        } else {
          const resObj = response.toObject();
          const u = resObj.user;
          const rawExpiresAt = Number(resObj.expiresAt) || 0;
          // If expiresAt is in unix seconds (less than 10^11), convert to milliseconds
          const expiresAtMs = rawExpiresAt < 100000000000 ? rawExpiresAt * 1000 : rawExpiresAt;

          const userSession = {
            id: u?.id || '',
            email: u?.email || body.email,
            fullName: u?.fullName || u?.full_name || '',
            token: resObj.token,
            effectivePermissions: u?.effectivePermissionsList || [],
            expiresAt: expiresAtMs || (Date.now() + 24 * 3600 * 1000),
          };
          resolve(NextResponse.json(userSession));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Internal Server Error' }, { status: 500 });
  }
}
