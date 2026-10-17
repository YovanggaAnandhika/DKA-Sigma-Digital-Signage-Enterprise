import { NextRequest, NextResponse } from 'next/server';
import { DeviceServiceClient } from '@/lib/api/hardware/v1/device/device_grpc_pb';
import { UpdateDeviceRequest } from '@/lib/api/hardware/v1/device/device.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new DeviceServiceClient(getGrpcHost(), getGrpcCredentials());
    
    const request = new UpdateDeviceRequest();
    
    if (body.id) request.setId(body.id);
    if (body.name) request.setName(body.name);
    const displayGroupId = body.displayGroupId || body.display_group_id;
    if (displayGroupId) request.setDisplayGroupId(displayGroupId);
    if (body.screenWidth !== undefined || body.screen_width !== undefined) {
      request.setScreenWidth(Number(body.screenWidth ?? body.screen_width));
    }
    if (body.screenHeight !== undefined || body.screen_height !== undefined) {
      request.setScreenHeight(Number(body.screenHeight ?? body.screen_height));
    }
    if (body.orientation !== undefined) request.setOrientation(Number(body.orientation));
    if (body.timezone) request.setTimezone(body.timezone);
    const scheduleId = body.scheduleId || body.schedule_id;
    if (scheduleId) request.setScheduleId(scheduleId);
    const currentLayoutId = body.currentLayoutId || body.current_layout_id;
    if (currentLayoutId) request.setCurrentLayoutId(currentLayoutId);
    const canaryGroupId = body.canaryGroupId || body.canary_group_id;
    if (canaryGroupId) request.setCanaryGroupId(canaryGroupId);
    if (body.sleep_time || body.sleepTime) request.setSleepTime(body.sleep_time || body.sleepTime);
    if (body.wake_time || body.wakeTime) request.setWakeTime(body.wake_time || body.wakeTime);
    if (body.power_schedule_enabled !== undefined || body.powerScheduleEnabled !== undefined) {
      request.setPowerScheduleEnabled(Boolean(body.power_schedule_enabled ?? body.powerScheduleEnabled));
    }

    return new Promise<NextResponse>((resolve) => {
      client.updateDevice(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
