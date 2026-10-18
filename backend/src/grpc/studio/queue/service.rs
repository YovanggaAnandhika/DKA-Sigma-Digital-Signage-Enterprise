use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::PgPool;
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
    ListTicketsRequest, ListTicketsResponse, UpdateTicketStatusRequest, AddAudioRequest,
    DeleteAudioRequest, DeleteAudioResponse, ListAudiosRequest, ListAudiosResponse,
    QueueDisplayDetail, QueueLayoutItem, QueueCounter, QueueTicket, QueueAudio,
};
use crate::grpc::proto::common::v1::PaginationResponse;

pub struct QueueServiceImpl {
    pub pool: PgPool,
}

impl QueueServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn fetch_display_detail(&self, id: Uuid) -> Result<QueueDisplayDetail, Status> {
        let display = sqlx::query!(
            r#"
            SELECT id, name, prefix, canvas_width, canvas_height, background_color,
                   background_image_url, theme_preset, auto_recall_enabled, created_at, updated_at
            FROM queue_displays
            WHERE id = $1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Queue display not found"))?;

        let items = sqlx::query!(
            r#"
            SELECT id, queue_display_id, item_type, name, x, y, width, height, z_index,
                   background_color, text_color, font_size, font_weight, text_align,
                   template_content, config, is_visible, created_at, updated_at
            FROM queue_layout_items
            WHERE queue_display_id = $1
            ORDER BY z_index ASC, created_at ASC
            "#,
            id
        )
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
            background_color: it.background_color.unwrap_or_default(),
            text_color: it.text_color.unwrap_or_default(),
            font_size: it.font_size.unwrap_or(24),
            font_weight: it.font_weight.unwrap_or_default(),
            text_align: it.text_align.unwrap_or_default(),
            template_content: it.template_content,
            config_json: it.config.to_string(),
            is_visible: it.is_visible,
            created_at: it.created_at.to_rfc3339(),
            updated_at: it.updated_at.to_rfc3339(),
        })
        .collect();

        let counters = sqlx::query!(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name,
                   is_active, created_at, updated_at
            FROM queue_counters
            WHERE queue_display_id = $1
            ORDER BY counter_number ASC
            "#,
            id
        )
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
            current_ticket_number: "".to_string(),
            last_called_at: "".to_string(),
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
        })
        .collect();

        let audios = sqlx::query!(
            r#"
            SELECT id, queue_display_id, name, audio_type, media_item_id, file_url,
                   volume_percent, is_active, created_at, updated_at
            FROM queue_audios
            WHERE queue_display_id = $1
            ORDER BY created_at ASC
            "#,
            id
        )
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

        let waiting_count = sqlx::query!(
            r#"
            SELECT COUNT(*) as "count!"
            FROM queue_tickets
            WHERE queue_display_id = $1 AND status = 'waiting'
            "#,
            id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .count;

        let latest_ticket = sqlx::query!(
            r#"
            SELECT ticket_number
            FROM queue_tickets
            WHERE queue_display_id = $1 AND status IN ('called', 'serving')
            ORDER BY called_at DESC NULLS LAST
            LIMIT 1
            "#,
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .map(|t| t.ticket_number)
        .unwrap_or_else(|| format!("{}-001", display.prefix));

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

        sqlx::query!(
            r#"
            INSERT INTO queue_displays (
                id, name, prefix, canvas_width, canvas_height, background_color,
                background_image_url, theme_preset, auto_recall_enabled
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            "#,
            display_id,
            req.name,
            if req.prefix.is_empty() { "A" } else { &req.prefix },
            if req.canvas_width > 0 { req.canvas_width } else { 1920 },
            if req.canvas_height > 0 { req.canvas_height } else { 1080 },
            if req.background_color.is_empty() { "#f8fafc" } else { &req.background_color },
            if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
            if req.theme_preset.is_empty() { "clean-light" } else { &req.theme_preset },
            req.auto_recall_enabled,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        // Insert items if provided
        for it in req.items {
            let item_id = Uuid::from_str(&it.id).unwrap_or_else(|_| Uuid::new_v4());
            let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));
            sqlx::query!(
                r#"
                INSERT INTO queue_layout_items (
                    id, queue_display_id, item_type, name, x, y, width, height, z_index,
                    background_color, text_color, font_size, font_weight, text_align,
                    template_content, config, is_visible
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                "#,
                item_id,
                display_id,
                it.item_type,
                it.name,
                it.x,
                it.y,
                it.width,
                it.height,
                it.z_index,
                it.background_color,
                it.text_color,
                it.font_size,
                it.font_weight,
                it.text_align,
                it.template_content,
                config_val,
                it.is_visible,
            )
            .execute(&self.pool)
            .await
            .ok();
        }

        // Insert counters if provided
        for c in req.counters {
            let cid = Uuid::from_str(&c.id).unwrap_or_else(|_| Uuid::new_v4());
            sqlx::query!(
                r#"
                INSERT INTO queue_counters (id, queue_display_id, counter_number, counter_name, operator_name, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#,
                cid,
                display_id,
                c.counter_number,
                c.counter_name,
                c.operator_name,
                c.is_active,
            )
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

        let rows = sqlx::query!(
            r#"
            SELECT id FROM queue_displays
            WHERE name ILIKE $1 OR prefix ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#,
            search_pattern
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for r in rows {
            if let Ok(d) = self.fetch_display_detail(r.id).await {
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

        sqlx::query!(
            r#"
            UPDATE queue_displays
            SET name = COALESCE(NULLIF($2, ''), name),
                prefix = COALESCE(NULLIF($3, ''), prefix),
                canvas_width = CASE WHEN $4 > 0 THEN $4 ELSE canvas_width END,
                canvas_height = CASE WHEN $5 > 0 THEN $5 ELSE canvas_height END,
                background_color = COALESCE(NULLIF($6, ''), background_color),
                background_image_url = $7,
                theme_preset = COALESCE(NULLIF($8, ''), theme_preset),
                auto_recall_enabled = $9,
                updated_at = NOW()
            WHERE id = $1
            "#,
            id,
            req.name,
            req.prefix,
            req.canvas_width,
            req.canvas_height,
            req.background_color,
            if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
            req.theme_preset,
            req.auto_recall_enabled,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        // Sync items if passed
        if !req.items.is_empty() {
            sqlx::query!("DELETE FROM queue_layout_items WHERE queue_display_id = $1", id)
                .execute(&self.pool)
                .await
                .ok();
            for it in req.items {
                let item_id = Uuid::from_str(&it.id).unwrap_or_else(|_| Uuid::new_v4());
                let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));
                sqlx::query!(
                    r#"
                    INSERT INTO queue_layout_items (
                        id, queue_display_id, item_type, name, x, y, width, height, z_index,
                        background_color, text_color, font_size, font_weight, text_align,
                        template_content, config, is_visible
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                    "#,
                    item_id,
                    id,
                    it.item_type,
                    it.name,
                    it.x,
                    it.y,
                    it.width,
                    it.height,
                    it.z_index,
                    it.background_color,
                    it.text_color,
                    it.font_size,
                    it.font_weight,
                    it.text_align,
                    it.template_content,
                    config_val,
                    it.is_visible,
                )
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
        sqlx::query!("DELETE FROM queue_displays WHERE id = $1", id)
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

        sqlx::query!("DELETE FROM queue_layout_items WHERE queue_display_id = $1", display_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let mut saved_items = Vec::new();
        for it in req.items {
            let item_id = Uuid::from_str(&it.id).unwrap_or_else(|_| Uuid::new_v4());
            let config_val: serde_json::Value = serde_json::from_str(&it.config_json).unwrap_or(serde_json::json!({}));
            sqlx::query!(
                r#"
                INSERT INTO queue_layout_items (
                    id, queue_display_id, item_type, name, x, y, width, height, z_index,
                    background_color, text_color, font_size, font_weight, text_align,
                    template_content, config, is_visible
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
                "#,
                item_id,
                display_id,
                it.item_type,
                it.name,
                it.x,
                it.y,
                it.width,
                it.height,
                it.z_index,
                it.background_color,
                it.text_color,
                it.font_size,
                it.font_weight,
                it.text_align,
                it.template_content,
                config_val,
                it.is_visible,
            )
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

        let rows = sqlx::query!(
            r#"
            SELECT id, queue_display_id, item_type, name, x, y, width, height, z_index,
                   background_color, text_color, font_size, font_weight, text_align,
                   template_content, config, is_visible, created_at, updated_at
            FROM queue_layout_items
            WHERE queue_display_id = $1
            ORDER BY z_index ASC, created_at ASC
            "#,
            display_id
        )
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
            background_color: it.background_color.unwrap_or_default(),
            text_color: it.text_color.unwrap_or_default(),
            font_size: it.font_size.unwrap_or(24),
            font_weight: it.font_weight.unwrap_or_default(),
            text_align: it.text_align.unwrap_or_default(),
            template_content: it.template_content,
            config_json: it.config.to_string(),
            is_visible: it.is_visible,
            created_at: it.created_at.to_rfc3339(),
            updated_at: it.updated_at.to_rfc3339(),
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

        sqlx::query!(
            r#"
            UPDATE queue_layout_items
            SET name = $2, x = $3, y = $4, width = $5, height = $6, z_index = $7,
                background_color = $8, text_color = $9, font_size = $10,
                font_weight = $11, text_align = $12, template_content = $13,
                config = $14, is_visible = $15, updated_at = NOW()
            WHERE id = $1
            "#,
            item_id,
            it.name,
            it.x,
            it.y,
            it.width,
            it.height,
            it.z_index,
            it.background_color,
            it.text_color,
            it.font_size,
            it.font_weight,
            it.text_align,
            it.template_content,
            config_val,
            it.is_visible,
        )
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
        sqlx::query!("DELETE FROM queue_layout_items WHERE id = $1", id)
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

        sqlx::query!(
            r#"
            INSERT INTO queue_counters (id, queue_display_id, counter_number, counter_name, operator_name, is_active)
            VALUES ($1, $2, $3, $4, $5, true)
            "#,
            cid,
            display_id,
            req.counter_number,
            req.counter_name,
            req.operator_name,
        )
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
        }))
    }

    async fn update_counter(
        &self,
        request: Request<UpdateCounterRequest>,
    ) -> Result<Response<QueueCounter>, Status> {
        let req = request.into_inner();
        let cid = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid counter id"))?;

        let row = sqlx::query!(
            r#"
            UPDATE queue_counters
            SET counter_number = $2, counter_name = $3, operator_name = $4, is_active = $5, updated_at = NOW()
            WHERE id = $1
            RETURNING id, queue_display_id, counter_number, counter_name, operator_name, is_active, created_at, updated_at
            "#,
            cid,
            req.counter_number,
            req.counter_name,
            req.operator_name,
            req.is_active,
        )
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
            current_ticket_number: "".to_string(),
            last_called_at: "".to_string(),
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_counter(
        &self,
        request: Request<DeleteCounterRequest>,
    ) -> Result<Response<DeleteCounterResponse>, Status> {
        let cid = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM queue_counters WHERE id = $1", cid)
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

        let rows = sqlx::query!(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name, is_active, created_at, updated_at
            FROM queue_counters
            WHERE queue_display_id = $1
            ORDER BY counter_number ASC
            "#,
            display_id
        )
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
            current_ticket_number: "".to_string(),
            last_called_at: "".to_string(),
            created_at: c.created_at.to_rfc3339(),
            updated_at: c.updated_at.to_rfc3339(),
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
            sqlx::query!("SELECT prefix FROM queue_displays WHERE id = $1", display_id)
                .fetch_optional(&self.pool)
                .await
                .ok()
                .flatten()
                .map(|p| p.prefix)
                .unwrap_or_else(|| "A".to_string())
        } else {
            req.prefix
        };

        let max_seq = sqlx::query!(
            r#"
            SELECT COALESCE(MAX(sequence_number), 0) as "max_seq!"
            FROM queue_tickets
            WHERE queue_display_id = $1 AND created_at >= CURRENT_DATE
            "#,
            display_id
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .max_seq;

        let next_seq = max_seq + 1;
        let ticket_num = format!("{}-{:03}", prefix, next_seq);
        let tid = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO queue_tickets (id, queue_display_id, ticket_number, prefix, sequence_number, status)
            VALUES ($1, $2, $3, $4, $5, 'waiting')
            "#,
            tid,
            display_id,
            ticket_num,
            prefix,
            next_seq,
        )
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

        // Find next waiting ticket
        let next_ticket = sqlx::query!(
            r#"
            SELECT id, ticket_number, prefix, sequence_number
            FROM queue_tickets
            WHERE queue_display_id = $1 AND status = 'waiting'
            ORDER BY sequence_number ASC
            LIMIT 1
            "#,
            display_id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let (tid, tnum, tprefix, tseq) = match next_ticket {
            Some(t) => (t.id, t.ticket_number, t.prefix, t.sequence_number),
            None => {
                let counter_row = sqlx::query!(
                    "SELECT id, queue_display_id, counter_number, counter_name, operator_name, is_active, created_at, updated_at FROM queue_counters WHERE id = $1",
                    counter_id
                )
                .fetch_optional(&self.pool)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;

                return Ok(Response::new(CallNextTicketResponse {
                    ticket: None,
                    counter: counter_row.map(|c| QueueCounter {
                        id: c.id.to_string(),
                        queue_display_id: c.queue_display_id.to_string(),
                        counter_number: c.counter_number,
                        counter_name: c.counter_name,
                        operator_name: c.operator_name.unwrap_or_default(),
                        is_active: c.is_active,
                        current_ticket_number: String::new(),
                        last_called_at: String::new(),
                        created_at: c.created_at.to_rfc3339(),
                        updated_at: c.updated_at.to_rfc3339(),
                    }),
                }));
            }
        };

        let now = chrono::Utc::now();
        sqlx::query!(
            r#"
            UPDATE queue_tickets
            SET status = 'called', counter_id = $2, called_at = $3
            WHERE id = $1
            "#,
            tid,
            counter_id,
            now,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let counter_row = sqlx::query!(
            r#"
            SELECT id, queue_display_id, counter_number, counter_name, operator_name, is_active, created_at, updated_at
            FROM queue_counters
            WHERE id = $1
            "#,
            counter_id
        )
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
            }),
        }))
    }

    async fn list_tickets(
        &self,
        request: Request<ListTicketsRequest>,
    ) -> Result<Response<ListTicketsResponse>, Status> {
        let req = request.into_inner();
        let display_id = Uuid::from_str(&req.queue_display_id).map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let limit = if req.limit > 0 { req.limit as i64 } else { 50 };

        let rows = sqlx::query!(
            r#"
            SELECT id, queue_display_id, counter_id, ticket_number, prefix, sequence_number, status, called_at, completed_at, created_at
            FROM queue_tickets
            WHERE queue_display_id = $1 AND ($2::text IS NULL OR status = $2)
            ORDER BY created_at DESC
            LIMIT $3
            "#,
            display_id,
            req.status,
            limit
        )
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

        let row = sqlx::query!(
            r#"
            UPDATE queue_tickets
            SET status = $2::text,
                counter_id = COALESCE($3, counter_id),
                completed_at = CASE WHEN ($2::text = 'completed' OR $2::text = 'skipped') THEN NOW() ELSE completed_at END
            WHERE id = $1
            RETURNING id, queue_display_id, counter_id, ticket_number, prefix, sequence_number, status, called_at, completed_at, created_at
            "#,
            tid,
            req.status,
            counter_id
        )
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

        sqlx::query!(
            r#"
            INSERT INTO queue_audios (id, queue_display_id, name, audio_type, media_item_id, file_url, volume_percent, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            "#,
            aid,
            display_id,
            req.name,
            req.audio_type,
            media_id,
            req.file_url,
            req.volume_percent,
            req.is_active,
        )
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
        sqlx::query!("DELETE FROM queue_audios WHERE id = $1", aid)
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

        let rows = sqlx::query!(
            r#"
            SELECT id, queue_display_id, name, audio_type, media_item_id, file_url, volume_percent, is_active, created_at, updated_at
            FROM queue_audios
            WHERE queue_display_id = $1
            ORDER BY created_at ASC
            "#,
            display_id
        )
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
}
