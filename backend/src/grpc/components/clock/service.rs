use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::components::v1::clock::{
    clock_service_server::ClockService as ClockServiceTrait,
    CreateClockRequest, GetClockRequest, ListClocksRequest, ListClocksResponse,
    UpdateClockRequest, DeleteClockRequest, DeleteClockResponse, Clock,
};
use crate::grpc::proto::common::v1::PaginationResponse;

#[derive(FromRow)]
struct ClockRow {
    id: Uuid,
    name: String,
    timezone: String,
    clock_format: String,
    show_seconds: bool,
    #[allow(dead_code)]
    show_date: bool,
    font_size: i32,
    text_color: String,
    background_color: String,
    weather_city: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl ClockRow {
    fn into_proto(self) -> Clock {
        let city = self.weather_city.unwrap_or(self.timezone);
        let is_24_hour = self.clock_format.contains("24");
        Clock {
            id: self.id.to_string(),
            name: self.name,
            city,
            show_seconds: self.show_seconds,
            is_24_hour,
            theme: "glass".to_string(),
            background_color: self.background_color,
            text_color: self.text_color,
            subtitle_color: "#94a3b8".to_string(),
            border_color: "#1e3a8a".to_string(),
            border_radius: 12,
            time_font_size: self.font_size,
            date_font_size: 14,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
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
        let clock_format = if req.is_24_hour { "24h".to_string() } else { "12h".to_string() };
        let font_size = if req.time_font_size > 0 { req.time_font_size } else { 48 };

        let row = sqlx::query_as::<_, ClockRow>(
            r#"
            INSERT INTO components_clocks (
                id, corporation_id, name, timezone, clock_format, show_seconds, show_date, font_size,
                background_color, text_color, weather_city
            )
            VALUES (
                $1,
                COALESCE((SELECT id FROM system_corporations LIMIT 1), '00000000-0000-0000-0000-000000000000'::uuid),
                $2, 'Asia/Jakarta', $3, $4, true, $5,
                COALESCE(NULLIF($6, ''), 'transparent'),
                COALESCE(NULLIF($7, ''), '#ffffff'),
                $8
            )
            RETURNING id, name, timezone, clock_format, show_seconds, show_date, font_size,
                      background_color, text_color, weather_city,
                      created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(&clock_format)
        .bind(req.show_seconds)
        .bind(font_size)
        .bind(&req.background_color)
        .bind(&req.text_color)
        .bind(&city)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn get_clock(
        &self,
        request: Request<GetClockRequest>,
    ) -> Result<Response<Clock>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query_as::<_, ClockRow>(
            "SELECT id, name, timezone, clock_format, show_seconds, show_date, font_size, background_color, text_color, weather_city, created_at, updated_at FROM components_clocks WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Clock not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn list_clocks(
        &self,
        request: Request<ListClocksRequest>,
    ) -> Result<Response<ListClocksResponse>, Status> {
        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query_as::<_, ClockRow>(
            r#"
            SELECT id, name, timezone, clock_format, show_seconds, show_date, font_size,
                   background_color, text_color, weather_city,
                   created_at, updated_at
            FROM components_clocks
            WHERE name ILIKE $1 OR weather_city ILIKE $1 OR timezone ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#
        )
        .bind(&search)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(ClockRow::into_proto).collect();

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
        let clock_format = if req.is_24_hour { Some("24h".to_string()) } else { None };
        let font_size = if req.time_font_size > 0 { req.time_font_size } else { 0 };

        let row = sqlx::query_as::<_, ClockRow>(
            r#"
            UPDATE components_clocks
            SET name = COALESCE(NULLIF($2, ''), name),
                weather_city = COALESCE(NULLIF($3, ''), weather_city),
                show_seconds = $4,
                clock_format = COALESCE($5, clock_format),
                font_size = CASE WHEN $6 > 0 THEN $6 ELSE font_size END,
                background_color = COALESCE(NULLIF($7, ''), background_color),
                text_color = COALESCE(NULLIF($8, ''), text_color),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, timezone, clock_format, show_seconds, show_date, font_size,
                      background_color, text_color, weather_city,
                      created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.city)
        .bind(req.show_seconds)
        .bind(clock_format)
        .bind(font_size)
        .bind(&req.background_color)
        .bind(&req.text_color)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn delete_clock(
        &self,
        request: Request<DeleteClockRequest>,
    ) -> Result<Response<DeleteClockResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM components_clocks WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteClockResponse { success: true }))
    }
}

