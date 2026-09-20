use super::model::{CreateMediaDto, MediaEntity, UpdateMediaDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct MediaRepository;

impl MediaRepository {
    pub async fn create(pool: &DbPool, dto: CreateMediaDto) -> Result<MediaEntity, sqlx::Error> {
        let media = sqlx::query_as::<_, MediaEntity>(
            r#"
            INSERT INTO media_items (
                name, original_filename, file_path, public_url, file_size_bytes,
                mime_type, sha256_hash, media_type, width, height, duration_seconds, thumbnail_url
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.original_filename)
        .bind(dto.file_path)
        .bind(dto.public_url)
        .bind(dto.file_size_bytes)
        .bind(dto.mime_type)
        .bind(dto.sha256_hash)
        .bind(dto.media_type)
        .bind(dto.width.unwrap_or(0))
        .bind(dto.height.unwrap_or(0))
        .bind(dto.duration_seconds.unwrap_or(10))
        .bind(dto.thumbnail_url)
        .fetch_one(pool)
        .await?;

        Ok(media)
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<MediaEntity>, sqlx::Error> {
        let media = sqlx::query_as::<_, MediaEntity>("SELECT * FROM media_items WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        Ok(media)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<MediaEntity>, sqlx::Error> {
        let items = sqlx::query_as::<_, MediaEntity>(
            "SELECT * FROM media_items ORDER BY created_at DESC",
        )
        .fetch_all(pool)
        .await?;

        Ok(items)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateMediaDto,
    ) -> Result<MediaEntity, sqlx::Error> {
        let media = sqlx::query_as::<_, MediaEntity>(
            r#"
            UPDATE media_items
            SET 
                name = COALESCE($2, name),
                duration_seconds = COALESCE($3, duration_seconds),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.duration_seconds)
        .fetch_one(pool)
        .await?;

        Ok(media)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM media_items WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
