use super::model::{BranchEntity, CreateBranchDto, UpdateBranchDto};
use super::repositories::BranchRepository;
use crate::common::AppError;
use crate::db::DbPool;
use crate::modules::iam::corporation::repositories::CorporationRepository;
use uuid::Uuid;

pub struct BranchService;

impl BranchService {
    pub async fn create_branch(
        pool: &DbPool,
        dto: CreateBranchDto,
    ) -> Result<BranchEntity, AppError> {
        // 1. Verify corporation exists
        let corp = CorporationRepository::find_by_id(pool, dto.corporation_id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Korporasi dengan ID '{}' tidak ditemukan", dto.corporation_id)))?;

        // 2. Check quota max_branches
        let current_count = BranchRepository::count_by_corporation(pool, dto.corporation_id).await?;
        if current_count >= corp.max_branches as i64 {
            return Err(AppError::BadRequest(format!(
                "Batas maksimum cabang ({}) untuk korporasi '{}' telah tercapai",
                corp.max_branches, corp.name
            )));
        }

        // 3. Check unique code per corporation
        if BranchRepository::find_by_code(pool, dto.corporation_id, &dto.code).await?.is_some() {
            return Err(AppError::BadRequest(format!(
                "Kode cabang '{}' sudah digunakan pada korporasi ini",
                dto.code
            )));
        }

        let branch = BranchRepository::create(pool, dto).await?;
        Ok(branch)
    }

    pub async fn get_branch_by_id(pool: &DbPool, id: Uuid) -> Result<BranchEntity, AppError> {
        BranchRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Cabang dengan ID '{}' tidak ditemukan", id)))
    }

    pub async fn list_branches(
        pool: &DbPool,
        corporation_id: Option<Uuid>,
        search: Option<&str>,
    ) -> Result<Vec<BranchEntity>, AppError> {
        let branches = BranchRepository::find_all(pool, corporation_id, search).await?;
        Ok(branches)
    }

    pub async fn update_branch(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateBranchDto,
    ) -> Result<BranchEntity, AppError> {
        let branch = BranchRepository::update(pool, id, dto).await?;
        Ok(branch)
    }

    pub async fn delete_branch(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = BranchRepository::delete(pool, id).await?;
        Ok(deleted)
    }
}

