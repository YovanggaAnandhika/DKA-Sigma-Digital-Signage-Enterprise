use super::model::{CreateRoleDto, RoleEntity, UpdateRoleDto};
use super::repositories::RoleRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct RoleService;

impl RoleService {
    pub async fn create_role(pool: &DbPool, dto: CreateRoleDto) -> Result<RoleEntity, AppError> {
        if let Some(_) = RoleRepository::find_by_slug(pool, &dto.slug).await? {
            return Err(AppError::BadRequest(format!(
                "Role with slug '{}' already exists",
                dto.slug
            )));
        }

        let role = RoleRepository::create(pool, dto).await?;
        Ok(role)
    }

    pub async fn get_role_by_id(pool: &DbPool, id: Uuid) -> Result<RoleEntity, AppError> {
        RoleRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Role {} not found", id)))
    }

    pub async fn list_roles(pool: &DbPool) -> Result<Vec<RoleEntity>, AppError> {
        let roles = RoleRepository::find_all(pool).await?;
        Ok(roles)
    }

    pub async fn update_role(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateRoleDto,
    ) -> Result<RoleEntity, AppError> {
        let role = RoleRepository::update(pool, id, dto).await?;
        Ok(role)
    }

    pub async fn delete_role(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = RoleRepository::delete(pool, id).await?;
        if !deleted {
            return Err(AppError::BadRequest(
                "Cannot delete system role or role does not exist".into(),
            ));
        }
        Ok(deleted)
    }

    pub async fn assign_permissions(
        pool: &DbPool,
        role_id: Uuid,
        perm_ids: Vec<Uuid>,
    ) -> Result<(), AppError> {
        RoleRepository::assign_permissions(pool, role_id, perm_ids).await?;
        Ok(())
    }
}
