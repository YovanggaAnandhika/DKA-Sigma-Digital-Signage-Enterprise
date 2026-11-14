import { NextRequest, NextResponse } from 'next/server';
import { BranchServiceClient } from '@/lib/api/iam/v1/branch/branch_grpc_pb';
import { UpdateBranchRequest } from '@/lib/api/iam/v1/branch/branch.common_pb';
import { getGrpcClient, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(BranchServiceClient);

    const request = new UpdateBranchRequest();
    request.setId(body.id);
    if (body.name) request.setName(body.name);
    if (body.code) request.setCode(body.code);
    if (body.address !== undefined) request.setAddress(body.address);
    if (body.isActive !== undefined) request.setIsActive(body.isActive);

    return new Promise<NextResponse>((resolve) => {
      client.updateBranch(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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

