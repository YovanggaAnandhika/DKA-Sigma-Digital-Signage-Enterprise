import { NextRequest, NextResponse } from 'next/server';
import { QueueServiceClient } from '@/lib/api/studio/v1/queue/queue_grpc_pb';
import { CreateQueueDisplayRequest, QueueLayoutItem, QueueCounter, QueueAudio } from '@/lib/api/studio/v1/queue/queue.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new CreateQueueDisplayRequest();

    if (body.name) request.setName(body.name);
    if (body.prefix) request.setPrefix(body.prefix);
    if (body.canvasWidth || body.canvas_width) request.setCanvasWidth(body.canvasWidth || body.canvas_width);
    if (body.canvasHeight || body.canvas_height) request.setCanvasHeight(body.canvasHeight || body.canvas_height);
    if (body.backgroundColor || body.background_color) request.setBackgroundColor(body.backgroundColor || body.background_color);
    if (body.backgroundImageUrl || body.background_image_url) request.setBackgroundImageUrl(body.backgroundImageUrl || body.background_image_url);
    if (body.themePreset || body.theme_preset) request.setThemePreset(body.themePreset || body.theme_preset);
    if (body.autoRecallEnabled !== undefined) request.setAutoRecallEnabled(body.autoRecallEnabled);

    if (Array.isArray(body.items)) {
      const itemsList = body.items.map((it: any) => {
        const item = new QueueLayoutItem();
        if (it.id) item.setId(it.id);
        if (it.itemType || it.item_type) item.setItemType(it.itemType || it.item_type);
        if (it.name) item.setName(it.name);
        if (it.x !== undefined) item.setX(it.x);
        if (it.y !== undefined) item.setY(it.y);
        if (it.width !== undefined) item.setWidth(it.width);
        if (it.height !== undefined) item.setHeight(it.height);
        if (it.zIndex !== undefined || it.z_index !== undefined) item.setZIndex(it.zIndex ?? it.z_index);
        if (it.backgroundColor || it.background_color) item.setBackgroundColor(it.backgroundColor || it.background_color);
        if (it.textColor || it.text_color) item.setTextColor(it.textColor || it.text_color);
        if (it.fontSize !== undefined || it.font_size !== undefined) item.setFontSize(it.fontSize ?? it.font_size);
        if (it.fontWeight || it.font_weight) item.setFontWeight(it.fontWeight || it.font_weight);
        if (it.textAlign || it.text_align) item.setTextAlign(it.textAlign || it.text_align);
        if (it.templateContent || it.template_content) item.setTemplateContent(it.templateContent || it.template_content);
        if (it.configJson || it.config_json) item.setConfigJson(it.configJson || it.config_json);
        else if (it.config) item.setConfigJson(typeof it.config === 'string' ? it.config : JSON.stringify(it.config));
        if (it.isVisible !== undefined || it.is_visible !== undefined) item.setIsVisible(it.isVisible ?? it.is_visible);
        return item;
      });
      request.setItemsList(itemsList);
    }

    if (Array.isArray(body.counters)) {
      const countersList = body.counters.map((c: any) => {
        const counter = new QueueCounter();
        if (c.id) counter.setId(c.id);
        if (c.counterNumber || c.counter_number) counter.setCounterNumber(c.counterNumber || c.counter_number);
        if (c.counterName || c.counter_name) counter.setCounterName(c.counterName || c.counter_name);
        if (c.operatorName || c.operator_name) counter.setOperatorName(c.operatorName || c.operator_name);
        if (c.isActive !== undefined || c.is_active !== undefined) counter.setIsActive(c.isActive ?? c.is_active);
        return counter;
      });
      request.setCountersList(countersList);
    }

    return new Promise<NextResponse>((resolve) => {
      client.createQueueDisplay(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
