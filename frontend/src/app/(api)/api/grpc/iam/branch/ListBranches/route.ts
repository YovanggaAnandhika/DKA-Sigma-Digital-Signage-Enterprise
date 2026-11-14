import { NextRequest, NextResponse } from 'next/server';
import { BranchServiceClient } from '@/lib/api/iam/v1/branch/branch_grpc_pb';
import { ListBranchesRequest } from '@/lib/api/iam/v1/branch/branch.common_pb';
import { getGrpcClient, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const client = getGrpcClient(BranchServiceClient);

    const request = new ListBranchesRequest();
    if (body.corporationId) request.setCorporationId(body.corporationId);
    if (body.search) request.setSearch(body.search);

    return new Promise<NextResponse>((resolve) => {
      client.listBranches(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          const o = response.toObject();
          resolve(NextResponse.json({ itemsList: o.itemsList || [], pagination: o.pagination }));
        }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

