use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::PgPool;
use std::str::FromStr;

use crate::grpc::proto::studio::v1::clock::{
    clock_service_server::ClockService as ClockServiceTrait,
    CreateClockRequest, GetClockRequest, ListClocksRequest, ListClocksResponse,
    UpdateClockRequest, DeleteClockRequest, DeleteClockResponse, Clock,
};
use crate::grpc::proto::common::v1::PaginationResponse;

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

        let row = sqlx::query!(
            r#"
            INSERT INTO clocks (id, name, city, show_seconds, is_24_hour, theme)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, name, city, show_seconds, is_24_hour, theme, created_at, updated_at
            "#,
            id,
            req.name,
            if req.city.is_empty() { "Makassar" } else { &req.city },
            req.show_seconds,
            req.is_24_hour,
            if req.theme.is_empty() { "glass" } else { &req.theme },
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Clock {
            id: row.id.to_string(),
            name: row.name,
            city: row.city,
            show_seconds: row.show_seconds,
            is_24_hour: row.is_24_hour,
            theme: row.theme,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn get_clock(
        &self,
        request: Request<GetClockRequest>,
    ) -> Result<Response<Clock>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query!(
            "SELECT id, name, city, show_seconds, is_24_hour, theme, created_at, updated_at FROM clocks WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Clock not found"))?;

        Ok(Response::new(Clock {
            id: row.id.to_string(),
            name: row.name,
            city: row.city,
            show_seconds: row.show_seconds,
            is_24_hour: row.is_24_hour,
            theme: row.theme,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn list_clocks(
        &self,
        request: Request<ListClocksRequest>,
    ) -> Result<Response<ListClocksResponse>, Status> {
        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query!(
            r#"
            SELECT id, name, city, show_seconds, is_24_hour, theme, created_at, updated_at
            FROM clocks
            WHERE name ILIKE $1 OR city ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#,
            search
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|r| Clock {
            id: r.id.to_string(),
            name: r.name,
            city: r.city,
            show_seconds: r.show_seconds,
            is_24_hour: r.is_24_hour,
            theme: r.theme,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }).collect();

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

        let row = sqlx::query!(
            r#"
            UPDATE clocks
            SET name = COALESCE(NULLIF($2, ''), name),
                city = COALESCE(NULLIF($3, ''), city),
                show_seconds = $4,
                is_24_hour = $5,
                theme = COALESCE(NULLIF($6, ''), theme),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, city, show_seconds, is_24_hour, theme, created_at, updated_at
            "#,
            id,
            req.name,
            req.city,
            req.show_seconds,
            req.is_24_hour,
            req.theme,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Clock {
            id: row.id.to_string(),
            name: row.name,
            city: row.city,
            show_seconds: row.show_seconds,
            is_24_hour: row.is_24_hour,
            theme: row.theme,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_clock(
        &self,
        request: Request<DeleteClockRequest>,
    ) -> Result<Response<DeleteClockResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM clocks WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteClockResponse { success: true }))
    }
}
