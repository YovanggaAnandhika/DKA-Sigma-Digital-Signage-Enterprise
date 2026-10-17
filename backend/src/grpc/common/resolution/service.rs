use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::PgPool;
use std::str::FromStr;

use crate::grpc::proto::common::v1::resolution::{
    resolution_service_server::ResolutionService as ResolutionServiceTrait,
    ListResolutionsRequest, ListResolutionsResponse, GetResolutionRequest,
    CreateResolutionRequest, DeleteResolutionRequest, DeleteResolutionResponse, Resolution,
};

pub struct ResolutionServiceImpl {
    pub pool: PgPool,
}

impl ResolutionServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl ResolutionServiceTrait for ResolutionServiceImpl {
    async fn list_resolutions(
        &self,
        _request: Request<ListResolutionsRequest>,
    ) -> Result<Response<ListResolutionsResponse>, Status> {
        let rows = sqlx::query!(
            "SELECT id, name, width, height, aspect_ratio, created_at, updated_at FROM resolutions ORDER BY width ASC, height ASC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|r| Resolution {
            id: r.id.to_string(),
            name: r.name,
            width: r.width,
            height: r.height,
            aspect_ratio: r.aspect_ratio,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(ListResolutionsResponse { items }))
    }

    async fn get_resolution(
        &self,
        request: Request<GetResolutionRequest>,
    ) -> Result<Response<Resolution>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query!(
            "SELECT id, name, width, height, aspect_ratio, created_at, updated_at FROM resolutions WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Resolution not found"))?;

        Ok(Response::new(Resolution {
            id: row.id.to_string(),
            name: row.name,
            width: row.width,
            height: row.height,
            aspect_ratio: row.aspect_ratio,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn create_resolution(
        &self,
        request: Request<CreateResolutionRequest>,
    ) -> Result<Response<Resolution>, Status> {
        let req = request.into_inner();
        let id = Uuid::new_v4();

        let row = sqlx::query!(
            r#"
            INSERT INTO resolutions (id, name, width, height, aspect_ratio)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, width, height, aspect_ratio, created_at, updated_at
            "#,
            id,
            req.name,
            req.width,
            req.height,
            if req.aspect_ratio.is_empty() { "16:9" } else { &req.aspect_ratio },
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Resolution {
            id: row.id.to_string(),
            name: row.name,
            width: row.width,
            height: row.height,
            aspect_ratio: row.aspect_ratio,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_resolution(
        &self,
        request: Request<DeleteResolutionRequest>,
    ) -> Result<Response<DeleteResolutionResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM resolutions WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteResolutionResponse { success: true }))
    }
}
