use sqlx::PgPool;
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::studio::v1::layout::{
    layout_service_server::LayoutService as LayoutServiceTrait,
    CreateLayoutRequest, DeleteLayoutRequest, DeleteLayoutResponse, GetLayoutRequest,
    Layout as ProtoLayout, ListLayoutsRequest, ListLayoutsResponse, UpdateLayoutRequest,
    LayoutHistoryItem, ListLayoutHistoryRequest, ListLayoutHistoryResponse,
    RollbackLayoutRequest, RollbackLayoutResponse,
    DeleteLayoutHistoryRequest, DeleteLayoutHistoryResponse,
};
use crate::grpc::proto::common::v1::orientation::Orientation as ProtoOrientation;
use crate::grpc::proto::studio::v1::layer::Layer as ProtoLayer;

use crate::modules::studio::layout::{
    model::{CreateLayoutDto, LayoutWithLayersDto, UpdateLayoutDto},
    services::LayoutService,
};
use crate::grpc::studio::layer::layer::service::LayerServiceImpl;

pub struct LayoutServiceImpl {
    pub pool: PgPool,
}

impl LayoutServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    pub fn map_layout_with_layers(dto: LayoutWithLayersDto) -> ProtoLayout {
        ProtoLayout {
            id: dto.layout.id.to_string(),
            name: dto.layout.name,
            description: dto.layout.description.unwrap_or_default(),
            canvas_width: dto.layout.canvas_width,
            canvas_height: dto.layout.canvas_height,
            orientation: dto.orientation.map(|o| ProtoOrientation {
                id: o.id.to_string(),
                name: o.name,
                value: o.value,
                created_at: o.created_at.to_rfc3339(),
                updated_at: o.updated_at.to_rfc3339(),
            }),
            background_color: dto.layout.background_color,
            background_image_url: dto.layout.background_image_url.unwrap_or_default(),
            created_at: dto.layout.created_at.to_rfc3339(),
            updated_at: dto.layout.updated_at.to_rfc3339(),
            layers: dto.layers.into_iter().map(LayerServiceImpl::map_layer_with_blocks).collect(),
            resolution_id: dto.layout.resolution_id.map(|id| id.to_string()),
            version_hash: None,
            scheduled_version_hash: None,
            is_schedule_synced: false,
        }
    }
}

#[tonic::async_trait]
impl LayoutServiceTrait for LayoutServiceImpl {
    async fn create_layout(
        &self,
        request: Request<CreateLayoutRequest>,
    ) -> Result<Response<ProtoLayout>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let orientation_id = if req.orientation_id.is_empty() {
            let orientation_value = if req.canvas_width >= req.canvas_height { "landscape" } else { "portrait" };
            let record = sqlx::query_as::<_, (Uuid,)>(
                "SELECT id FROM common_orientations WHERE value = $1"
            )
            .bind(orientation_value)
            .fetch_one(&self.pool)
            .await
            .map_err(|_| Status::internal("Orientation not found in database"))?;
            record.0
        } else {
            Uuid::from_str(&req.orientation_id)
                .map_err(|_| Status::invalid_argument("Invalid orientation_id"))?
        };

        let resolution_id = req.resolution_id.and_then(|id| Uuid::from_str(&id).ok());
        let dto = CreateLayoutDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            canvas_width: Some(req.canvas_width),
            canvas_height: Some(req.canvas_height),
            orientation_id,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
            background_image_url: if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
            resolution_id,
        };

        let layout = LayoutService::create_layout(&self.pool, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout.id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_layout_with_layers(full_dto)))
    }

    async fn get_layout(
        &self,
        request: Request<GetLayoutRequest>,
    ) -> Result<Response<ProtoLayout>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layout id"))?;

        let dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(|e| match e {
                crate::common::AppError::NotFound(m) => Status::not_found(m),
                _ => Status::internal(e.to_string()),
            })?;

        let mut proto_l = Self::map_layout_with_layers(dto);
        let latest_hash = sqlx::query_scalar::<_, String>(
            "SELECT version_hash FROM studio_layout_history WHERE layout_id = $1 ORDER BY created_at DESC LIMIT 1"
        )
        .bind(layout_id)
        .fetch_optional(&self.pool)
        .await
        .unwrap_or(None);

        let scheduled_hash = sqlx::query_scalar::<_, String>(
            "SELECT version_hash FROM studio_schedule_events WHERE layout_id = $1 AND version_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1"
        )
        .bind(layout_id)
        .fetch_optional(&self.pool)
        .await
        .unwrap_or(None);

        let is_synced = match (&latest_hash, &scheduled_hash) {
            (Some(lh), Some(sh)) => !lh.is_empty() && lh == sh,
            _ => false,
        };

        proto_l.version_hash = latest_hash;
        proto_l.scheduled_version_hash = scheduled_hash;
        proto_l.is_schedule_synced = is_synced;

        Ok(Response::new(proto_l))
    }

    async fn list_layouts(
        &self,
        request: Request<ListLayoutsRequest>,
    ) -> Result<Response<ListLayoutsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let layouts = LayoutService::list_layouts(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for l in layouts {
            let dto = LayoutService::get_layout_by_id(&self.pool, l.id)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;
            let mut proto_l = Self::map_layout_with_layers(dto);

            let latest_hash = sqlx::query_scalar::<_, String>(
                "SELECT version_hash FROM studio_layout_history WHERE layout_id = $1 ORDER BY created_at DESC LIMIT 1"
            )
            .bind(l.id)
            .fetch_optional(&self.pool)
            .await
            .unwrap_or(None);

            let scheduled_hash = sqlx::query_scalar::<_, String>(
                "SELECT version_hash FROM studio_schedule_events WHERE layout_id = $1 AND version_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1"
            )
            .bind(l.id)
            .fetch_optional(&self.pool)
            .await
            .unwrap_or(None);

            let is_synced = match (&latest_hash, &scheduled_hash) {
                (Some(lh), Some(sh)) => !lh.is_empty() && lh == sh,
                _ => false,
            };

            proto_l.version_hash = latest_hash;
            proto_l.scheduled_version_hash = scheduled_hash;
            proto_l.is_schedule_synced = is_synced;

            items.push(proto_l);
        }

        Ok(Response::new(ListLayoutsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_layout(
        &self,
        request: Request<UpdateLayoutRequest>,
    ) -> Result<Response<ProtoLayout>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layout id"))?;

        let orientation_id = if req.orientation_id.is_empty() {
            None
        } else {
            Some(Uuid::from_str(&req.orientation_id).map_err(|_| Status::invalid_argument("Invalid orientation_id"))?)
        };

        let resolution_id = req.resolution_id.and_then(|id| Uuid::from_str(&id).ok());
        let dto = UpdateLayoutDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            canvas_width: if req.canvas_width > 0 { Some(req.canvas_width) } else { None },
            canvas_height: if req.canvas_height > 0 { Some(req.canvas_height) } else { None },
            orientation_id,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
            background_image_url: if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
            resolution_id,
        };

        LayoutService::update_layout(&self.pool, layout_id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        // Simpan snapshot ke layout_history hanya saat tombol Simpan ditekan di editor
        let mut version_hash_opt = None;
        if let Ok(snapshot_val) = serde_json::to_value(&full_dto) {
            use sha2::{Digest, Sha256};
            let mut hasher = Sha256::new();
            hasher.update(serde_json::to_string(&full_dto).unwrap_or_default().as_bytes());
            let version_hash = format!("{:x}", hasher.finalize());
            let _ = crate::modules::studio::layout::LayoutHistoryRepository::create(
                &self.pool,
                layout_id,
                &version_hash,
                snapshot_val,
                Some("Perubahan disimpan dari Layout Designer"),
            ).await;
            version_hash_opt = Some(version_hash);
        }

        let scheduled_hash = sqlx::query_scalar::<_, String>(
            "SELECT version_hash FROM studio_schedule_events WHERE layout_id = $1 AND version_hash IS NOT NULL ORDER BY created_at DESC LIMIT 1"
        )
        .bind(layout_id)
        .fetch_optional(&self.pool)
        .await
        .unwrap_or(None);

        let is_synced = match (&version_hash_opt, &scheduled_hash) {
            (Some(lh), Some(sh)) => !lh.is_empty() && lh == sh,
            _ => false,
        };

        let mut proto_l = Self::map_layout_with_layers(full_dto);
        proto_l.version_hash = version_hash_opt;
        proto_l.scheduled_version_hash = scheduled_hash;
        proto_l.is_schedule_synced = is_synced;

        Ok(Response::new(proto_l))
    }

    async fn delete_layout(
        &self,
        request: Request<DeleteLayoutRequest>,
    ) -> Result<Response<DeleteLayoutResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layout id"))?;

        let success = LayoutService::delete_layout(&self.pool, layout_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteLayoutResponse { success }))
    }

    async fn list_layout_history(
        &self,
        request: Request<ListLayoutHistoryRequest>,
    ) -> Result<Response<ListLayoutHistoryResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_layouts")?;
        let req = request.into_inner();
        let layout_id = req.layout_id.and_then(|id| Uuid::from_str(&id).ok());
        let search = if req.search.is_empty() { None } else { Some(req.search) };

        let page = req.pagination.as_ref().map(|p| p.page as i64).unwrap_or(1).max(1);
        let limit = req.pagination.as_ref().map(|p| p.limit as i64).unwrap_or(20).clamp(1, 100);
        let offset = (page - 1) * limit;

        let total = crate::modules::studio::layout::LayoutHistoryRepository::count(&self.pool, layout_id, search.clone())
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let items = crate::modules::studio::layout::LayoutHistoryRepository::find_all(&self.pool, layout_id, search, limit, offset)
            .await
            .map_err(|e| Status::internal(e.to_string()))?
            .into_iter()
            .map(|h| LayoutHistoryItem {
                id: h.id.to_string(),
                layout_id: h.layout_id.to_string(),
                layout_name: h.layout_name.unwrap_or_default(),
                version_hash: h.version_hash,
                snapshot_json: h.snapshot_json.to_string(),
                description: h.description.unwrap_or_default(),
                created_at: h.created_at.to_rfc3339(),
            })
            .collect();

        Ok(Response::new(ListLayoutHistoryResponse {
            items,
            pagination: Some(crate::grpc::proto::common::v1::PaginationResponse {
                total_items: total,
                total_pages: ((total + limit - 1) / limit) as i32,
                current_page: page as i32,
                limit: limit as i32,
            }),
        }))
    }

    async fn rollback_layout(
        &self,
        request: Request<RollbackLayoutRequest>,
    ) -> Result<Response<RollbackLayoutResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();
        let history_id = Uuid::from_str(&req.history_id)
            .map_err(|_| Status::invalid_argument("Invalid history_id"))?;

        let layout_id = crate::modules::studio::layout::LayoutHistoryRepository::rollback(&self.pool, history_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(RollbackLayoutResponse {
            success: true,
            message: "Berhasil melakukan rollback layout".to_string(),
            layout_id: layout_id.to_string(),
        }))
    }

    async fn delete_layout_history(
        &self,
        request: Request<DeleteLayoutHistoryRequest>,
    ) -> Result<Response<DeleteLayoutHistoryResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_layouts")?;
        let req = request.into_inner();

        let count = if req.delete_all {
            let layout_id = req.layout_id.and_then(|id_str| Uuid::from_str(&id_str).ok());
            crate::modules::studio::layout::LayoutHistoryRepository::delete_all(&self.pool, layout_id)
                .await
                .map_err(|e| Status::internal(e.to_string()))?
        } else {
            let uuids: Vec<Uuid> = req.ids.into_iter()
                .filter_map(|s| Uuid::from_str(&s).ok())
                .collect();
            if uuids.is_empty() {
                return Ok(Response::new(DeleteLayoutHistoryResponse {
                    success: true,
                    deleted_count: 0,
                    message: "Tidak ada riwayat yang dipilih untuk dihapus".to_string(),
                }));
            }
            crate::modules::studio::layout::LayoutHistoryRepository::delete_by_ids(&self.pool, &uuids)
                .await
                .map_err(|e| Status::internal(e.to_string()))?
        };

        Ok(Response::new(DeleteLayoutHistoryResponse {
            success: true,
            deleted_count: count as i32,
            message: format!("Berhasil menghapus {} riwayat perubahan", count),
        }))
    }
}
