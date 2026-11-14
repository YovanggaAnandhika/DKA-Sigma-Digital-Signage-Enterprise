use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::common::v1::resolution::{
    resolution_service_server::ResolutionService as ResolutionServiceTrait,
    ListResolutionsRequest, ListResolutionsResponse, GetResolutionRequest,
    CreateResolutionRequest, UpdateResolutionRequest, DeleteResolutionRequest, DeleteResolutionResponse, Resolution,
};

#[derive(FromRow)]
struct ResolutionRow {
    id: Uuid,
    name: String,
    width: i32,
    height: i32,
    aspect_ratio: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl ResolutionRow {
    fn into_proto(self) -> Resolution {
        Resolution {
            id: self.id.to_string(),
            name: self.name,
            width: self.width,
            height: self.height,
            aspect_ratio: self.aspect_ratio,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        }
    }
}

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
        let rows = sqlx::query_as::<_, ResolutionRow>(
            "SELECT id, name, width, height, aspect_ratio, created_at, updated_at FROM common_resolutions ORDER BY width ASC, height ASC"
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(ResolutionRow::into_proto).collect();

        Ok(Response::new(ListResolutionsResponse { items }))
    }

    async fn get_resolution(
        &self,
        request: Request<GetResolutionRequest>,
    ) -> Result<Response<Resolution>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query_as::<_, ResolutionRow>(
            "SELECT id, name, width, height, aspect_ratio, created_at, updated_at FROM common_resolutions WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Resolution not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn create_resolution(
        &self,
        request: Request<CreateResolutionRequest>,
    ) -> Result<Response<Resolution>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let id = Uuid::new_v4();
        let aspect_ratio = if req.aspect_ratio.is_empty() { "16:9".to_string() } else { req.aspect_ratio };

        let row = sqlx::query_as::<_, ResolutionRow>(
            r#"
            INSERT INTO common_resolutions (id, name, width, height, aspect_ratio)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, name, width, height, aspect_ratio, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(req.width)
        .bind(req.height)
        .bind(&aspect_ratio)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.is_unique_violation() {
                    return Status::already_exists(format!("Resolusi dengan dimensi {}x{} sudah terdaftar di sistem", req.width, req.height));
                }
            }
            Status::internal(e.to_string())
        })?;

        Ok(Response::new(row.into_proto()))
    }

    async fn update_resolution(
        &self,
        request: Request<UpdateResolutionRequest>,
    ) -> Result<Response<Resolution>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let aspect_ratio = if req.aspect_ratio.is_empty() { "16:9".to_string() } else { req.aspect_ratio };

        let row = sqlx::query_as::<_, ResolutionRow>(
            r#"
            UPDATE common_resolutions
            SET name = $1, width = $2, height = $3, aspect_ratio = $4, updated_at = NOW()
            WHERE id = $5
            RETURNING id, name, width, height, aspect_ratio, created_at, updated_at
            "#
        )
        .bind(&req.name)
        .bind(req.width)
        .bind(req.height)
        .bind(&aspect_ratio)
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| {
            if let sqlx::Error::Database(db_err) = &e {
                if db_err.is_unique_violation() {
                    return Status::already_exists(format!("Resolusi dengan dimensi {}x{} sudah terdaftar di sistem", req.width, req.height));
                }
            }
            Status::internal(e.to_string())
        })?
        .ok_or_else(|| Status::not_found("Resolution not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn delete_resolution(
        &self,
        request: Request<DeleteResolutionRequest>,
    ) -> Result<Response<DeleteResolutionResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM common_resolutions WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteResolutionResponse { success: true }))
    }
}

