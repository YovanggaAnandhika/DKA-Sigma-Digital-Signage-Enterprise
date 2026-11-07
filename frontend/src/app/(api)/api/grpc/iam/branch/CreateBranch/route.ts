import { NextRequest, NextResponse } from 'next/server';
import { BranchServiceClient } from '@/lib/api/iam/v1/branch/branch_grpc_pb';
import { CreateBranchRequest } from '@/lib/api/iam/v1/branch/branch.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = new BranchServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new CreateBranchRequest();
    request.setCorporationId(body.corporationId);
    request.setName(body.name);
    request.setCode(body.code);
    if (body.address) request.setAddress(body.address);

    return new Promise<NextResponse>((resolve) => {
      client.createBranch(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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

