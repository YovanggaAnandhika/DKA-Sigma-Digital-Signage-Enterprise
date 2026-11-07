import { NextRequest, NextResponse } from 'next/server';
import { BranchServiceClient } from '@/lib/api/iam/v1/branch/branch_grpc_pb';
import { GetBranchRequest } from '@/lib/api/iam/v1/branch/branch.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = new BranchServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new GetBranchRequest();
    request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getBranch(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

