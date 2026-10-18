use sqlx::PgPool;
use tonic::{Request, Response, Status};
use uuid::Uuid;
use std::str::FromStr;

use crate::grpc::proto::common::v1::orientation::{
    orientation_service_server::OrientationService as OrientationServiceTrait,
    ListOrientationsRequest, ListOrientationsResponse,
    GetOrientationRequest, CreateOrientationRequest,
    UpdateOrientationRequest, DeleteOrientationRequest,
    DeleteOrientationResponse, Orientation as ProtoOrientation,
};
use crate::modules::common::orientation::services::OrientationService;

pub struct OrientationServiceImpl {
    pub pool: PgPool,
}

impl OrientationServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[tonic::async_trait]
impl OrientationServiceTrait for OrientationServiceImpl {
    async fn list_orientations(
        &self,
        _request: Request<ListOrientationsRequest>,
    ) -> Result<Response<ListOrientationsResponse>, Status> {
        let items = OrientationService::list_orientations(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        let proto_items = items
            .into_iter()
            .map(|o| ProtoOrientation {
                id: o.id.to_string(),
                name: o.name,
                value: o.value,
                created_at: o.created_at.to_rfc3339(),
                updated_at: o.updated_at.to_rfc3339(),
            })
            .collect();

        Ok(Response::new(ListOrientationsResponse { items: proto_items }))
    }

    async fn get_orientation(
        &self,
        request: Request<GetOrientationRequest>,
    ) -> Result<Response<ProtoOrientation>, Status> {
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let o = OrientationService::get_orientation_by_id(&self.pool, id)
            .await
            .map_err(|e| Status::not_found(e.to_string()))?;

        Ok(Response::new(ProtoOrientation {
            id: o.id.to_string(),
            name: o.name,
            value: o.value,
            created_at: o.created_at.to_rfc3339(),
            updated_at: o.updated_at.to_rfc3339(),
        }))
    }

    async fn create_orientation(
        &self,
        request: Request<CreateOrientationRequest>,
    ) -> Result<Response<ProtoOrientation>, Status> {
        let req = request.into_inner();
        let o = OrientationService::create_orientation(&self.pool, &req.name, &req.value)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ProtoOrientation {
            id: o.id.to_string(),
            name: o.name,
            value: o.value,
            created_at: o.created_at.to_rfc3339(),
            updated_at: o.updated_at.to_rfc3339(),
        }))
    }

    async fn update_orientation(
        &self,
        request: Request<UpdateOrientationRequest>,
    ) -> Result<Response<ProtoOrientation>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        let o = OrientationService::update_orientation(&self.pool, id, &req.name, &req.value)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(ProtoOrientation {
            id: o.id.to_string(),
            name: o.name,
            value: o.value,
            created_at: o.created_at.to_rfc3339(),
            updated_at: o.updated_at.to_rfc3339(),
        }))
    }

    async fn delete_orientation(
        &self,
        request: Request<DeleteOrientationRequest>,
    ) -> Result<Response<DeleteOrientationResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid id"))?;

        OrientationService::delete_orientation(&self.pool, id)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(DeleteOrientationResponse { success: true }))
    }
}

