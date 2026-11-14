import { NextRequest, NextResponse } from 'next/server';
import { CorporationServiceClient } from '@/lib/api/iam/v1/corporation/corporation_grpc_pb';
import { GetCorporationRequest } from '@/lib/api/iam/v1/corporation/corporation.common_pb';
import { getGrpcClient, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(CorporationServiceClient);

    const request = new GetCorporationRequest();
    request.setId(body.id);

    return new Promise<NextResponse>((resolve) => {
      client.getCorporation(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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

