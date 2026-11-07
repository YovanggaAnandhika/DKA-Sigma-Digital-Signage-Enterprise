use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::iam::branch::model::{BranchEntity, CreateBranchDto, UpdateBranchDto};
use crate::modules::iam::branch::services::BranchService;
use crate::grpc::proto::iam::v1::branch::{
    branch_service_server::BranchService as BranchServiceTrait,
    Branch, CreateBranchRequest, GetBranchRequest, ListBranchesRequest,
    ListBranchesResponse, UpdateBranchRequest, DeleteBranchRequest, DeleteBranchResponse,
};

pub struct BranchServiceImpl {
    pub pool: DbPool,
}

impl BranchServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_entity(branch: BranchEntity) -> Branch {
        Branch {
            id: branch.id.to_string(),
            corporation_id: branch.corporation_id.to_string(),
            name: branch.name,
            code: branch.code,
            address: branch.address.unwrap_or_default(),
            is_active: branch.is_active,
            created_at: branch.created_at.to_rfc3339(),
            updated_at: branch.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl BranchServiceTrait for BranchServiceImpl {
    async fn create_branch(
        &self,
        request: Request<CreateBranchRequest>,
    ) -> Result<Response<Branch>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_branches")?;
        let req = request.into_inner();

        let corp_id = if !req.corporation_id.is_empty() {
            Uuid::parse_str(&req.corporation_id)
                .map_err(|_| Status::invalid_argument("ID Korporasi tidak valid"))?
        } else {
            claims.active_corporation_id()
                .and_then(|c| Uuid::parse_str(c).ok())
                .ok_or_else(|| Status::invalid_argument("Corporation ID diperlukan"))?
        };

        let dto = CreateBranchDto {
            corporation_id: corp_id,
            name: req.name,
            code: req.code,
            address: if req.address.is_empty() { None } else { Some(req.address) },
        };

        let entity = BranchService::create_branch(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn get_branch(
        &self,
        request: Request<GetBranchRequest>,
    ) -> Result<Response<Branch>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_branches")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Cabang tidak valid"))?;

        let entity = BranchService::get_branch_by_id(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn list_branches(
        &self,
        request: Request<ListBranchesRequest>,
    ) -> Result<Response<ListBranchesResponse>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_view_branches")?;
        let req = request.into_inner();

        let corp_id = if !req.corporation_id.is_empty() {
            Uuid::parse_str(&req.corporation_id).ok()
        } else if !claims.is_superadmin {
            claims.active_corporation_id().and_then(|c| Uuid::parse_str(c).ok())
        } else {
            claims.impersonated_corporation_id.as_deref().and_then(|c| Uuid::parse_str(c).ok())
        };

        let search = if req.search.trim().is_empty() { None } else { Some(req.search.trim()) };

        let branches = BranchService::list_branches(&self.pool, corp_id, search)
            .await
            .map_err(Status::from)?;

        let items = branches.into_iter().map(Self::map_entity).collect();
        Ok(Response::new(ListBranchesResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_branch(
        &self,
        request: Request<UpdateBranchRequest>,
    ) -> Result<Response<Branch>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_branches")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Cabang tidak valid"))?;

        let dto = UpdateBranchDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            code: if req.code.is_empty() { None } else { Some(req.code) },
            address: if req.address.is_empty() { None } else { Some(req.address) },
            is_active: Some(req.is_active),
        };

        let entity = BranchService::update_branch(&self.pool, id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_entity(entity)))
    }

    async fn delete_branch(
        &self,
        request: Request<DeleteBranchRequest>,
    ) -> Result<Response<DeleteBranchResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_branches")?;
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Cabang tidak valid"))?;

        let success = BranchService::delete_branch(&self.pool, id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteBranchResponse { success }))
    }
}

