use tonic::{Request, Response, Status};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use crate::db::DbPool;
use crate::modules::iam::corporation::model::{CorporationEntity, CreateCorporationDto, UpdateCorporationDto};
use crate::modules::iam::corporation::services::CorporationService;
use crate::grpc::proto::iam::v1::corporation::{
    corporation_service_server::CorporationService as CorporationServiceTrait,
    Corporation, CreateCorporationRequest, GetCorporationRequest, GetCorporationBySlugRequest,
    ListCorporationsRequest, ListCorporationsResponse, UpdateCorporationRequest,
    DeleteCorporationRequest, DeleteCorporationResponse,
};

pub struct CorporationServiceImpl {
    pub pool: DbPool,
}

impl CorporationServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_entity(corp: CorporationEntity) -> Corporation {
        Corporation {
            id: corp.id.to_string(),
            name: corp.name,
            slug: corp.slug,
            description: corp.description.unwrap_or_default(),
            active_until: corp.active_until.map(|dt| dt.to_rfc3339()).unwrap_or_default(),
            max_screens: corp.max_screens,
            max_branches: corp.max_branches,
            subscription_tier: corp.subscription_tier,
            is_active: corp.is_active,
            created_at: corp.created_at.to_rfc3339(),
            updated_at: corp.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl CorporationServiceTrait for CorporationServiceImpl {
    async fn create_corporation(
        &self,
        request: Request<CreateCorporationRequest>,
    ) -> Result<Response<Corporation>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_corporations")?;
        let req = request.into_inner();

        let active_until = if req.active_until.is_empty() {
            None
        } else {
            DateTime::parse_from_rfc3339(&req.active_until)
                .map(|dt| dt.with_timezone(&Utc))
                .ok()
        };

        let dto = CreateCorporationDto {
            name: req.name,
            slug: req.slug,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            active_until,
            max_screens: if req.max_screens > 0 { Some(req.max_screens) } else { None },
            max_branches: if req.max_branches > 0 { Some(req.max_branches) } else { None },
            subscription_tier: if req.subscription_tier.is_empty() { None } else { Some(req.subscription_tier) },
        };

        let entity = CorporationService::create_corporation(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn get_corporation(
        &self,
        request: Request<GetCorporationRequest>,
    ) -> Result<Response<Corporation>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_corporations")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Korporasi tidak valid"))?;

        let entity = CorporationService::get_corporation_by_id(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn get_corporation_by_slug(
        &self,
        request: Request<GetCorporationBySlugRequest>,
    ) -> Result<Response<Corporation>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_corporations")?;
        let req = request.into_inner();

        let entity = CorporationService::get_corporation_by_slug(&self.pool, &req.slug)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn list_corporations(
        &self,
        request: Request<ListCorporationsRequest>,
    ) -> Result<Response<ListCorporationsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_corporations")?;
        let req = request.into_inner();
        let search = if req.search.trim().is_empty() { None } else { Some(req.search.trim()) };

        let corps = CorporationService::list_corporations(&self.pool, search)
            .await
            .map_err(Status::from)?;

        let items = corps.into_iter().map(Self::map_entity).collect();
        Ok(Response::new(ListCorporationsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_corporation(
        &self,
        request: Request<UpdateCorporationRequest>,
    ) -> Result<Response<Corporation>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_corporations")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Korporasi tidak valid"))?;

        let active_until = if req.active_until.is_empty() {
            None
        } else {
            DateTime::parse_from_rfc3339(&req.active_until)
                .map(|dt| dt.with_timezone(&Utc))
                .ok()
        };

        let dto = UpdateCorporationDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            active_until,
            max_screens: if req.max_screens > 0 { Some(req.max_screens) } else { None },
            max_branches: if req.max_branches > 0 { Some(req.max_branches) } else { None },
            subscription_tier: if req.subscription_tier.is_empty() { None } else { Some(req.subscription_tier) },
            is_active: Some(req.is_active),
        };

        let entity = CorporationService::update_corporation(&self.pool, id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn delete_corporation(
        &self,
        request: Request<DeleteCorporationRequest>,
    ) -> Result<Response<DeleteCorporationResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_corporations")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Korporasi tidak valid"))?;

        let success = CorporationService::delete_corporation(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteCorporationResponse { success }))
    }
}

