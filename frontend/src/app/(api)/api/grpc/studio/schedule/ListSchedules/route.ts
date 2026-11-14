import { NextRequest, NextResponse } from 'next/server';
import { ScheduleServiceClient } from '@/lib/api/studio/v1/schedule/schedule/schedule_grpc_pb';
import { ListSchedulesRequest } from '@/lib/api/studio/v1/schedule/schedule/schedule.common_pb';
import { PaginationRequest } from '@/lib/api/common/v1/types_pb';
import { getGrpcClient, getGrpcMetadataFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const client = getGrpcClient(ScheduleServiceClient);
    
    const request = new ListSchedulesRequest();
    if (body.search) request.setSearch(body.search);
    if (body.deviceId) request.setDeviceId(body.deviceId);
    if (body.displayGroupId) request.setDisplayGroupId(body.displayGroupId);
    if (typeof body.flattenEvents === 'boolean') request.setFlattenEvents(body.flattenEvents);
    if (body.pagination) {
      const pag = new PaginationRequest();
      pag.setPage(Number(body.pagination.page) || 1);
      pag.setLimit(Number(body.pagination.limit) || 25);
      request.setPagination(pag);
    }

    return new Promise<NextResponse>((resolve) => {
      client.listSchedules(request, getGrpcMetadataFromRequest(req), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else { const o = response.toObject(); resolve(NextResponse.json({ itemsList: (o.itemsList || []), pagination: o.pagination })); }
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
