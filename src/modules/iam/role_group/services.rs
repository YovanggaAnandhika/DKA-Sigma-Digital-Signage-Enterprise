use super::model::{CreateRoleGroupDto, RoleGroupEntity, UpdateRoleGroupDto};
use super::repositories::RoleGroupRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct RoleGroupService;

impl RoleGroupService {
    pub async fn create_role_group(
        pool: &DbPool,
        dto: CreateRoleGroupDto,
    ) -> Result<RoleGroupEntity, AppError> {
        let group = RoleGroupRepository::create(pool, dto).await?;
        Ok(group)
    }

    pub async fn get_role_group_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<RoleGroupEntity, AppError> {
        RoleGroupRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Role group {} not found", id)))
    }

    pub async fn list_role_groups(pool: &DbPool) -> Result<Vec<RoleGroupEntity>, AppError> {
        let groups = RoleGroupRepository::find_all(pool).await?;
        Ok(groups)
    }

    pub async fn update_role_group(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateRoleGroupDto,
    ) -> Result<RoleGroupEntity, AppError> {
        let group = RoleGroupRepository::update(pool, id, dto).await?;
        Ok(group)
    }

    pub async fn delete_role_group(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = RoleGroupRepository::delete(pool, id).await?;
        Ok(deleted)
    }
}
