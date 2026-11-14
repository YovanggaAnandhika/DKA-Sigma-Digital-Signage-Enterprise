import { NextRequest, NextResponse } from 'next/server';
import { CorporationServiceClient } from '@/lib/api/iam/v1/corporation/corporation_grpc_pb';
import { CreateCorporationRequest } from '@/lib/api/iam/v1/corporation/corporation.common_pb';
import { getGrpcClient, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(CorporationServiceClient);

    const request = new CreateCorporationRequest();
    request.setName(body.name);
    request.setSlug(body.slug);
    if (body.description) request.setDescription(body.description);
    if (body.activeUntil) request.setActiveUntil(body.activeUntil);
    if (body.maxScreens) request.setMaxScreens(body.maxScreens);
    if (body.maxBranches) request.setMaxBranches(body.maxBranches);
    if (body.subscriptionTier) request.setSubscriptionTier(body.subscriptionTier);

    return new Promise<NextResponse>((resolve) => {
      client.createCorporation(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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

