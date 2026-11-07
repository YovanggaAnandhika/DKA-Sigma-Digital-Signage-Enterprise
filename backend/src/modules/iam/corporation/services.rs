use super::model::{CorporationEntity, CreateCorporationDto, UpdateCorporationDto};
use super::repositories::CorporationRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct CorporationService;

impl CorporationService {
    pub async fn create_corporation(
        pool: &DbPool,
        dto: CreateCorporationDto,
    ) -> Result<CorporationEntity, AppError> {
        if CorporationRepository::find_by_slug(pool, &dto.slug).await?.is_some() {
            return Err(AppError::BadRequest(format!(
                "Korporasi dengan slug '{}' sudah terdaftar",
                dto.slug
            )));
        }

        let corp = CorporationRepository::create(pool, dto).await?;
        Ok(corp)
    }

    pub async fn get_corporation_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<CorporationEntity, AppError> {
        CorporationRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Korporasi dengan ID '{}' tidak ditemukan", id)))
    }

    pub async fn get_corporation_by_slug(
        pool: &DbPool,
        slug: &str,
    ) -> Result<CorporationEntity, AppError> {
        CorporationRepository::find_by_slug(pool, slug)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Korporasi dengan slug '{}' tidak ditemukan", slug)))
    }

    pub async fn list_corporations(
        pool: &DbPool,
        search: Option<&str>,
    ) -> Result<Vec<CorporationEntity>, AppError> {
        let corps = CorporationRepository::find_all(pool, search).await?;
        Ok(corps)
    }

    pub async fn update_corporation(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateCorporationDto,
    ) -> Result<CorporationEntity, AppError> {
        let corp = CorporationRepository::update(pool, id, dto).await?;
        Ok(corp)
    }

    pub async fn delete_corporation(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = CorporationRepository::delete(pool, id).await?;
        Ok(deleted)
    }
}

