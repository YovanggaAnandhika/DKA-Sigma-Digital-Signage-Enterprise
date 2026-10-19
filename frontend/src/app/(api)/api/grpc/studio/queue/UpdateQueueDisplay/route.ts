import { NextRequest, NextResponse } from 'next/server';
import { QueueServiceClient } from '@/lib/api/studio/v1/queue/queue_grpc_pb';
import { UpdateQueueDisplayRequest, QueueLayoutItem, QueueCounter, QueueAudio } from '@/lib/api/studio/v1/queue/queue.common_pb';
import { getGrpcHost, getGrpcCredentials, getGrpcMetadata, getTokenFromRequest } from '@/lib/core/grpcClient';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const token = getTokenFromRequest(req);
    const client = new QueueServiceClient(getGrpcHost(), getGrpcCredentials());
    const request = new UpdateQueueDisplayRequest();

    if (body.id) request.setId(body.id);
    if (body.name) request.setName(body.name);
    if (body.prefix) request.setPrefix(body.prefix);
    if (body.canvasWidth || body.canvas_width) request.setCanvasWidth(body.canvasWidth || body.canvas_width);
    if (body.canvasHeight || body.canvas_height) request.setCanvasHeight(body.canvasHeight || body.canvas_height);
    if (body.backgroundColor || body.background_color) request.setBackgroundColor(body.backgroundColor || body.background_color);
    if (body.backgroundImageUrl || body.background_image_url) request.setBackgroundImageUrl(body.backgroundImageUrl || body.background_image_url);
    if (body.themePreset || body.theme_preset) request.setThemePreset(body.themePreset || body.theme_preset);
    if (body.autoRecallEnabled !== undefined) request.setAutoRecallEnabled(body.autoRecallEnabled);
    if (body.opacity !== undefined) request.setOpacity(body.opacity);
    if (body.overlayColor || body.overlay_color) request.setOverlayColor(body.overlayColor || body.overlay_color);
    if (body.overlayOpacity !== undefined || body.overlay_opacity !== undefined) request.setOverlayOpacity(body.overlayOpacity ?? body.overlay_opacity);
    if (body.sectorType || body.sector_type) request.setSectorType(body.sectorType || body.sector_type);
    if (body.ticketLabel || body.ticket_label) request.setTicketLabel(body.ticketLabel || body.ticket_label);
    if (body.counterLabel || body.counter_label) request.setCounterLabel(body.counterLabel || body.counter_label);
    if (body.ttsTemplateCall || body.tts_template_call) request.setTtsTemplateCall(body.ttsTemplateCall || body.tts_template_call);
    if (body.ttsTemplateRecall || body.tts_template_recall) request.setTtsTemplateRecall(body.ttsTemplateRecall || body.tts_template_recall);
    if (body.ttsTemplateBreak || body.tts_template_break) request.setTtsTemplateBreak(body.ttsTemplateBreak || body.tts_template_break);

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
        if (it.opacity !== undefined) item.setOpacity(it.opacity);
        if (it.borderRadius !== undefined || it.border_radius !== undefined) item.setBorderRadius(it.borderRadius ?? it.border_radius);
        if (it.borderColor || it.border_color) item.setBorderColor(it.borderColor || it.border_color);
        if (it.borderWidth !== undefined || it.border_width !== undefined) item.setBorderWidth(it.borderWidth ?? it.border_width);
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
        if (c.status) counter.setStatus(c.status);
        if (c.statusNote || c.status_note) counter.setStatusNote(c.statusNote || c.status_note);
        return counter;
      });
      request.setCountersList(countersList);
    }

    if (Array.isArray(body.audios)) {
      const audiosList = body.audios.map((a: any) => {
        const audio = new QueueAudio();
        if (a.id) audio.setId(a.id);
        if (a.name) audio.setName(a.name);
        if (a.audioType || a.audio_type) audio.setAudioType(a.audioType || a.audio_type);
        if (a.mediaItemId || a.media_item_id) audio.setMediaItemId(a.mediaItemId || a.media_item_id);
        if (a.fileUrl || a.file_url) audio.setFileUrl(a.fileUrl || a.file_url);
        if (a.volumePercent !== undefined || a.volume_percent !== undefined) audio.setVolumePercent(a.volumePercent ?? a.volume_percent);
        if (a.isActive !== undefined || a.is_active !== undefined) audio.setIsActive(a.isActive ?? a.is_active);
        return audio;
      });
      request.setAudiosList(audiosList);
    }

    return new Promise<NextResponse>((resolve) => {
      client.updateQueueDisplay(request, getGrpcMetadata(token), (error: any, response: any) => {
        if (error) resolve(NextResponse.json({ error: error.message }, { status: 500 }));
        else resolve(NextResponse.json(response.toObject()));
      });
    });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
