use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::components::v1::live_stream::{
    live_stream_service_server::LiveStreamService as LiveStreamServiceTrait,
    CreateLiveStreamRequest, GetLiveStreamRequest, ListLiveStreamsRequest, ListLiveStreamsResponse,
    UpdateLiveStreamRequest, DeleteLiveStreamRequest, DeleteLiveStreamResponse,
    ToggleRelayHostRequest, LiveStream,
};
use crate::grpc::proto::common::v1::PaginationResponse;

#[derive(FromRow)]
struct LiveStreamRow {
    id: Uuid,
    corporation_id: Option<Uuid>,
    name: String,
    description: String,
    stream_mode: String,
    source_type: String,
    source_url: String,
    server_hls_endpoint: String,
    is_relay_active: bool,
    auto_reconnect: bool,
    low_latency_mode: bool,
    is_muted: bool,
    poster_image_url: String,
    requires_auth: bool,
    ingest_username: String,
    ingest_password: String,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl LiveStreamRow {
    fn into_proto(self) -> LiveStream {
        LiveStream {
            id: self.id.to_string(),
            corporation_id: self.corporation_id.map(|id| id.to_string()).unwrap_or_default(),
            name: self.name,
            description: self.description,
            stream_mode: self.stream_mode,
            source_type: self.source_type,
            source_url: self.source_url,
            server_hls_endpoint: self.server_hls_endpoint,
            is_relay_active: self.is_relay_active,
            auto_reconnect: self.auto_reconnect,
            low_latency_mode: self.low_latency_mode,
            is_muted: self.is_muted,
            poster_image_url: self.poster_image_url,
            requires_auth: self.requires_auth,
            ingest_username: self.ingest_username,
            ingest_password: self.ingest_password,
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        }
    }
}

use crate::workers::live_stream_relay::LiveStreamRelayManager;

pub struct LiveStreamServiceImpl {
    pub pool: PgPool,
    pub relay_manager: LiveStreamRelayManager,
}

impl LiveStreamServiceImpl {
    pub fn new(pool: PgPool, relay_manager: LiveStreamRelayManager) -> Self {
        Self { pool, relay_manager }
    }
}

#[tonic::async_trait]
impl LiveStreamServiceTrait for LiveStreamServiceImpl {
    async fn create_live_stream(
        &self,
        request: Request<CreateLiveStreamRequest>,
    ) -> Result<Response<LiveStream>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_live_streams")?;
        let corp_id = claims.active_corporation_id()
            .and_then(|c| Uuid::parse_str(c).ok())
            .unwrap_or_else(|| Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap());
        let branch_id = claims.branch_id.as_deref().and_then(|b| Uuid::parse_str(b).ok());
        let user_id = Uuid::parse_str(&claims.sub).ok();

        let req = request.into_inner();
        if req.name.trim().is_empty() {
            return Err(Status::invalid_argument("Nama stream wajib diisi"));
        }

        let id = Uuid::new_v4();
        let stream_mode = if req.stream_mode.is_empty() {
            "EXTERNAL_EMBED".to_string()
        } else {
            req.stream_mode
        };
        let source_type = if req.source_type.is_empty() {
            "HLS".to_string()
        } else {
            req.source_type
        };

        // Ensure source_url uses the generated id for WHIP and RTMP to prevent client-generated UUID mismatch
        let source_url = match source_type.to_uppercase().as_str() {
            "WHIP" => format!("/streams/{}/whip", id),
            "RTMP" => format!("/live/{}", id),
            _ => {
                if req.source_url.trim().is_empty() {
                    return Err(Status::invalid_argument("URL sumber stream wajib diisi"));
                }
                req.source_url
            }
        };

        let server_hls_endpoint = if stream_mode == "SERVER_HOSTED_HLS" {
            format!("/streams/{}/live.m3u8", id)
        } else {
            String::new()
        };
        let is_relay_active = stream_mode == "SERVER_HOSTED_HLS";

        let row = sqlx::query_as::<_, LiveStreamRow>(
            r#"
            INSERT INTO components_live_streams (
                id, corporation_id, branch_id, created_by_user_id,
                name, description, stream_mode, source_type, source_url,
                server_hls_endpoint, is_relay_active, auto_reconnect, low_latency_mode,
                is_muted, poster_image_url, requires_auth, ingest_username, ingest_password
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
            RETURNING id, corporation_id, name, description, stream_mode, source_type,
                      source_url, server_hls_endpoint, is_relay_active, auto_reconnect,
                      low_latency_mode, is_muted, poster_image_url, requires_auth,
                      ingest_username, ingest_password, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(corp_id)
        .bind(branch_id)
        .bind(user_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&stream_mode)
        .bind(&source_type)
        .bind(&source_url)
        .bind(&server_hls_endpoint)
        .bind(is_relay_active)
        .bind(req.auto_reconnect)
        .bind(req.low_latency_mode)
        .bind(req.is_muted)
        .bind(&req.poster_image_url)
        .bind(req.requires_auth)
        .bind(&req.ingest_username)
        .bind(&req.ingest_password)
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        if is_relay_active {
            self.relay_manager
                .start_relay(
                    id,
                    &source_type,
                    &source_url,
                    req.low_latency_mode,
                    req.requires_auth,
                    &req.ingest_username,
                    &req.ingest_password,
                )
                .await;
        }

        Ok(Response::new(row.into_proto()))
    }

    async fn get_live_stream(
        &self,
        request: Request<GetLiveStreamRequest>,
    ) -> Result<Response<LiveStream>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_view_live_streams")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid live stream id"))?;

        let row = sqlx::query_as::<_, LiveStreamRow>(
            r#"
            SELECT id, corporation_id, name, description, stream_mode, source_type,
                   source_url, server_hls_endpoint, is_relay_active, auto_reconnect,
                   low_latency_mode, is_muted, poster_image_url, requires_auth,
                   ingest_username, ingest_password, created_at, updated_at
            FROM components_live_streams
            WHERE id = $1 AND ($2::uuid IS NULL OR corporation_id IS NULL OR corporation_id = $2)
            "#
        )
        .bind(id)
        .bind(corp_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Live stream not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn list_live_streams(
        &self,
        request: Request<ListLiveStreamsRequest>,
    ) -> Result<Response<ListLiveStreamsResponse>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_view_live_streams")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query_as::<_, LiveStreamRow>(
            r#"
            SELECT id, corporation_id, name, description, stream_mode, source_type,
                   source_url, server_hls_endpoint, is_relay_active, auto_reconnect,
                   low_latency_mode, is_muted, poster_image_url, requires_auth,
                   ingest_username, ingest_password, created_at, updated_at
            FROM components_live_streams
            WHERE ($1::uuid IS NULL OR corporation_id IS NULL OR corporation_id = $1)
              AND (name ILIKE $2 OR source_url ILIKE $2 OR description ILIKE $2)
            ORDER BY created_at DESC
            LIMIT 100
            "#
        )
        .bind(corp_id)
        .bind(&search)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let total = rows.len() as i64;
        let items = rows.into_iter().map(LiveStreamRow::into_proto).collect();

        Ok(Response::new(ListLiveStreamsResponse {
            items,
            pagination: Some(PaginationResponse {
                current_page: 1,
                limit: 100,
                total_items: total,
                total_pages: 1,
            }),
        }))
    }

    async fn update_live_stream(
        &self,
        request: Request<UpdateLiveStreamRequest>,
    ) -> Result<Response<LiveStream>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_live_streams")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid live stream id"))?;

        let server_hls_endpoint = if req.stream_mode == "SERVER_HOSTED_HLS" {
            format!("/streams/{}/live.m3u8", id)
        } else {
            String::new()
        };

        let row = sqlx::query_as::<_, LiveStreamRow>(
            r#"
            UPDATE components_live_streams
            SET name = COALESCE(NULLIF($2, ''), name),
                description = $3,
                stream_mode = COALESCE(NULLIF($4, ''), stream_mode),
                source_type = COALESCE(NULLIF($5, ''), source_type),
                source_url = COALESCE(NULLIF($6, ''), source_url),
                server_hls_endpoint = $7,
                is_relay_active = $8,
                auto_reconnect = $9,
                low_latency_mode = $10,
                is_muted = $11,
                poster_image_url = $12,
                requires_auth = $13,
                ingest_username = $14,
                ingest_password = $15,
                updated_at = NOW()
            WHERE id = $1 AND ($16::uuid IS NULL OR corporation_id IS NULL OR corporation_id = $16)
            RETURNING id, corporation_id, name, description, stream_mode, source_type,
                      source_url, server_hls_endpoint, is_relay_active, auto_reconnect,
                      low_latency_mode, is_muted, poster_image_url, requires_auth,
                      ingest_username, ingest_password, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.stream_mode)
        .bind(&req.source_type)
        .bind(&req.source_url)
        .bind(&server_hls_endpoint)
        .bind(req.is_relay_active)
        .bind(req.auto_reconnect)
        .bind(req.low_latency_mode)
        .bind(req.is_muted)
        .bind(&req.poster_image_url)
        .bind(req.requires_auth)
        .bind(&req.ingest_username)
        .bind(&req.ingest_password)
        .bind(corp_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Live stream not found"))?;

        if req.stream_mode == "SERVER_HOSTED_HLS" && req.is_relay_active {
            self.relay_manager.kick_streamer_publishers(&id).await;
            self.relay_manager
                .start_relay(
                    id,
                    &req.source_type,
                    &req.source_url,
                    req.low_latency_mode,
                    req.requires_auth,
                    &req.ingest_username,
                    &req.ingest_password,
                )
                .await;
        } else {
            self.relay_manager.stop_relay(&id).await;
        }

        Ok(Response::new(row.into_proto()))
    }

    async fn delete_live_stream(
        &self,
        request: Request<DeleteLiveStreamRequest>,
    ) -> Result<Response<DeleteLiveStreamResponse>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_live_streams")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid live stream id"))?;

        self.relay_manager.stop_relay(&id).await;

        let result = sqlx::query("DELETE FROM components_live_streams WHERE id = $1 AND ($2::uuid IS NULL OR corporation_id IS NULL OR corporation_id = $2)")
            .bind(id)
            .bind(corp_id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("Live stream not found or permission denied"));
        }

        Ok(Response::new(DeleteLiveStreamResponse { success: true }))
    }

    async fn toggle_relay_host(
        &self,
        request: Request<ToggleRelayHostRequest>,
    ) -> Result<Response<LiveStream>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_live_streams")?;
        let corp_id = claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok());

        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid live stream id"))?;

        let endpoint = format!("/streams/{}/live.m3u8", id);

        let row = sqlx::query_as::<_, LiveStreamRow>(
            r#"
            UPDATE components_live_streams
            SET is_relay_active = $2,
                server_hls_endpoint = CASE WHEN stream_mode = 'SERVER_HOSTED_HLS' THEN $3 ELSE server_hls_endpoint END,
                updated_at = NOW()
            WHERE id = $1 AND ($4::uuid IS NULL OR corporation_id IS NULL OR corporation_id = $4)
            RETURNING id, corporation_id, name, description, stream_mode, source_type,
                      source_url, server_hls_endpoint, is_relay_active, auto_reconnect,
                      low_latency_mode, is_muted, poster_image_url, requires_auth,
                      ingest_username, ingest_password, created_at, updated_at
            "#
        )
        .bind(id)
        .bind(req.is_relay_active)
        .bind(&endpoint)
        .bind(corp_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Live stream not found"))?;

        if req.is_relay_active && row.stream_mode == "SERVER_HOSTED_HLS" {
            self.relay_manager
                .start_relay(
                    id,
                    &row.source_type,
                    &row.source_url,
                    row.low_latency_mode,
                    row.requires_auth,
                    &row.ingest_username,
                    &row.ingest_password,
                )
                .await;
        } else {
            self.relay_manager.stop_relay(&id).await;
        }

        Ok(Response::new(row.into_proto()))
    }
}
