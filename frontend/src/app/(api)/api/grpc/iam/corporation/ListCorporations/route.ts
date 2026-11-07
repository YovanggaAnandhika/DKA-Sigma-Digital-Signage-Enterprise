import { NextRequest, NextResponse } from 'next/server';
import { CorporationServiceClient } from '@/lib/api/iam/v1/corporation/corporation_grpc_pb';
import { ListCorporationsRequest } from '@/lib/api/iam/v1/corporation/corporation.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const client = new CorporationServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new ListCorporationsRequest();
    if (body.search) request.setSearch(body.search);

    return new Promise<NextResponse>((resolve) => {
      client.listCorporations(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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

