use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::config::Config;
use crate::common::AppError;
use crate::modules::iam::user::model::{CreateUserDto, LoginDto, UpdateUserDto, UserEntity};
use crate::modules::iam::user::services::UserService;
use crate::modules::iam::permission::repositories::PermissionRepository;
use crate::grpc::proto::iam::v1::user::{
    user_service_server::UserService as UserServiceTrait,
    User, CreateUserRequest, GetUserRequest, ListUsersRequest,
    ListUsersResponse, UpdateUserRequest, DeleteUserRequest, DeleteUserResponse,
    LoginRequest, LoginResponse,
};

pub struct UserServiceImpl {
    pub pool: DbPool,
    pub config: Config,
}

impl UserServiceImpl {
    pub fn new(pool: DbPool, config: Config) -> Self {
        Self { pool, config }
    }

    async fn map_user_entity(&self, user: UserEntity) -> Result<User, Status> {
        let effective_permissions = PermissionRepository::get_user_permissions(&self.pool, user.id)
            .await
            .map_err(|e| Status::internal(format!("Failed to query user permissions: {}", e)))?;

        Ok(User {
            id: user.id.to_string(),
            email: user.email,
            full_name: user.full_name,
            is_active: user.is_active,
            roles: vec![],
            role_groups: vec![],
            effective_permissions,
            created_at: user.created_at.to_rfc3339(),
            updated_at: user.updated_at.to_rfc3339(),
        })
    }
}

#[tonic::async_trait]
impl UserServiceTrait for UserServiceImpl {
    async fn create_user(
        &self,
        request: Request<CreateUserRequest>,
    ) -> Result<Response<User>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();

        let role_ids = req.role_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();
        let role_group_ids = req.role_group_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = CreateUserDto {
            email: req.email,
            password: req.password,
            full_name: req.full_name,
            role_ids: if role_ids.is_empty() { None } else { Some(role_ids) },
            role_group_ids: if role_group_ids.is_empty() { None } else { Some(role_group_ids) },
        };

        let user = UserService::create_user(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        let proto_user = self.map_user_entity(user).await?;
        Ok(Response::new(proto_user))
    }

    async fn get_user(
        &self,
        request: Request<GetUserRequest>,
    ) -> Result<Response<User>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let user_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID User tidak valid"))?;

        let user = UserService::get_user_by_id(&self.pool, user_id)
            .await
            .map_err(Status::from)?;

        let proto_user = self.map_user_entity(user).await?;
        Ok(Response::new(proto_user))
    }

    async fn list_users(
        &self,
        request: Request<ListUsersRequest>,
    ) -> Result<Response<ListUsersResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let users = UserService::list_users(&self.pool)
            .await
            .map_err(Status::from)?;

        let mut items = Vec::new();
        for u in users {
            items.push(self.map_user_entity(u).await?);
        }

        Ok(Response::new(ListUsersResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_user(
        &self,
        request: Request<UpdateUserRequest>,
    ) -> Result<Response<User>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let user_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID User tidak valid"))?;

        let role_ids = req.role_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();
        let role_group_ids = req.role_group_ids.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        let dto = UpdateUserDto {
            full_name: if req.full_name.is_empty() { None } else { Some(req.full_name) },
            is_active: Some(req.is_active),
            role_ids: if role_ids.is_empty() { None } else { Some(role_ids) },
            role_group_ids: if role_group_ids.is_empty() { None } else { Some(role_group_ids) },
        };

        let user = UserService::update_user(&self.pool, user_id, dto)
            .await
            .map_err(Status::from)?;

        let proto_user = self.map_user_entity(user).await?;
        Ok(Response::new(proto_user))
    }

    async fn delete_user(
        &self,
        request: Request<DeleteUserRequest>,
    ) -> Result<Response<DeleteUserResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_iam")?;
        let req = request.into_inner();
        let user_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID User tidak valid"))?;

        let success = UserService::delete_user(&self.pool, user_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteUserResponse { success }))
    }

    async fn login(
        &self,
        request: Request<LoginRequest>,
    ) -> Result<Response<LoginResponse>, Status> {
        let req = request.into_inner();
        let dto = LoginDto {
            email: req.email,
            password: req.password,
        };

        let res = UserService::login(&self.pool, &self.config, dto)
            .await
            .map_err(Status::from)?;

        let expires_at = (chrono::Utc::now() + chrono::Duration::hours(self.config.jwt_expiration_hours)).timestamp();
        let proto_user = self.map_user_entity(res.user).await?;

        Ok(Response::new(LoginResponse {
            token: res.token,
            user: Some(proto_user),
            expires_at,
        }))
    }
}
