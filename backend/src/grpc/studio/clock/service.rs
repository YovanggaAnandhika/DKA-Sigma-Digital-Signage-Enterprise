use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::studio::v1::clock::{
    clock_service_server::ClockService as ClockServiceTrait,
    CreateClockRequest, GetClockRequest, ListClocksRequest, ListClocksResponse,
    UpdateClockRequest, DeleteClockRequest, DeleteClockResponse, Clock,
};
use crate::grpc::proto::common::v1::PaginationResponse;

#[derive(FromRow)]
struct ClockRow {
    id: Uuid,
    name: String,
    city: String,
    show_seconds: bool,
    is_24_hour: bool,
    theme: String,
    background_color: String,
    text_color: String,
    subtitle_color: String,
    border_color: String,
    border_radius: i32,
    time_font_size: i32,
    date_font_size: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl From<ClockRow> for Clock {
    fn from(r: ClockRow) -> Self {
        Clock {
            id: r.id.to_string(),
            name: r.name,
            city: r.city,
            show_seconds: r.show_seconds,
            is_24_hour: r.is_24_hour,
            theme: r.theme,
            background_color: r.background_color,
            text_color: r.text_color,
            subtitle_color: r.subtitle_color,
            border_color: r.border_color,
            border_radius: r.border_radius,
            time_font_size: r.time_font_size,
            date_font_size: r.date_font_size,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }
    }
}

pub struct ClockServiceImpl {
    pub pool: PgPool,
}

impl ClockServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl ClockServiceTrait for ClockServiceImpl {
    async fn create_clock(
        &self,
        request: Request<CreateClockRequest>,
    ) -> Result<Response<Clock>, Status> {
        let req = request.into_inner();
        let id = Uuid::new_v4();
        let city = if req.city.is_empty() { "Makassar".to_string() } else { req.city };
        let theme = if req.theme.is_empty() { "glass".to_string() } else { req.theme };

        let row = sqlx::query_as::<_, ClockRow>(
            r#"
            INSERT INTO clocks (
                id, name, city, show_seconds, is_24_hour, theme,
                background_color, text_color, subtitle_color, border_color, border_radius, time_font_size, date_font_size
            )
            VALUES (
                $1, $2, $3, $4, $5, $6,
                COALESCE(NULLIF($7, ''), '#0f172a'),
                COALESCE(NULLIF($8, ''), '#ffffff'),
                COALESCE(NULLIF($9, ''), '#94a3b8'),
                COALESCE(NULLIF($10, ''), '#1e3a8a'),
                CASE WHEN $11 > 0 THEN $11 ELSE 12 END,
                CASE WHEN $12 > 0 THEN $12 ELSE 52 END,
                CASE WHEN $13 > 0 THEN $13 ELSE 14 END
            )
            RETURNING id, name, city, show_seconds, is_24_hour, theme,
                      background_color, text_color, subtitle_color, border_color, border_radius, time_font_size, date_font_size,
                      created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(&city)
        .bind(req.show_seconds)
        .bind(req.is_24_hour)
        .bind(&theme)
        .bind(&req.background_color)
        .bind(&req.text_color)
        .bind(&req.subtitle_color)
        .bind(&req.border_color)
        .bind(req.border_radius)
        .bind(req.time_font_size)
        .bind(req.date_font_size)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Clock::from(row)))
    }

    async fn get_clock(
        &self,
        request: Request<GetClockRequest>,
    ) -> Result<Response<Clock>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query_as::<_, ClockRow>(
            "SELECT id, name, city, show_seconds, is_24_hour, theme, background_color, text_color, subtitle_color, border_color, border_radius, time_font_size, date_font_size, created_at, updated_at FROM clocks WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Clock not found"))?;

        Ok(Response::new(Clock::from(row)))
    }

    async fn list_clocks(
        &self,
        request: Request<ListClocksRequest>,
    ) -> Result<Response<ListClocksResponse>, Status> {
        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query_as::<_, ClockRow>(
            r#"
            SELECT id, name, city, show_seconds, is_24_hour, theme,
                   background_color, text_color, subtitle_color, border_color, border_radius, time_font_size, date_font_size,
                   created_at, updated_at
            FROM clocks
            WHERE name ILIKE $1 OR city ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#
        )
        .bind(&search)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(Clock::from).collect();

        Ok(Response::new(ListClocksResponse {
            items,
            pagination: Some(PaginationResponse {
                current_page: 1,
                limit: 50,
                total_items: 0,
                total_pages: 1,
            }),
        }))
    }

    async fn update_clock(
        &self,
        request: Request<UpdateClockRequest>,
    ) -> Result<Response<Clock>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid id"))?;

        let row = sqlx::query_as::<_, ClockRow>(
            r#"
            UPDATE clocks
            SET name = COALESCE(NULLIF($2, ''), name),
                city = COALESCE(NULLIF($3, ''), city),
                show_seconds = $4,
                is_24_hour = $5,
                theme = COALESCE(NULLIF($6, ''), theme),
                background_color = COALESCE(NULLIF($7, ''), background_color),
                text_color = COALESCE(NULLIF($8, ''), text_color),
                subtitle_color = COALESCE(NULLIF($9, ''), subtitle_color),
                border_color = COALESCE(NULLIF($10, ''), border_color),
                border_radius = CASE WHEN $11 > 0 THEN $11 ELSE border_radius END,
                time_font_size = CASE WHEN $12 > 0 THEN $12 ELSE time_font_size END,
                date_font_size = CASE WHEN $13 > 0 THEN $13 ELSE date_font_size END,
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, city, show_seconds, is_24_hour, theme,
                      background_color, text_color, subtitle_color, border_color, border_radius, time_font_size, date_font_size,
                      created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.city)
        .bind(req.show_seconds)
        .bind(req.is_24_hour)
        .bind(&req.theme)
        .bind(&req.background_color)
        .bind(&req.text_color)
        .bind(&req.subtitle_color)
        .bind(&req.border_color)
        .bind(req.border_radius)
        .bind(req.time_font_size)
        .bind(req.date_font_size)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Clock::from(row)))
    }

    async fn delete_clock(
        &self,
        request: Request<DeleteClockRequest>,
    ) -> Result<Response<DeleteClockResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM clocks WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteClockResponse { success: true }))
    }
}

