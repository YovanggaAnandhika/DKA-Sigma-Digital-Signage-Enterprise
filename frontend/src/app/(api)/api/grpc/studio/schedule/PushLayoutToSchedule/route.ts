import { NextRequest, NextResponse } from 'next/server';
import { ScheduleServiceClient } from '@/lib/api/studio/v1/schedule/schedule_grpc_pb';
import { PushLayoutToScheduleRequest } from '@/lib/api/studio/v1/schedule/schedule.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new ScheduleServiceClient(getGrpcHost(), getGrpcCredentials());

    const request = new PushLayoutToScheduleRequest();
    request.setLayoutId(body.layout_id || body.layoutId || '');
    request.setScheduleName(body.schedule_name || body.scheduleName || 'Jadwal Layout');
    request.setStartTime(body.start_time || body.startTime || '08:00:00');
    request.setEndTime(body.end_time || body.endTime || '22:00:00');
    request.setDaysOfWeek(body.days_of_week || body.daysOfWeek || '1,2,3,4,5,6,7');
    request.setPriority(Number(body.priority) || 0);

    const startDate = body.start_date || body.startDate;
    if (startDate) request.setStartDate(startDate);

    const endDate = body.end_date || body.endDate;
    if (endDate) request.setEndDate(endDate);

    const deviceIds = body.device_ids || body.deviceIds || [];
    if (Array.isArray(deviceIds)) request.setDeviceIdsList(deviceIds);

    const groupIds = body.display_group_ids || body.displayGroupIds || [];
    if (Array.isArray(groupIds)) request.setDisplayGroupIdsList(groupIds);

    const scheduleId = body.schedule_id || body.scheduleId;
    if (scheduleId) request.setScheduleId(scheduleId);

    return new Promise<NextResponse>((resolve) => {
      client.pushLayoutToSchedule(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) {
          resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        } else {
          resolve(NextResponse.json(response.toObject()));
        }
      });
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
