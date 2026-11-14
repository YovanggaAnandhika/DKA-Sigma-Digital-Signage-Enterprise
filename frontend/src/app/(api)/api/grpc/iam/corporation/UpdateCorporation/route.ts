import { NextRequest, NextResponse } from 'next/server';
import { CorporationServiceClient } from '@/lib/api/iam/v1/corporation/corporation_grpc_pb';
import { UpdateCorporationRequest } from '@/lib/api/iam/v1/corporation/corporation.common_pb';
import { getGrpcClient, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const client = getGrpcClient(CorporationServiceClient);

    const request = new UpdateCorporationRequest();
    request.setId(body.id);
    if (body.name) request.setName(body.name);
    if (body.description !== undefined) request.setDescription(body.description);
    if (body.activeUntil !== undefined) request.setActiveUntil(body.activeUntil);
    if (body.maxScreens !== undefined) request.setMaxScreens(body.maxScreens);
    if (body.maxBranches !== undefined) request.setMaxBranches(body.maxBranches);
    if (body.subscriptionTier !== undefined) request.setSubscriptionTier(body.subscriptionTier);
    if (body.isActive !== undefined) request.setIsActive(body.isActive);

    return new Promise<NextResponse>((resolve) => {
      client.updateCorporation(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
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

