use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::PgPool;
use std::str::FromStr;

use crate::grpc::proto::studio::v1::webview::{
    webview_service_server::WebviewService as WebviewServiceTrait,
    CreateWebviewRequest, GetWebviewRequest, ListWebviewsRequest, ListWebviewsResponse,
    UpdateWebviewRequest, DeleteWebviewRequest, DeleteWebviewResponse, Webview,
};
use crate::grpc::proto::common::v1::PaginationResponse;

pub struct WebviewServiceImpl {
    pub pool: PgPool,
}

impl WebviewServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl WebviewServiceTrait for WebviewServiceImpl {
    async fn create_webview(
        &self,
        request: Request<CreateWebviewRequest>,
    ) -> Result<Response<Webview>, Status> {
        let req = request.into_inner();
        let id = Uuid::new_v4();

        let row = sqlx::query!(
            r#"
            INSERT INTO webviews (id, name, url, refresh_interval_seconds, zoom_scale, bypass_cache, orientation)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, name, url, refresh_interval_seconds, zoom_scale, bypass_cache, orientation, created_at, updated_at
            "#,
            id,
            req.name,
            req.url,
            if req.refresh_interval_seconds > 0 { req.refresh_interval_seconds } else { 60 },
            if req.zoom_scale > 0 { req.zoom_scale } else { 100 },
            req.bypass_cache,
            if req.orientation.is_empty() { "landscape" } else { &req.orientation },
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Webview {
            id: row.id.to_string(),
            name: row.name,
            url: row.url,
            refresh_interval_seconds: row.refresh_interval_seconds,
            zoom_scale: row.zoom_scale,
            bypass_cache: row.bypass_cache,
            orientation: row.orientation,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn get_webview(
        &self,
        request: Request<GetWebviewRequest>,
    ) -> Result<Response<Webview>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        let row = sqlx::query!(
            "SELECT id, name, url, refresh_interval_seconds, zoom_scale, bypass_cache, orientation, created_at, updated_at FROM webviews WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Webview not found"))?;

        Ok(Response::new(Webview {
            id: row.id.to_string(),
            name: row.name,
            url: row.url,
            refresh_interval_seconds: row.refresh_interval_seconds,
            zoom_scale: row.zoom_scale,
            bypass_cache: row.bypass_cache,
            orientation: row.orientation,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn list_webviews(
        &self,
        request: Request<ListWebviewsRequest>,
    ) -> Result<Response<ListWebviewsResponse>, Status> {
        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query!(
            r#"
            SELECT id, name, url, refresh_interval_seconds, zoom_scale, bypass_cache, orientation, created_at, updated_at
            FROM webviews
            WHERE name ILIKE $1 OR url ILIKE $1
            ORDER BY created_at DESC
            LIMIT 50
            "#,
            search
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let items = rows.into_iter().map(|r| Webview {
            id: r.id.to_string(),
            name: r.name,
            url: r.url,
            refresh_interval_seconds: r.refresh_interval_seconds,
            zoom_scale: r.zoom_scale,
            bypass_cache: r.bypass_cache,
            orientation: r.orientation,
            created_at: r.created_at.to_rfc3339(),
            updated_at: r.updated_at.to_rfc3339(),
        }).collect();

        Ok(Response::new(ListWebviewsResponse {
            items,
            pagination: Some(PaginationResponse {
                current_page: 1,
                limit: 50,
                total_items: 0,
                total_pages: 1,
            }),
        }))
    }

    async fn update_webview(
        &self,
        request: Request<UpdateWebviewRequest>,
    ) -> Result<Response<Webview>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid id"))?;

        let row = sqlx::query!(
            r#"
            UPDATE webviews
            SET name = COALESCE(NULLIF($2, ''), name),
                url = COALESCE(NULLIF($3, ''), url),
                refresh_interval_seconds = CASE WHEN $4 > 0 THEN $4 ELSE refresh_interval_seconds END,
                zoom_scale = CASE WHEN $5 > 0 THEN $5 ELSE zoom_scale END,
                bypass_cache = $6,
                orientation = COALESCE(NULLIF($7, ''), orientation),
                updated_at = NOW()
            WHERE id = $1
            RETURNING id, name, url, refresh_interval_seconds, zoom_scale, bypass_cache, orientation, created_at, updated_at
            "#,
            id,
            req.name,
            req.url,
            req.refresh_interval_seconds,
            req.zoom_scale,
            req.bypass_cache,
            req.orientation,
        )
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Webview {
            id: row.id.to_string(),
            name: row.name,
            url: row.url,
            refresh_interval_seconds: row.refresh_interval_seconds,
            zoom_scale: row.zoom_scale,
            bypass_cache: row.bypass_cache,
            orientation: row.orientation,
            created_at: row.created_at.to_rfc3339(),
            updated_at: row.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_webview(
        &self,
        request: Request<DeleteWebviewRequest>,
    ) -> Result<Response<DeleteWebviewResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM webviews WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteWebviewResponse { success: true }))
    }
}
