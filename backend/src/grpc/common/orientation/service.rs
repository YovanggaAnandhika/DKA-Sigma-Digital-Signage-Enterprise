use sqlx::PgPool;
use tonic::{Request, Response, Status};

use crate::grpc::proto::common::v1::orientation::{
    orientation_service_server::OrientationService as OrientationServiceTrait,
    ListOrientationsRequest, ListOrientationsResponse, Orientation as ProtoOrientation,
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
            })
            .collect();

        Ok(Response::new(ListOrientationsResponse { items: proto_items }))
    }
}
