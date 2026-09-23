use sqlx::PgPool;
use std::str::FromStr;
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::studio::v1::layout::{
    layout_service_server::LayoutService as LayoutServiceTrait,
    CreateLayoutRequest, DeleteLayoutRequest, DeleteLayoutResponse, GetLayoutRequest,
    Layout as ProtoLayout, ListLayoutsRequest, ListLayoutsResponse, UpdateLayoutRequest,
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
            }),
            background_color: dto.layout.background_color,
            background_image_url: dto.layout.background_image_url.unwrap_or_default(),
            created_at: dto.layout.created_at.to_rfc3339(),
            updated_at: dto.layout.updated_at.to_rfc3339(),
            layers: dto.layers.into_iter().map(LayerServiceImpl::map_layer_with_blocks).collect(),
        }
    }
}

#[tonic::async_trait]
impl LayoutServiceTrait for LayoutServiceImpl {
    async fn create_layout(
        &self,
        request: Request<CreateLayoutRequest>,
    ) -> Result<Response<ProtoLayout>, Status> {
        let req = request.into_inner();
        let orientation_id = if req.orientation_id.is_empty() {
            let orientation_value = if req.canvas_width >= req.canvas_height { "landscape" } else { "portrait" };
            let record = sqlx::query!("SELECT id FROM orientations WHERE value = $1", orientation_value)
                .fetch_one(&self.pool)
                .await
                .map_err(|_| Status::internal("Orientation not found in database"))?;
            record.id
        } else {
            Uuid::from_str(&req.orientation_id)
                .map_err(|_| Status::invalid_argument("Invalid orientation_id"))?
        };

        let dto = CreateLayoutDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            canvas_width: Some(req.canvas_width),
            canvas_height: Some(req.canvas_height),
            orientation_id,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
            background_image_url: if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
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
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layout id"))?;

        let dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(|e| match e {
                crate::common::AppError::NotFound(m) => Status::not_found(m),
                _ => Status::internal(e.to_string()),
            })?;

        Ok(Response::new(Self::map_layout_with_layers(dto)))
    }

    async fn list_layouts(
        &self,
        _request: Request<ListLayoutsRequest>,
    ) -> Result<Response<ListLayoutsResponse>, Status> {
        let layouts = LayoutService::list_layouts(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for l in layouts {
            let dto = LayoutService::get_layout_by_id(&self.pool, l.id)
                .await
                .map_err(|e| Status::internal(e.to_string()))?;
            items.push(Self::map_layout_with_layers(dto));
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
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layout id"))?;

        let orientation_id = if req.orientation_id.is_empty() {
            None
        } else {
            Some(Uuid::from_str(&req.orientation_id).map_err(|_| Status::invalid_argument("Invalid orientation_id"))?)
        };

        let dto = UpdateLayoutDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            canvas_width: Some(req.canvas_width),
            canvas_height: Some(req.canvas_height),
            orientation_id,
            background_color: if req.background_color.is_empty() { None } else { Some(req.background_color) },
            background_image_url: if req.background_image_url.is_empty() { None } else { Some(req.background_image_url) },
        };

        LayoutService::update_layout(&self.pool, layout_id, dto)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let full_dto = LayoutService::get_layout_by_id(&self.pool, layout_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(Self::map_layout_with_layers(full_dto)))
    }

    async fn delete_layout(
        &self,
        request: Request<DeleteLayoutRequest>,
    ) -> Result<Response<DeleteLayoutResponse>, Status> {
        let req = request.into_inner();
        let layout_id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid layout id"))?;

        let success = LayoutService::delete_layout(&self.pool, layout_id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteLayoutResponse { success }))
    }
}
