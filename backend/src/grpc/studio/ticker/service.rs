use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::PgPool;
use std::str::FromStr;

use crate::grpc::proto::studio::v1::ticker::{
    ticker_service_server::TickerService as TickerServiceTrait,
    CreateTickerRequest, GetTickerRequest, ListTickersRequest, ListTickersResponse,
    UpdateTickerRequest, DeleteTickerRequest, DeleteTickerResponse, Ticker,
};
use crate::grpc::proto::common::v1::PaginationResponse;

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
        let req = request.into_inner();
        let id = Uuid::new_v4();

        let row = sqlx::query!(
            r#"
            INSERT INTO tickers (
                id, name, badge, messages, speed, theme, font_size,
                background_color, text_color, badge_background_color, badge_text_color, border_color, border_radius
            )
            VALUES (
                $1, $2, $3, $4, $5, $6, $7,
                COALESCE(NULLIF($8, ''), '#1e3a8a'),
                COALESCE(NULLIF($9, ''), '#ffffff'),
                COALESCE(NULLIF($10, ''), '#2563eb'),
                COALESCE(NULLIF($11, ''), '#ffffff'),
                COALESCE(NULLIF($12, ''), '#60a5fa'),
                CASE WHEN $13 > 0 THEN $13 ELSE 8 END
            )
            RETURNING id, name, badge, messages, speed, theme, font_size,
                      background_color, text_color, badge_background_color, badge_text_color, border_color, border_radius,
                      created_at, updated_at
            "#,
            id,
            req.name,
            req.badge,
            &req.messages[..],
            req.speed,
            req.theme,
            req.font_size,
            req.background_color,
            req.text_color,
            req.badge_background_color,
            req.badge_text_color,
            req.border_color,
            req.border_radius,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Ticker {
            id: row.id.to_string(),
            name: row.name,
            badge: row.badge,
            messages: row.messages,
            speed: row.speed,
            theme: row.theme,
            font_size: row.font_size,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            background_color: row.background_color,
            text_color: row.text_color,
            badge_background_color: row.badge_background_color,
            badge_text_color: row.badge_text_color,
            border_color: row.border_color,
            border_radius: row.border_radius,
        }))
    }

    async fn get_ticker(
        &self,
        request: Request<GetTickerRequest>,
    ) -> Result<Response<Ticker>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query!(
            "SELECT id, name, badge, messages, speed, theme, font_size, background_color, text_color, badge_background_color, badge_text_color, border_color, border_radius, created_at, updated_at FROM tickers WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Ticker not found"))?;

        Ok(Response::new(Ticker {
            id: row.id.to_string(),
            name: row.name,
            badge: row.badge,
            messages: row.messages,
            speed: row.speed,
            theme: row.theme,
            font_size: row.font_size,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            background_color: row.background_color,
            text_color: row.text_color,
            badge_background_color: row.badge_background_color,
            badge_text_color: row.badge_text_color,
            border_color: row.border_color,
            border_radius: row.border_radius,
        }))
    }

    async fn list_tickers(
        &self,
        request: Request<ListTickersRequest>,
    ) -> Result<Response<ListTickersResponse>, Status> {
        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query!(
            r#"
            SELECT id, name, badge, messages, speed, theme, font_size,
                   background_color, text_color, badge_background_color, badge_text_color, border_color, border_radius,
                   created_at, updated_at
            FROM tickers
            WHERE name ILIKE $1 OR badge ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#,
            search
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|r| Ticker {
            id: r.id.to_string(),
            name: r.name,
            badge: r.badge,
            messages: r.messages,
            speed: r.speed,
            theme: r.theme,
            font_size: r.font_size,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
            background_color: r.background_color,
            text_color: r.text_color,
            badge_background_color: r.badge_background_color,
            badge_text_color: r.badge_text_color,
            border_color: r.border_color,
            border_radius: r.border_radius,
        }).collect();

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
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid id"))?;

        let row = sqlx::query!(
            r#"
            UPDATE tickers
            SET name = COALESCE(NULLIF($2, ''), name),
                badge = COALESCE(NULLIF($3, ''), badge),
                messages = $4,
                speed = COALESCE(NULLIF($5, ''), speed),
                theme = COALESCE(NULLIF($6, ''), theme),
                font_size = CASE WHEN $7 > 0 THEN $7 ELSE font_size END,
                background_color = COALESCE(NULLIF($8, ''), background_color),
                text_color = COALESCE(NULLIF($9, ''), text_color),
                badge_background_color = COALESCE(NULLIF($10, ''), badge_background_color),
                badge_text_color = COALESCE(NULLIF($11, ''), badge_text_color),
                border_color = COALESCE(NULLIF($12, ''), border_color),
                border_radius = CASE WHEN $13 > 0 THEN $13 ELSE border_radius END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, badge, messages, speed, theme, font_size,
                      background_color, text_color, badge_background_color, badge_text_color, border_color, border_radius,
                      created_at, updated_at
            "#,
            id,
            req.name,
            req.badge,
            &req.messages[..],
            req.speed,
            req.theme,
            req.font_size,
            req.background_color,
            req.text_color,
            req.badge_background_color,
            req.badge_text_color,
            req.border_color,
            req.border_radius,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Ticker {
            id: row.id.to_string(),
            name: row.name,
            badge: row.badge,
            messages: row.messages,
            speed: row.speed,
            theme: row.theme,
            font_size: row.font_size,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
            background_color: row.background_color,
            text_color: row.text_color,
            badge_background_color: row.badge_background_color,
            badge_text_color: row.badge_text_color,
            border_color: row.border_color,
            border_radius: row.border_radius,
        }))
    }

    async fn delete_ticker(
        &self,
        request: Request<DeleteTickerRequest>,
    ) -> Result<Response<DeleteTickerResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM tickers WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteTickerResponse { success: true }))
    }
}
