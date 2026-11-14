use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::components::v1::ticker::{
    ticker_service_server::TickerService as TickerServiceTrait,
    CreateTickerRequest, GetTickerRequest, ListTickersRequest, ListTickersResponse,
    UpdateTickerRequest, DeleteTickerRequest, DeleteTickerResponse, Ticker,
};
use crate::grpc::proto::common::v1::PaginationResponse;

#[derive(FromRow)]
struct TickerRow {
    id: Uuid,
    name: String,
    text_content: String,
    badge_label: Option<String>,
    speed: String,
    font_size: i32,
    background_color: String,
    text_color: String,
    badge_bg_color: Option<String>,
    badge_text_color: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl TickerRow {
    fn into_proto(self) -> Ticker {
        Ticker {
            id: self.id.to_string(),
            name: self.name,
            badge: self.badge_label.unwrap_or_default(),
            messages: vec![self.text_content],
            speed: self.speed,
            theme: "blue".to_string(),
            font_size: self.font_size,
            background_color: self.background_color,
            text_color: self.text_color,
            badge_background_color: self.badge_bg_color.unwrap_or_else(|| "#2563eb".to_string()),
            badge_text_color: self.badge_text_color.unwrap_or_else(|| "#ffffff".to_string()),
            border_color: "#60a5fa".to_string(),
            border_radius: 8,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        }
    }
}

pub struct TickerServiceImpl {
    pub pool: PgPool,
}

impl TickerServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl TickerServiceTrait for TickerServiceImpl {
    async fn create_ticker(
        &self,
        request: Request<CreateTickerRequest>,
    ) -> Result<Response<Ticker>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_tickers")?;
        let corp_id = claims.active_corporation_id()
            .and_then(|c| Uuid::parse_str(c).ok())
            .unwrap_or_else(|| Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap());
        let branch_id = claims.branch_id.as_deref().and_then(|b| Uuid::parse_str(b).ok());
        let user_id = Uuid::parse_str(&claims.sub).ok();

        let req = request.into_inner();
        let id = Uuid::new_v4();
        let text_content = if !req.messages.is_empty() { req.messages.join(" • ") } else { "Pengumuman".to_string() };

        let row = sqlx::query_as::<_, TickerRow>(
            r#"
            INSERT INTO components_tickers (
                id, corporation_id, branch_id, created_by_user_id,
                name, text_content, badge_label, speed, font_size,
                background_color, text_color, badge_bg_color, badge_text_color
            )
            VALUES (
                $1, $2, $3, $4,
                $5, $6, $7, $8, $9,
                COALESCE(NULLIF($10, ''), '#000000'),
                COALESCE(NULLIF($11, ''), '#ffffff'),
                COALESCE(NULLIF($12, ''), '#2563eb'),
                COALESCE(NULLIF($13, ''), '#ffffff')
            )
            RETURNING id, name, text_content, badge_label, speed, font_size,
                      background_color, text_color, badge_bg_color, badge_text_color,
                      created_at, updated_at
            "#
        )
        .bind(id)
        .bind(corp_id)
        .bind(branch_id)
        .bind(user_id)
        .bind(&req.name)
        .bind(&text_content)
        .bind(&req.badge)
        .bind(&req.speed)
        .bind(req.font_size)
        .bind(&req.background_color)
        .bind(&req.text_color)
        .bind(&req.badge_background_color)
        .bind(&req.badge_text_color)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn get_ticker(
        &self,
        request: Request<GetTickerRequest>,
    ) -> Result<Response<Ticker>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_view_tickers")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query_as::<_, TickerRow>(
            "SELECT id, name, text_content, badge_label, speed, font_size, background_color, text_color, badge_bg_color, badge_text_color, created_at, updated_at FROM components_tickers WHERE id = $1 AND ($2::uuid IS NULL OR corporation_id = $2)"
        )
        .bind(id)
        .bind(corp_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Ticker not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn list_tickers(
        &self,
        request: Request<ListTickersRequest>,
    ) -> Result<Response<ListTickersResponse>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_view_tickers")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query_as::<_, TickerRow>(
            r#"
            SELECT id, name, text_content, badge_label, speed, font_size,
                   background_color, text_color, badge_bg_color, badge_text_color,
                   created_at, updated_at
            FROM components_tickers
            WHERE ($1::uuid IS NULL OR corporation_id = $1)
              AND (name ILIKE $2 OR text_content ILIKE $2 OR badge_label ILIKE $2)
            ORDER BY created_at DESC
            LIMIT 50
            "#
        )
        .bind(corp_id)
        .bind(&search)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(TickerRow::into_proto).collect();

        Ok(Response::new(ListTickersResponse {
            items,
            pagination: Some(PaginationResponse {
                current_page: 1,
                limit: 50,
                total_items: 0,
                total_pages: 1,
            }),
        }))
    }

    async fn update_ticker(
        &self,
        request: Request<UpdateTickerRequest>,
    ) -> Result<Response<Ticker>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_tickers")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let req = request.into_inner();
        let id = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let text_content = if !req.messages.is_empty() { Some(req.messages.join(" • ")) } else { None };

        let row = sqlx::query_as::<_, TickerRow>(
            r#"
            UPDATE components_tickers
            SET name = COALESCE(NULLIF($2, ''), name),
                text_content = COALESCE($3, text_content),
                badge_label = COALESCE(NULLIF($4, ''), badge_label),
                speed = COALESCE(NULLIF($5, ''), speed),
                font_size = CASE WHEN $6 > 0 THEN $6 ELSE font_size END,
                background_color = COALESCE(NULLIF($7, ''), background_color),
                text_color = COALESCE(NULLIF($8, ''), text_color),
                badge_bg_color = COALESCE(NULLIF($9, ''), badge_bg_color),
                badge_text_color = COALESCE(NULLIF($10, ''), badge_text_color),
                updated_at = NOW()
            WHERE id = $1 AND ($11::uuid IS NULL OR corporation_id = $11)
            RETURNING id, name, text_content, badge_label, speed, font_size,
                      background_color, text_color, badge_bg_color, badge_text_color,
                      created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(text_content)
        .bind(&req.badge)
        .bind(&req.speed)
        .bind(req.font_size)
        .bind(&req.background_color)
        .bind(&req.text_color)
        .bind(&req.badge_background_color)
        .bind(&req.badge_text_color)
        .bind(corp_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Ticker not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn delete_ticker(
        &self,
        request: Request<DeleteTickerRequest>,
    ) -> Result<Response<DeleteTickerResponse>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_tickers")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let result = sqlx::query("DELETE FROM components_tickers WHERE id = $1 AND ($2::uuid IS NULL OR corporation_id = $2)")
            .bind(id)
            .bind(corp_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("Ticker not found or permission denied"));
        }

        Ok(Response::new(DeleteTickerResponse { success: true }))
    }
}

