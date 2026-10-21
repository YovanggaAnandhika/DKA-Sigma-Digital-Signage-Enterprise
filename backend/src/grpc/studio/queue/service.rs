use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::studio::v1::queue::{
    queue_service_server::QueueService as QueueServiceTrait,
    CreateQueueDisplayRequest, GetQueueDisplayRequest, ListQueueDisplaysRequest,
    ListQueueDisplaysResponse, UpdateQueueDisplayRequest, DeleteQueueDisplayRequest,
    DeleteQueueDisplayResponse, SaveQueueLayoutRequest, SaveQueueLayoutResponse,
    GetQueueLayoutRequest, GetQueueLayoutResponse, UpdateQueueLayoutItemRequest,
    DeleteQueueLayoutItemRequest, DeleteQueueLayoutItemResponse, AddCounterRequest,
    UpdateCounterRequest, DeleteCounterRequest, DeleteCounterResponse, ListCountersRequest,
    ListCountersResponse, IssueTicketRequest, CallNextTicketRequest, CallNextTicketResponse,
    CallPreviousTicketRequest, CallPreviousTicketResponse, ResetQueueRequest, ResetQueueResponse,
    SetCounterStatusRequest, GetQueueSyncStateRequest, GetQueueSyncStateResponse,
    ListTicketsRequest, ListTicketsResponse, UpdateTicketStatusRequest, AddAudioRequest,
    DeleteAudioRequest, DeleteAudioResponse, ListAudiosRequest, ListAudiosResponse,
    ListQueueSectorsRequest, ListQueueSectorsResponse, QueueSector,
    QueueDisplayDetail, QueueLayoutItem, QueueCounter, QueueTicket, QueueAudio,
};
use crate::grpc::proto::common::v1::PaginationResponse;

#[derive(FromRow)]
struct QueueDisplayRow {
    id: Uuid,
    name: String,
    prefix: String,
    canvas_width: i32,
    canvas_height: i32,
    background_color: String,
    background_image_url: Option<String>,
    theme_preset: String,
    auto_recall_enabled: bool,
    opacity: f64,
    overlay_color: String,
    overlay_opacity: f64,
    sector_type: String,
    ticket_label: String,
    counter_label: String,
    tts_template_call: String,
    tts_template_recall: String,
    tts_template_break: String,
    current_sequence: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow)]
struct QueueDisplaySyncRow {
    prefix: String,
    current_sequence: i32,
    sector_type: String,
    ticket_label: String,
    counter_label: String,
    tts_template_call: String,
    tts_template_recall: String,
    tts_template_break: String,
}

#[derive(FromRow)]
struct QueueLayoutItemRow {
    id: Uuid,
    queue_display_id: Uuid,
    item_type: String,
    name: String,
    x: i32,
    y: i32,
    width: i32,
    height: i32,
    z_index: i32,
    background_color: Option<String>,
    text_color: Option<String>,
    font_size: Option<i32>,
    font_weight: Option<String>,
    text_align: Option<String>,
    template_content: String,
    config: serde_json::Value,
    is_visible: bool,
    opacity: f64,
    border_radius: i32,
    border_color: String,
    border_width: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow)]
struct QueueCounterRow {
    id: Uuid,
    queue_display_id: Uuid,
    counter_number: i32,
    counter_name: String,
    operator_name: Option<String>,
    is_active: bool,
    status: String,
    status_note: Option<String>,
    current_ticket_number: Option<String>,
    last_called_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow)]
struct QueueAudioRow {
    id: Uuid,
    queue_display_id: Uuid,
    name: String,
    audio_type: String,
    media_item_id: Option<Uuid>,
    file_url: Option<String>,
    volume_percent: i32,
    is_active: bool,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow)]
struct QueueTicketRow {
    id: Uuid,
    queue_display_id: Uuid,
    counter_id: Option<Uuid>,
    ticket_number: String,
    prefix: String,
    sequence_number: i32,
    status: String,
    called_at: Option<chrono::DateTime<chrono::Utc>>,
    completed_at: Option<chrono::DateTime<chrono::Utc>>,
    created_at: chrono::DateTime<chrono::Utc>,
}

#[derive(FromRow)]
struct QueueSectorRow {
    id: String,
    name: String,
    description: String,
    default_prefix: String,
    ticket_label: String,
    counter_label: String,
    tts_template_call: String,
    tts_template_recall: String,
    tts_template_break: String,
    icon: String,
    sort_order: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

pub struct QueueServiceImpl {
    pub pool: PgPool,
}

impl QueueServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub async fn fetch_display_detail(&self, id: Uuid) -> Result<QueueDisplayDetail, Status> {
        let display = sqlx::query_as::<_, QueueDisplayRow>(
            r#"
            SELECT id, name, prefix, canvas_width, canvas_height, background_color,
                   background_image_url, theme_preset, auto_recall_enabled,
                   opacity, overlay_color, overlay_opacity,
                   sector_type, ticket_label, counter_label,
                   tts_template_call, tts_template_recall, tts_template_break, current_sequence,
                   created_at, updated_at
            FROM components_queue_displays
            WHERE id = $1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Queue display not found"))?;

        let items = sqlx::query_as::<_, QueueLayoutItemRow>(
            r#"
            SELECT id, queue_display_id, item_type, name, x, y, width, height, z_index,
                   background_color, text_color, font_size, font_weight, text_align,
                   template_content, config, is_visible,
                   opacity, border_radius, border_color, border_width,
                   created_at, updated_at
            FROM components_queue_layout_items
            WHERE queue_display_id = $1
            ORDER BY z_index ASC, created_at ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .into_iter()
        .map(|it| QueueLayoutItem {
            id: it.id.to_string(),
            queue_display_id: it.queue_display_id.to_string(),
            item_type: it.item_type,
            name: it.name,
            x: it.x,
            y: it.y,
            width: it.width,
            height: it.height,
            z_index: it.z_index,
            background_color: it.background_color.unwrap_or_else(|| "transparent".to_string()),
            text_color: it.text_color.unwrap_or_default(),
            font_size: it.font_size.unwrap_or(24),
            font_weight: it.font_weight.unwrap_or_default(),
            text_align: it.text_align.unwrap_or_default(),
            template_content: it.template_content,
            config_json: it.config.to_string(),
            is_visible: it.is_visible,
            created_at: it.created_at.to_rfc3339(),
            updated_at: it.updated_at.to_rfc3339(),
            opacity: it.opacity as f32,
            border_radius: it.border_radius,
            border_color: it.border_color,
            border_width: it.border_width,
        })
        .collect();

        let counters = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name,
                   is_active, status, status_note, current_ticket_number, last_called_at,
                   created_at, updated_at
            FROM components_queue_counters
            WHERE queue_display_id = $1
            ORDER BY counter_number ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .into_iter()
        .map(|c| QueueCounter {
            id: c.id.to_string(),
            queue_display_id: c.queue_display_id.to_string(),
            counter_number: c.counter_number,
            counter_name: c.counter_name,
            operator_name: c.operator_name.unwrap_or_default(),
            is_active: c.is_active,
            current_ticket_number: c.current_ticket_number.unwrap_or_default(),
            last_called_at: c.last_called_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
            status: c.status,
            status_note: c.status_note.unwrap_or_default(),
        })
        .collect();

        let audios = sqlx::query_as::<_, QueueAudioRow>(
            r#"
            SELECT id, queue_display_id, name, audio_type, media_item_id, file_url,
                   volume_percent, is_active, created_at, updated_at
            FROM components_queue_audios
            WHERE queue_display_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .into_iter()
        .map(|a| QueueAudio {
            id: a.id.to_string(),
            queue_display_id: a.queue_display_id.to_string(),
            name: a.name,
            audio_type: a.audio_type,
            media_item_id: a.media_item_id.map(|m| m.to_string()).unwrap_or_default(),
            file_url: a.file_url.unwrap_or_default(),
            volume_percent: a.volume_percent,
            is_active: a.is_active,
            created_at: a.created_at.to_rfc3339(),
            updated_at: a.updated_at.to_rfc3339(),
        })
        .collect();

        let (waiting_count,): (i64,) = sqlx::query_as(
            r#"
            SELECT COUNT(*)
            FROM components_queue_tickets
            WHERE queue_display_id = $1 AND status = 'waiting'
            "#,
        )
        .bind(id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let latest_ticket_opt: Option<(String,)> = sqlx::query_as(
            r#"
            SELECT ticket_number
            FROM components_queue_tickets
            WHERE queue_display_id = $1 AND status IN ('called', 'serving')
            ORDER BY called_at DESC NULLS LAST
            LIMIT 1
            "#,
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let latest_ticket = latest_ticket_opt
            .map(|t| t.0)
            .unwrap_or_else(|| {
                let p = if display.prefix.is_empty() { "A" } else { &display.prefix };
                format!("{}-{:03}", p, display.current_sequence)
            });

        Ok(QueueDisplayDetail {
            id: display.id.to_string(),
            name: display.name,
            prefix: display.prefix,
            canvas_width: display.canvas_width,
            canvas_height: display.canvas_height,
            background_color: display.background_color,
            background_image_url: display.background_image_url.unwrap_or_default(),
            theme_preset: display.theme_preset,
            auto_recall_enabled: display.auto_recall_enabled,
            items,
            counters,
            audios,
            waiting_tickets_count: waiting_count as i32,
            latest_called_number: latest_ticket,
            created_at: display.created_at.to_rfc3339(),
            updated_at: display.updated_at.to_rfc3339(),
            opacity: display.opacity as f32,
            overlay_color: display.overlay_color,
            overlay_opacity: display.overlay_opacity as f32,
            sector_type: display.sector_type,
            ticket_label: display.ticket_label,
            counter_label: display.counter_label,
            tts_template_call: display.tts_template_call,
            tts_template_recall: display.tts_template_recall,
            tts_template_break: display.tts_template_break,
            current_sequence: display.current_sequence,
        })
    }
}

#[tonic::async_trait]
impl QueueServiceTrait for QueueServiceImpl {
    async fn create_queue_display(
        &self,
        request: Request<CreateQueueDisplayRequest>,
    ) -> Result<Response<QueueDisplayDetail>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::new_v4();

        let sector_type = req.sector_type.filter(|s| !s.is_empty()).unwrap_or_else(|| "HOSPITAL".to_string());
        let ticket_label = req.ticket_label.filter(|s| !s.is_empty()).unwrap_or_else(|| "Nomor Antrian".to_string());
        let counter_label = req.counter_label.filter(|s| !s.is_empty()).unwrap_or_else(|| "Loket".to_string());
        let tts_call = req.tts_template_call.filter(|s| !s.is_empty()).unwrap_or_else(|| "{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}".to_string());
        let tts_recall = req.tts_template_recall.filter(|s| !s.is_empty()).unwrap_or_else(|| "Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}".to_string());
        let tts_break = req.tts_template_break.filter(|s| !s.is_empty()).unwrap_or_else(|| "{counter_label} {counter_name} sedang istirahat".to_string());

        sqlx::query(
            r#"
            INSERT INTO components_queue_displays (
                id, name, prefix, canvas_width, canvas_height, background_color,
                background_image_url, theme_preset, auto_recall_enabled,
                opacity, overlay_color, overlay_opacity,
                sector_type, ticket_label, counter_label,
                tts_template_call, tts_template_recall, tts_template_break
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            "#,
        )
        .bind(display_id)
        .bind(&req.name)
        .bind(if req.prefix.is_empty() { "A" } else { &req.prefix })
        .bind(if req.canvas_width > 0 { req.canvas_width } else { 1920 })
        .bind(if req.canvas_height > 0 { req.canvas_height } else { 1080 })
        .bind(if req.background_color.is_empty() { "transparent" } else { &req.background_color })
        .bind(if req.background_image_url.is_empty() { None } else { Some(&req.background_image_url) })
        .bind(if req.theme_preset.is_empty() { "clean-light" } else { &req.theme_preset })
        .bind(req.auto_recall_enabled)
        .bind(if req.opacity > 0.0 { req.opacity as f64 } else { 1.0 })
        .bind(if req.overlay_color.is_empty() { "transparent" } else { &req.overlay_color })
        .bind(req.overlay_opacity as f64)
        .bind(&sector_type)
        .bind(&ticket_label)
        .bind(&counter_label)
        .bind(&tts_call)
        .bind(&tts_recall)
        .bind(&tts_break)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        // Insert items if provided
        for it in req.items {
            let item_id = Uuid::from_str(&it.id).unwrap_or_else(|_| Uuid::new_v4());
            let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));
            sqlx::query(
                r#"
                INSERT INTO components_queue_layout_items (
                    id, queue_display_id, item_type, name, x, y, width, height, z_index,
                    background_color, text_color, font_size, font_weight, text_align,
                    template_content, config, is_visible,
                    opacity, border_radius, border_color, border_width
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                "#,
            )
            .bind(item_id)
            .bind(display_id)
            .bind(&it.item_type)
            .bind(&it.name)
            .bind(it.x)
            .bind(it.y)
            .bind(it.width)
            .bind(it.height)
            .bind(it.z_index)
            .bind(&it.background_color)
            .bind(&it.text_color)
            .bind(it.font_size)
            .bind(&it.font_weight)
            .bind(&it.text_align)
            .bind(&it.template_content)
            .bind(&config_val)
            .bind(it.is_visible)
            .bind(if it.opacity > 0.0 { it.opacity as f64 } else { 1.0 })
            .bind(it.border_radius)
            .bind(if it.border_color.is_empty() { "transparent" } else { &it.border_color })
            .bind(it.border_width)
            .execute(&self.pool)
            .await
            .ok();
        }

        // Insert counters if provided
        for c in req.counters {
            let cid = Uuid::from_str(&c.id).unwrap_or_else(|_| Uuid::new_v4());
            sqlx::query(
                r#"
                INSERT INTO components_queue_counters (id, queue_display_id, counter_number, counter_name, operator_name, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
            )
            .bind(cid)
            .bind(display_id)
            .bind(c.counter_number)
            .bind(&c.counter_name)
            .bind(&c.operator_name)
            .bind(c.is_active)
            .execute(&self.pool)
            .await
            .ok();
        }

        // Insert audios if provided
        for a in req.audios {
            let aid = Uuid::from_str(&a.id).unwrap_or_else(|_| Uuid::new_v4());
            let mid = Uuid::from_str(&a.media_item_id).ok();
            sqlx::query(
                r#"
                INSERT INTO components_queue_audios (id, queue_display_id, name, audio_type, media_item_id, file_url, volume_percent, is_active)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                "#,
            )
            .bind(aid)
            .bind(display_id)
            .bind(&a.name)
            .bind(&a.audio_type)
            .bind(mid)
            .bind(if a.file_url.is_empty() { None } else { Some(&a.file_url) })
            .bind(a.volume_percent)
            .bind(a.is_active)
            .execute(&self.pool)
            .await
            .ok();
        }

        self.fetch_display_detail(display_id).await.map(Response::new)
    }

    async fn get_queue_display(
        &self,
        request: Request<GetQueueDisplayRequest>,
    ) -> Result<Response<QueueDisplayDetail>, Status> {
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid queue display id"))?;
        self.fetch_display_detail(id).await.map(Response::new)
    }

    async fn list_queue_displays(
        &self,
        request: Request<ListQueueDisplaysRequest>,
    ) -> Result<Response<ListQueueDisplaysResponse>, Status> {
        let req = request.into_inner();
        let search_pattern = format!("%{}%", req.search);

        let rows = sqlx::query_as::<_, (Uuid,)>(
            r#"
            SELECT id FROM components_queue_displays
            WHERE name ILIKE $1 OR prefix ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#,
        )
        .bind(&search_pattern)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for r in rows {
            if let Ok(d) = self.fetch_display_detail(r.0).await {
                items.push(d);
            }
        }

        Ok(Response::new(ListQueueDisplaysResponse {
            items,
            pagination: Some(PaginationResponse {
                current_page: 1,
                limit: 50,
                total_items: 0,
                total_pages: 1,
            }),
        }))
    }

    async fn update_queue_display(
        &self,
        request: Request<UpdateQueueDisplayRequest>,
    ) -> Result<Response<QueueDisplayDetail>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid queue display id"))?;

        sqlx::query(
            r#"
            UPDATE components_queue_displays
            SET name = COALESCE(NULLIF($2, ''), name),
                prefix = COALESCE(NULLIF($3, ''), prefix),
                canvas_width = CASE WHEN $4 > 0 THEN $4 ELSE canvas_width END,
                canvas_height = CASE WHEN $5 > 0 THEN $5 ELSE canvas_height END,
                background_color = COALESCE(NULLIF($6, ''), background_color),
                background_image_url = $7,
                theme_preset = COALESCE(NULLIF($8, ''), theme_preset),
                auto_recall_enabled = $9,
                opacity = CASE WHEN $10 > 0.0 THEN $10 ELSE opacity END,
                overlay_color = COALESCE(NULLIF($11, ''), overlay_color),
                overlay_opacity = $12,
                sector_type = COALESCE($13, sector_type),
                ticket_label = COALESCE($14, ticket_label),
                counter_label = COALESCE($15, counter_label),
                tts_template_call = COALESCE($16, tts_template_call),
                tts_template_recall = COALESCE($17, tts_template_recall),
                tts_template_break = COALESCE($18, tts_template_break),
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.prefix)
        .bind(req.canvas_width)
        .bind(req.canvas_height)
        .bind(&req.background_color)
        .bind(if req.background_image_url.is_empty() { None } else { Some(&req.background_image_url) })
        .bind(&req.theme_preset)
        .bind(req.auto_recall_enabled)
        .bind(req.opacity as f64)
        .bind(&req.overlay_color)
        .bind(req.overlay_opacity as f64)
        .bind(req.sector_type.as_ref().filter(|s| !s.is_empty()))
        .bind(req.ticket_label.as_ref().filter(|s| !s.is_empty()))
        .bind(req.counter_label.as_ref().filter(|s| !s.is_empty()))
        .bind(req.tts_template_call.as_ref().filter(|s| !s.is_empty()))
        .bind(req.tts_template_recall.as_ref().filter(|s| !s.is_empty()))
        .bind(req.tts_template_break.as_ref().filter(|s| !s.is_empty()))
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        // Sync items if passed
        if !req.items.is_empty() {
            sqlx::query("DELETE FROM components_queue_layout_items WHERE queue_display_id = $1")
                .bind(id)
                .execute(&self.pool)
                .await
                .ok();
            for it in req.items {
                let item_id = Uuid::from_str(&it.id).unwrap_or_else(|_| Uuid::new_v4());
                let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));
                sqlx::query(
                    r#"
                    INSERT INTO components_queue_layout_items (
                        id, queue_display_id, item_type, name, x, y, width, height, z_index,
                        background_color, text_color, font_size, font_weight, text_align,
                        template_content, config, is_visible,
                        opacity, border_radius, border_color, border_width
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                    "#,
                )
                .bind(item_id)
                .bind(id)
                .bind(&it.item_type)
                .bind(&it.name)
                .bind(it.x)
                .bind(it.y)
                .bind(it.width)
                .bind(it.height)
                .bind(it.z_index)
                .bind(&it.background_color)
                .bind(&it.text_color)
                .bind(it.font_size)
                .bind(&it.font_weight)
                .bind(&it.text_align)
                .bind(&it.template_content)
                .bind(&config_val)
                .bind(it.is_visible)
                .bind(if it.opacity > 0.0 { it.opacity as f64 } else { 1.0 })
                .bind(it.border_radius)
                .bind(if it.border_color.is_empty() { "transparent" } else { &it.border_color })
                .bind(it.border_width)
                .execute(&self.pool)
                .await
                .ok();
            }
        }

        // Sync counters if passed
        if !req.counters.is_empty() {
            sqlx::query("DELETE FROM components_queue_counters WHERE queue_display_id = $1")
                .bind(id)
                .execute(&self.pool)
                .await
                .ok();
            for c in req.counters {
                let cid = Uuid::from_str(&c.id).unwrap_or_else(|_| Uuid::new_v4());
                sqlx::query(
                    r#"
                    INSERT INTO components_queue_counters (id, queue_display_id, counter_number, counter_name, operator_name, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    "#,
                )
                .bind(cid)
                .bind(id)
                .bind(c.counter_number)
                .bind(&c.counter_name)
                .bind(&c.operator_name)
                .bind(c.is_active)
                .execute(&self.pool)
                .await
                .ok();
            }
        }

        // Sync audios if passed
        if !req.audios.is_empty() {
            sqlx::query("DELETE FROM components_queue_audios WHERE queue_display_id = $1")
                .bind(id)
                .execute(&self.pool)
                .await
                .ok();
            for a in req.audios {
                let aid = Uuid::from_str(&a.id).unwrap_or_else(|_| Uuid::new_v4());
                let mid = Uuid::from_str(&a.media_item_id).ok();
                sqlx::query(
                    r#"
                    INSERT INTO components_queue_audios (id, queue_display_id, name, audio_type, media_item_id, file_url, volume_percent, is_active)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                    "#,
                )
                .bind(aid)
                .bind(id)
                .bind(&a.name)
                .bind(&a.audio_type)
                .bind(mid)
                .bind(if a.file_url.is_empty() { None } else { Some(&a.file_url) })
                .bind(a.volume_percent)
                .bind(a.is_active)
                .execute(&self.pool)
                .await
                .ok();
            }
        }

        self.fetch_display_detail(id).await.map(Response::new)
    }

    async fn delete_queue_display(
        &self,
        request: Request<DeleteQueueDisplayRequest>,
    ) -> Result<Response<DeleteQueueDisplayResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM components_queue_displays WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteQueueDisplayResponse { success: true }))
    }

    // Queue Layout Items ("Tata Letak Antrian")
    async fn save_queue_layout(
        &self,
        request: Request<SaveQueueLayoutRequest>,
    ) -> Result<Response<SaveQueueLayoutResponse>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;

        sqlx::query("DELETE FROM components_queue_layout_items WHERE queue_display_id = $1")
            .bind(display_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let mut saved_items = Vec::new();
        for it in req.items {
            let item_id = Uuid::from_str(&it.id).unwrap_or_else(|_| Uuid::new_v4());
            let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));
            sqlx::query(
                r#"
                INSERT INTO components_queue_layout_items (
                    id, queue_display_id, item_type, name, x, y, width, height, z_index,
                    background_color, text_color, font_size, font_weight, text_align,
                    template_content, config, is_visible,
                    opacity, border_radius, border_color, border_width
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
                "#,
            )
            .bind(item_id)
            .bind(display_id)
            .bind(&it.item_type)
            .bind(&it.name)
            .bind(it.x)
            .bind(it.y)
            .bind(it.width)
            .bind(it.height)
            .bind(it.z_index)
            .bind(&it.background_color)
            .bind(&it.text_color)
            .bind(it.font_size)
            .bind(&it.font_weight)
            .bind(&it.text_align)
            .bind(&it.template_content)
            .bind(&config_val)
            .bind(it.is_visible)
            .bind(if it.opacity > 0.0 { it.opacity as f64 } else { 1.0 })
            .bind(it.border_radius)
            .bind(if it.border_color.is_empty() { "transparent" } else { &it.border_color })
            .bind(it.border_width)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

            saved_items.push(QueueLayoutItem {
                id: item_id.to_string(),
                queue_display_id: display_id.to_string(),
                item_type: it.item_type,
                name: it.name,
                x: it.x,
                y: it.y,
                width: it.width,
                height: it.height,
                z_index: it.z_index,
                background_color: it.background_color,
                text_color: it.text_color,
                font_size: it.font_size,
                font_weight: it.font_weight,
                text_align: it.text_align,
                template_content: it.template_content,
                config_json: it.config_json,
                is_visible: it.is_visible,
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: chrono::Utc::now().to_rfc3339(),
                opacity: it.opacity,
                border_radius: it.border_radius,
                border_color: it.border_color,
                border_width: it.border_width,
            });
        }

        Ok(Response::new(SaveQueueLayoutResponse { items: saved_items }))
    }

    async fn get_queue_layout(
        &self,
        request: Request<GetQueueLayoutRequest>,
    ) -> Result<Response<GetQueueLayoutResponse>, Status> {
        let display_id = Uuid::from_str(&request.into_inner().queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;

        let rows = sqlx::query_as::<_, QueueLayoutItemRow>(
            r#"
            SELECT id, queue_display_id, item_type, name, x, y, width, height, z_index,
                   background_color, text_color, font_size, font_weight, text_align,
                   template_content, config, is_visible,
                   opacity, border_radius, border_color, border_width,
                   created_at, updated_at
            FROM components_queue_layout_items
            WHERE queue_display_id = $1
            ORDER BY z_index ASC, created_at ASC
            "#,
        )
        .bind(display_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|it| QueueLayoutItem {
            id: it.id.to_string(),
            queue_display_id: it.queue_display_id.to_string(),
            item_type: it.item_type,
            name: it.name,
            x: it.x,
            y: it.y,
            width: it.width,
            height: it.height,
            z_index: it.z_index,
            background_color: it.background_color.unwrap_or_else(|| "transparent".to_string()),
            text_color: it.text_color.unwrap_or_default(),
            font_size: it.font_size.unwrap_or(24),
            font_weight: it.font_weight.unwrap_or_default(),
            text_align: it.text_align.unwrap_or_default(),
            template_content: it.template_content,
            config_json: it.config.to_string(),
            is_visible: it.is_visible,
            created_at: it.created_at.to_rfc3339(),
            updated_at: it.updated_at.to_rfc3339(),
            opacity: it.opacity as f32,
            border_radius: it.border_radius,
            border_color: it.border_color,
            border_width: it.border_width,
        }).collect();

        Ok(Response::new(GetQueueLayoutResponse { items }))
    }

    async fn update_queue_layout_item(
        &self,
        request: Request<UpdateQueueLayoutItemRequest>,
    ) -> Result<Response<QueueLayoutItem>, Status> {
        let it = request.into_inner().item.ok_or_else(|| Status::invalid_argument("Missing item"))?;
        let item_id = Uuid::from_str(&it.id).map_err(|_| Status::invalid_argument("Invalid item id"))?;
        let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));

        sqlx::query(
            r#"
            UPDATE components_queue_layout_items
            SET name = $2, x = $3, y = $4, width = $5, height = $6, z_index = $7,
                background_color = $8, text_color = $9, font_size = $10,
                font_weight = $11, text_align = $12, template_content = $13,
                config = $14, is_visible = $15,
                opacity = $16, border_radius = $17, border_color = $18, border_width = $19,
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(item_id)
        .bind(&it.name)
        .bind(it.x)
        .bind(it.y)
        .bind(it.width)
        .bind(it.height)
        .bind(it.z_index)
        .bind(&it.background_color)
        .bind(&it.text_color)
        .bind(it.font_size)
        .bind(&it.font_weight)
        .bind(&it.text_align)
        .bind(&it.template_content)
        .bind(&config_val)
        .bind(it.is_visible)
        .bind(if it.opacity > 0.0 { it.opacity as f64 } else { 1.0 })
        .bind(it.border_radius)
        .bind(if it.border_color.is_empty() { "transparent" } else { &it.border_color })
        .bind(it.border_width)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(it))
    }

    async fn delete_queue_layout_item(
        &self,
        request: Request<DeleteQueueLayoutItemRequest>,
    ) -> Result<Response<DeleteQueueLayoutItemResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM components_queue_layout_items WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteQueueLayoutItemResponse { success: true }))
    }

    // Queue Counters
    async fn add_counter(
        &self,
        request: Request<AddCounterRequest>,
    ) -> Result<Response<QueueCounter>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id).map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let cid = Uuid::new_v4();

        sqlx::query(
            r#"
            INSERT INTO components_queue_counters (id, queue_display_id, counter_number, counter_name, operator_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            "#,
        )
        .bind(cid)
        .bind(display_id)
        .bind(req.counter_number)
        .bind(&req.counter_name)
        .bind(&req.operator_name)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(QueueCounter {
            id: cid.to_string(),
            queue_display_id: display_id.to_string(),
            counter_number: req.counter_number,
            counter_name: req.counter_name,
            operator_name: req.operator_name,
            is_active: true,
            current_ticket_number: "".to_string(),
            last_called_at: "".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
            status: "ACTIVE".to_string(),
            status_note: "".to_string(),
        }))
    }

    async fn update_counter(
        &self,
        request: Request<UpdateCounterRequest>,
    ) -> Result<Response<QueueCounter>, Status> {
        let req = request.into_inner();
        let cid = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid counter id"))?;
        let status = req.status.unwrap_or_else(|| "ACTIVE".to_string());
        let status_note = req.status_note;

        let row = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            UPDATE components_queue_counters
            SET counter_number = $2, counter_name = $3, operator_name = $4, is_active = $5,
                status = COALESCE(NULLIF($6, ''), status),
                status_note = COALESCE($7, status_note),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, queue_display_id, counter_number, counter_name, operator_name, is_active, status, status_note, current_ticket_number, last_called_at, created_at, updated_at
            "#,
        )
        .bind(cid)
        .bind(req.counter_number)
        .bind(&req.counter_name)
        .bind(&req.operator_name)
        .bind(req.is_active)
        .bind(&status)
        .bind(&status_note)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(QueueCounter {
            id: row.id.to_string(),
            queue_display_id: row.queue_display_id.to_string(),
            counter_number: row.counter_number,
            counter_name: row.counter_name,
            operator_name: row.operator_name.unwrap_or_default(),
            is_active: row.is_active,
            current_ticket_number: row.current_ticket_number.unwrap_or_default(),
            last_called_at: row.last_called_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            status: row.status,
            status_note: row.status_note.unwrap_or_default(),
        }))
    }

    async fn delete_counter(
        &self,
        request: Request<DeleteCounterRequest>,
    ) -> Result<Response<DeleteCounterResponse>, Status> {
        let cid = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM components_queue_counters WHERE id = $1")
            .bind(cid)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteCounterResponse { success: true }))
    }

    async fn list_counters(
        &self,
        request: Request<ListCountersRequest>,
    ) -> Result<Response<ListCountersResponse>, Status> {
        let display_id = Uuid::from_str(&request.into_inner().queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;

        let rows = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name, is_active, status, status_note, current_ticket_number, last_called_at, created_at, updated_at
            FROM components_queue_counters
            WHERE queue_display_id = $1
            ORDER BY counter_number ASC
            "#,
        )
        .bind(display_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|c| QueueCounter {
            id: c.id.to_string(),
            queue_display_id: c.queue_display_id.to_string(),
            counter_number: c.counter_number,
            counter_name: c.counter_name,
            operator_name: c.operator_name.unwrap_or_default(),
            is_active: c.is_active,
            current_ticket_number: c.current_ticket_number.unwrap_or_default(),
            last_called_at: c.last_called_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
            status: c.status,
            status_note: c.status_note.unwrap_or_default(),
        }).collect();

        Ok(Response::new(ListCountersResponse { items }))
    }

    // Queue Tickets
    async fn issue_ticket(
        &self,
        request: Request<IssueTicketRequest>,
    ) -> Result<Response<QueueTicket>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id).map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;

        let prefix = if req.prefix.is_empty() {
            sqlx::query_as::<_, (String,)>("SELECT prefix FROM components_queue_displays WHERE id = $1")
                .bind(display_id)
                .fetch_optional(&self.pool)
                .await
                .ok()
                .flatten()
                .map(|p| p.0)
                .unwrap_or_else(|| "A".to_string())
        } else {
            req.prefix
        };

        let (max_seq,): (i32,) = sqlx::query_as(
            r#"
            SELECT COALESCE(MAX(sequence_number), 0)
            FROM components_queue_tickets
            WHERE queue_display_id = $1 AND created_at >= CURRENT_DATE AND status != 'archived'
            "#,
        )
        .bind(display_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let next_seq = max_seq + 1;
        let ticket_num = format!("{}-{:03}", prefix, next_seq);
        let tid = Uuid::new_v4();

        sqlx::query(
            r#"
            INSERT INTO components_queue_tickets (id, queue_display_id, ticket_number, prefix, sequence_number, status)
            VALUES ($1, $2, $3, $4, $5, 'waiting')
            "#,
        )
        .bind(tid)
        .bind(display_id)
        .bind(&ticket_num)
        .bind(&prefix)
        .bind(next_seq)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(QueueTicket {
            id: tid.to_string(),
            queue_display_id: display_id.to_string(),
            counter_id: "".to_string(),
            ticket_number: ticket_num,
            prefix,
            sequence_number: next_seq,
            status: "waiting".to_string(),
            called_at: "".to_string(),
            completed_at: "".to_string(),
            created_at: chrono::Utc::now().to_rfc3339(),
        }))
    }

    async fn call_next_ticket(
        &self,
        request: Request<CallNextTicketRequest>,
    ) -> Result<Response<CallNextTicketResponse>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id).map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let counter_id = Uuid::from_str(&req.counter_id).map_err(|_| Status::invalid_argument("Invalid counter_id"))?;

        let counter_check: (String,) = sqlx::query_as(
            "SELECT status FROM components_queue_counters WHERE id = $1",
        )
        .bind(counter_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Counter not found"))?;

        if counter_check.0 == "BREAK" {
            return Err(Status::failed_precondition("Loket sedang dalam masa istirahat (BREAK)"));
        } else if counter_check.0 == "LOCKED" {
            return Err(Status::failed_precondition("Loket sedang terkunci / tutup (LOCKED)"));
        }

        // Find next waiting ticket
        let next_ticket: Option<(Uuid, String, String, i32)> = sqlx::query_as(
            r#"
            SELECT id, ticket_number, prefix, sequence_number
            FROM components_queue_tickets
            WHERE queue_display_id = $1 AND status = 'waiting'
            ORDER BY sequence_number ASC
            LIMIT 1
            "#,
        )
        .bind(display_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let (tid, tnum, tprefix, tseq) = match next_ticket {
            Some(t) => t,
            None => {
                let display_row: (String, i32) = sqlx::query_as(
                    "SELECT prefix, current_sequence FROM components_queue_displays WHERE id = $1",
                )
                .bind(display_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| Status::internal(e.to_string()))?
                .ok_or_else(|| Status::not_found("Queue display not found"))?;

                let (max_seq,): (i32,) = sqlx::query_as(
                    r#"
                    SELECT COALESCE(MAX(sequence_number), 0)
                    FROM components_queue_tickets
                    WHERE queue_display_id = $1 AND created_at >= CURRENT_DATE AND status != 'archived'
                    "#,
                )
                .bind(display_id)
                .fetch_one(&self.pool)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;

                let next_seq = std::cmp::max(display_row.1, max_seq) + 1;
                let prefix = if display_row.0.is_empty() { "A".to_string() } else { display_row.0 };
                let ticket_num = format!("{}-{:03}", prefix, next_seq);
                let new_tid = Uuid::new_v4();

                sqlx::query(
                    r#"
                    INSERT INTO components_queue_tickets (id, queue_display_id, counter_id, ticket_number, prefix, sequence_number, status, called_at)
                    VALUES ($1, $2, $3, $4, $5, $6, 'called', NOW())
                    "#,
                )
                .bind(new_tid)
                .bind(display_id)
                .bind(counter_id)
                .bind(&ticket_num)
                .bind(&prefix)
                .bind(next_seq)
                .execute(&self.pool)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;

                (new_tid, ticket_num, prefix, next_seq)
            }
        };

        let now = chrono::Utc::now();
        sqlx::query(
            r#"
            UPDATE components_queue_tickets
            SET status = 'called', counter_id = $2, called_at = $3
            WHERE id = $1
            "#,
        )
        .bind(tid)
        .bind(counter_id)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        sqlx::query(
            r#"
            UPDATE components_queue_counters
            SET current_ticket_number = $2, last_called_at = $3, updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(counter_id)
        .bind(&tnum)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        sqlx::query(
            "UPDATE components_queue_displays SET current_sequence = GREATEST(current_sequence, $2), updated_at = NOW() WHERE id = $1",
        )
        .bind(display_id)
        .bind(tseq)
        .execute(&self.pool)
        .await
        .ok();

        let counter_row = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name, is_active, status, status_note, current_ticket_number, last_called_at, created_at, updated_at
            FROM components_queue_counters
            WHERE id = $1
            "#,
        )
        .bind(counter_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(CallNextTicketResponse {
            ticket: Some(QueueTicket {
                id: tid.to_string(),
                queue_display_id: display_id.to_string(),
                counter_id: counter_id.to_string(),
                ticket_number: tnum.clone(),
                prefix: tprefix,
                sequence_number: tseq,
                status: "called".to_string(),
                called_at: now.to_rfc3339(),
                completed_at: "".to_string(),
                created_at: now.to_rfc3339(),
            }),
            counter: Some(QueueCounter {
                id: counter_row.id.to_string(),
                queue_display_id: counter_row.queue_display_id.to_string(),
                counter_number: counter_row.counter_number,
                counter_name: counter_row.counter_name,
                operator_name: counter_row.operator_name.unwrap_or_default(),
                is_active: counter_row.is_active,
                current_ticket_number: tnum,
                last_called_at: now.to_rfc3339(),
                created_at: counter_row.created_at.to_rfc3339(),
                updated_at: counter_row.updated_at.to_rfc3339(),
                status: counter_row.status,
                status_note: counter_row.status_note.unwrap_or_default(),
            }),
        }))
    }

    async fn call_previous_ticket(
        &self,
        request: Request<CallPreviousTicketRequest>,
    ) -> Result<Response<CallPreviousTicketResponse>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let counter_id = Uuid::from_str(&req.counter_id)
            .map_err(|_| Status::invalid_argument("Invalid counter_id"))?;

        let counter_row = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name, is_active, status, status_note, current_ticket_number, last_called_at, created_at, updated_at
            FROM components_queue_counters
            WHERE id = $1
            "#,
        )
        .bind(counter_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Counter not found"))?;

        if counter_row.status == "BREAK" {
            return Err(Status::failed_precondition("Loket sedang dalam masa istirahat (BREAK)"));
        } else if counter_row.status == "LOCKED" {
            return Err(Status::failed_precondition("Loket sedang terkunci / tutup (LOCKED)"));
        }

        let curr_num = counter_row.current_ticket_number.clone().unwrap_or_default();
        let curr_seq: i32 = curr_num.chars().filter(|c| c.is_ascii_digit()).collect::<String>().parse().unwrap_or(1);
        let prev_seq = std::cmp::max(1, curr_seq - 1);

        let (prefix,): (String,) = sqlx::query_as("SELECT prefix FROM components_queue_displays WHERE id = $1")
            .bind(display_id)
            .fetch_one(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        let prefix = if prefix.is_empty() { "A".to_string() } else { prefix };
        let prev_ticket_num = format!("{}-{:03}", prefix, prev_seq);

        let now = chrono::Utc::now();
        let existing_ticket: Option<(Uuid, String, i32)> = sqlx::query_as(
            "SELECT id, prefix, sequence_number FROM components_queue_tickets WHERE queue_display_id = $1 AND sequence_number = $2",
        )
        .bind(display_id)
        .bind(prev_seq)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let tid = match existing_ticket {
            Some(t) => {
                sqlx::query(
                    "UPDATE components_queue_tickets SET status = 'called', counter_id = $2, called_at = $3 WHERE id = $1",
                )
                .bind(t.0)
                .bind(counter_id)
                .bind(now)
                .execute(&self.pool)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;
                t.0
            }
            None => {
                let new_id = Uuid::new_v4();
                sqlx::query(
                    "INSERT INTO components_queue_tickets (id, queue_display_id, counter_id, ticket_number, prefix, sequence_number, status, called_at) VALUES ($1, $2, $3, $4, $5, $6, 'called', $7)",
                )
                .bind(new_id)
                .bind(display_id)
                .bind(counter_id)
                .bind(&prev_ticket_num)
                .bind(&prefix)
                .bind(prev_seq)
                .bind(now)
                .execute(&self.pool)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;
                new_id
            }
        };

        sqlx::query(
            "UPDATE components_queue_counters SET current_ticket_number = $2, last_called_at = $3, updated_at = NOW() WHERE id = $1",
        )
        .bind(counter_id)
        .bind(&prev_ticket_num)
        .bind(now)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        sqlx::query(
            "UPDATE components_queue_displays SET current_sequence = $2, updated_at = NOW() WHERE id = $1",
        )
        .bind(display_id)
        .bind(prev_seq)
        .execute(&self.pool)
        .await
        .ok();

        Ok(Response::new(CallPreviousTicketResponse {
            ticket: Some(QueueTicket {
                id: tid.to_string(),
                queue_display_id: display_id.to_string(),
                counter_id: counter_id.to_string(),
                ticket_number: prev_ticket_num.clone(),
                prefix,
                sequence_number: prev_seq,
                status: "called".to_string(),
                called_at: now.to_rfc3339(),
                completed_at: "".to_string(),
                created_at: now.to_rfc3339(),
            }),
            counter: Some(QueueCounter {
                id: counter_row.id.to_string(),
                queue_display_id: counter_row.queue_display_id.to_string(),
                counter_number: counter_row.counter_number,
                counter_name: counter_row.counter_name,
                operator_name: counter_row.operator_name.unwrap_or_default(),
                is_active: counter_row.is_active,
                current_ticket_number: prev_ticket_num,
                last_called_at: now.to_rfc3339(),
                created_at: chrono::Utc::now().to_rfc3339(),
                updated_at: now.to_rfc3339(),
                status: counter_row.status,
                status_note: counter_row.status_note.unwrap_or_default(),
            }),
        }))
    }

    async fn reset_queue(
        &self,
        request: Request<ResetQueueRequest>,
    ) -> Result<Response<ResetQueueResponse>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let start_seq = if req.start_sequence >= 0 { req.start_sequence } else { 0 };

        // Reset sequence in display
        sqlx::query(
            "UPDATE components_queue_displays SET current_sequence = $2, updated_at = NOW() WHERE id = $1",
        )
        .bind(display_id)
        .bind(start_seq)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        // Archive active tickets
        sqlx::query(
            "UPDATE components_queue_tickets SET status = 'archived' WHERE queue_display_id = $1 AND status IN ('waiting', 'called', 'serving')",
        )
        .bind(display_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        // Clear current ticket number on counters
        sqlx::query(
            "UPDATE components_queue_counters SET current_ticket_number = NULL, last_called_at = NULL, updated_at = NOW() WHERE queue_display_id = $1",
        )
        .bind(display_id)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ResetQueueResponse {
            success: true,
            new_sequence: start_seq,
            message: format!("Antrian berhasil direset ke nomor awal {}", start_seq),
        }))
    }

    async fn set_counter_status(
        &self,
        request: Request<SetCounterStatusRequest>,
    ) -> Result<Response<QueueCounter>, Status> {
        let req = request.into_inner();
        let cid = Uuid::from_str(&req.counter_id)
            .map_err(|_| Status::invalid_argument("Invalid counter_id"))?;
        let status = match req.status.to_uppercase().as_str() {
            "BREAK" | "ISTIRAHAT" => "BREAK",
            "LOCKED" | "KUNCI" | "CLOSED" => "LOCKED",
            _ => "ACTIVE",
        };
        let note = req.status_note.unwrap_or_default();

        let row = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            UPDATE components_queue_counters
            SET status = $2, status_note = $3, updated_at = NOW()
            WHERE id = $1
            RETURNING id, queue_display_id, counter_number, counter_name, operator_name, is_active, status, status_note, current_ticket_number, last_called_at, created_at, updated_at
            "#,
        )
        .bind(cid)
        .bind(status)
        .bind(&note)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(QueueCounter {
            id: row.id.to_string(),
            queue_display_id: row.queue_display_id.to_string(),
            counter_number: row.counter_number,
            counter_name: row.counter_name,
            operator_name: row.operator_name.unwrap_or_default(),
            is_active: row.is_active,
            current_ticket_number: row.current_ticket_number.unwrap_or_default(),
            last_called_at: row.last_called_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            status: row.status,
            status_note: row.status_note.unwrap_or_default(),
        }))
    }

    async fn get_queue_sync_state(
        &self,
        request: Request<GetQueueSyncStateRequest>,
    ) -> Result<Response<GetQueueSyncStateResponse>, Status> {
        let display_id = Uuid::from_str(&request.into_inner().queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;

        let display = sqlx::query_as::<_, QueueDisplaySyncRow>(
            r#"
            SELECT prefix, current_sequence, sector_type, ticket_label, counter_label,
                   tts_template_call, tts_template_recall, tts_template_break
            FROM components_queue_displays
            WHERE id = $1
            "#,
        )
        .bind(display_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Queue display not found"))?;

        let counters = sqlx::query_as::<_, QueueCounterRow>(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name,
                   is_active, status, status_note, current_ticket_number, last_called_at,
                   created_at, updated_at
            FROM components_queue_counters
            WHERE queue_display_id = $1
            ORDER BY counter_number ASC
            "#,
        )
        .bind(display_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .into_iter()
        .map(|c| QueueCounter {
            id: c.id.to_string(),
            queue_display_id: c.queue_display_id.to_string(),
            counter_number: c.counter_number,
            counter_name: c.counter_name,
            operator_name: c.operator_name.unwrap_or_default(),
            is_active: c.is_active,
            current_ticket_number: c.current_ticket_number.unwrap_or_default(),
            last_called_at: c.last_called_at.map(|t| t.to_rfc3339()).unwrap_or_default(),
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
            status: c.status,
            status_note: c.status_note.unwrap_or_default(),
        })
        .collect();

        let (waiting_count,): (i64,) = sqlx::query_as(
            "SELECT COUNT(*) FROM components_queue_tickets WHERE queue_display_id = $1 AND status = 'waiting'",
        )
        .bind(display_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let latest_ticket_opt: Option<(String,)> = sqlx::query_as(
            r#"
            SELECT ticket_number
            FROM components_queue_tickets
            WHERE queue_display_id = $1 AND status IN ('called', 'serving')
            ORDER BY called_at DESC NULLS LAST
            LIMIT 1
            "#,
        )
        .bind(display_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let latest_ticket = latest_ticket_opt
            .map(|t| t.0)
            .unwrap_or_else(|| {
                let p = if display.prefix.is_empty() { "A" } else { &display.prefix };
                format!("{}-{:03}", p, display.current_sequence)
            });

        Ok(Response::new(GetQueueSyncStateResponse {
            queue_display_id: display_id.to_string(),
            prefix: display.prefix,
            current_sequence: display.current_sequence,
            current_ticket_number: latest_ticket,
            sector_type: display.sector_type,
            ticket_label: display.ticket_label,
            counter_label: display.counter_label,
            tts_template_call: display.tts_template_call,
            tts_template_recall: display.tts_template_recall,
            tts_template_break: display.tts_template_break,
            counters,
            waiting_tickets_count: waiting_count as i32,
        }))
    }

    async fn list_tickets(
        &self,
        request: Request<ListTicketsRequest>,
    ) -> Result<Response<ListTicketsResponse>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id).map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let limit = if req.limit > 0 { req.limit as i64 } else { 50 };

        let rows = sqlx::query_as::<_, QueueTicketRow>(
            r#"
            SELECT id, queue_display_id, counter_id, ticket_number, prefix, sequence_number, status, called_at, completed_at, created_at
            FROM components_queue_tickets
            WHERE queue_display_id = $1 AND ($2::text IS NULL OR status = $2)
            ORDER BY created_at DESC
            LIMIT $3
            "#,
        )
        .bind(display_id)
        .bind(req.status.as_ref().filter(|s| !s.is_empty()))
        .bind(limit)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|t| QueueTicket {
            id: t.id.to_string(),
            queue_display_id: t.queue_display_id.to_string(),
            counter_id: t.counter_id.map(|c| c.to_string()).unwrap_or_default(),
            ticket_number: t.ticket_number,
            prefix: t.prefix,
            sequence_number: t.sequence_number,
            status: t.status,
            called_at: t.called_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            completed_at: t.completed_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            created_at: t.created_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(ListTicketsResponse { items }))
    }

    async fn update_ticket_status(
        &self,
        request: Request<UpdateTicketStatusRequest>,
    ) -> Result<Response<QueueTicket>, Status> {
        let req = request.into_inner();
        let tid = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid ticket id"))?;
        let counter_id = req.counter_id.and_then(|c| Uuid::from_str(&c).ok());

        let row = sqlx::query_as::<_, QueueTicketRow>(
            r#"
            UPDATE components_queue_tickets
            SET status = $2::text,
                counter_id = COALESCE($3, counter_id),
                completed_at = CASE WHEN ($2::text = 'completed' OR $2::text = 'skipped') THEN NOW() ELSE completed_at END
            WHERE id = $1
            RETURNING id, queue_display_id, counter_id, ticket_number, prefix, sequence_number, status, called_at, completed_at, created_at
            "#,
        )
        .bind(tid)
        .bind(&req.status)
        .bind(counter_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(QueueTicket {
            id: row.id.to_string(),
            queue_display_id: row.queue_display_id.to_string(),
            counter_id: row.counter_id.map(|c| c.to_string()).unwrap_or_default(),
            ticket_number: row.ticket_number,
            prefix: row.prefix,
            sequence_number: row.sequence_number,
            status: row.status,
            called_at: row.called_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            completed_at: row.completed_at.map(|d| d.to_rfc3339()).unwrap_or_default(),
            created_at: row.created_at.to_rfc3339(),
        }))
    }

    // Queue Audios
    async fn add_audio(
        &self,
        request: Request<AddAudioRequest>,
    ) -> Result<Response<QueueAudio>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id).map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let media_id = req.media_item_id.and_then(|m| Uuid::from_str(&m).ok());
        let aid = Uuid::new_v4();

        sqlx::query(
            r#"
            INSERT INTO components_queue_audios (id, queue_display_id, name, audio_type, media_item_id, file_url, volume_percent, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
        )
        .bind(aid)
        .bind(display_id)
        .bind(&req.name)
        .bind(&req.audio_type)
        .bind(media_id)
        .bind(req.file_url.as_ref().filter(|s| !s.is_empty()))
        .bind(req.volume_percent)
        .bind(req.is_active)
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(QueueAudio {
            id: aid.to_string(),
            queue_display_id: display_id.to_string(),
            name: req.name,
            audio_type: req.audio_type,
            media_item_id: media_id.map(|m| m.to_string()).unwrap_or_default(),
            file_url: req.file_url.unwrap_or_default(),
            volume_percent: req.volume_percent,
            is_active: req.is_active,
            created_at: chrono::Utc::now().to_rfc3339(),
            updated_at: chrono::Utc::now().to_rfc3339(),
        }))
    }

    async fn delete_audio(
        &self,
        request: Request<DeleteAudioRequest>,
    ) -> Result<Response<DeleteAudioResponse>, Status> {
        let aid = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid audio id"))?;
        sqlx::query("DELETE FROM components_queue_audios WHERE id = $1")
            .bind(aid)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteAudioResponse { success: true }))
    }

    async fn list_audios(
        &self,
        request: Request<ListAudiosRequest>,
    ) -> Result<Response<ListAudiosResponse>, Status> {
        let display_id = Uuid::from_str(&request.into_inner().queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;

        let rows = sqlx::query_as::<_, QueueAudioRow>(
            r#"
            SELECT id, queue_display_id, name, audio_type, media_item_id, file_url, volume_percent, is_active, created_at, updated_at
            FROM components_queue_audios
            WHERE queue_display_id = $1
            ORDER BY created_at ASC
            "#,
        )
        .bind(display_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|a| QueueAudio {
            id: a.id.to_string(),
            queue_display_id: a.queue_display_id.to_string(),
            name: a.name,
            audio_type: a.audio_type,
            media_item_id: a.media_item_id.map(|m| m.to_string()).unwrap_or_default(),
            file_url: a.file_url.unwrap_or_default(),
            volume_percent: a.volume_percent,
            is_active: a.is_active,
            created_at: a.created_at.to_rfc3339(),
            updated_at: a.updated_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(ListAudiosResponse { items }))
    }

    async fn list_queue_sectors(
        &self,
        _request: Request<ListQueueSectorsRequest>,
    ) -> Result<Response<ListQueueSectorsResponse>, Status> {
        let rows = sqlx::query_as::<_, QueueSectorRow>(
            r#"
            SELECT id, name, description, default_prefix, ticket_label, counter_label,
                   tts_template_call, tts_template_recall, tts_template_break, icon, sort_order,
                   created_at, updated_at
            FROM components_queue_sectors
            ORDER BY sort_order ASC, name ASC
            "#,
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let sectors = rows.into_iter().map(|s| QueueSector {
            id: s.id,
            name: s.name,
            description: s.description,
            default_prefix: s.default_prefix,
            ticket_label: s.ticket_label,
            counter_label: s.counter_label,
            tts_template_call: s.tts_template_call,
            tts_template_recall: s.tts_template_recall,
            tts_template_break: s.tts_template_break,
            icon: s.icon,
            sort_order: s.sort_order,
            created_at: s.created_at.to_rfc3339(),
            updated_at: s.updated_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(ListQueueSectorsResponse { sectors }))
    }
}
