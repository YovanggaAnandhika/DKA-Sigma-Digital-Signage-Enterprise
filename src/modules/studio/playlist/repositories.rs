use super::model::{
    AddPlaylistItemDto, CreatePlaylistDto, PlaylistEntity, PlaylistItemEntity,
    PlaylistItemWithMediaDto, UpdatePlaylistDto,
};
use crate::db::DbPool;
use uuid::Uuid;

pub struct PlaylistRepository;

impl PlaylistRepository {
    pub async fn create(
        pool: &DbPool,
        dto: CreatePlaylistDto,
    ) -> Result<PlaylistEntity, sqlx::Error> {
        let playlist = sqlx::query_as::<_, PlaylistEntity>(
            r#"
            INSERT INTO playlists (name, description, is_shuffle)
            VALUES ($1, $2, $3)
            RETURNING *
            "#,
        )
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.is_shuffle.unwrap_or(false))
        .fetch_one(pool)
        .await?;

        Ok(playlist)
    }

    pub async fn find_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<Option<PlaylistEntity>, sqlx::Error> {
        let playlist = sqlx::query_as::<_, PlaylistEntity>(
            "SELECT * FROM playlists WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(pool)
        .await?;

        Ok(playlist)
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<PlaylistEntity>, sqlx::Error> {
        let playlists = sqlx::query_as::<_, PlaylistEntity>(
            "SELECT * FROM playlists ORDER BY name ASC",
        )
        .fetch_all(pool)
        .await?;

        Ok(playlists)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdatePlaylistDto,
    ) -> Result<PlaylistEntity, sqlx::Error> {
        let playlist = sqlx::query_as::<_, PlaylistEntity>(
            r#"
            UPDATE playlists
            SET 
                name = COALESCE($2, name),
                description = COALESCE($3, description),
                is_shuffle = COALESCE($4, is_shuffle),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.description)
        .bind(dto.is_shuffle)
        .fetch_one(pool)
        .await?;

        Ok(playlist)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM playlists WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn get_items(
        pool: &DbPool,
        playlist_id: Uuid,
    ) -> Result<Vec<PlaylistItemWithMediaDto>, sqlx::Error> {
        let rows = sqlx::query_as::<_, PlaylistItemWithMediaDto>(
            r#"
            SELECT 
                pi.id,
                pi.playlist_id,
                pi.media_item_id,
                m.name as media_name,
                m.public_url as media_url,
                m.media_type,
                pi.position,
                pi.duration_seconds,
                pi.duration_seconds,
                pi.transition_type,
                pi.is_muted
            FROM playlist_items pi
            JOIN media_items m ON m.id = pi.media_item_id
            WHERE pi.playlist_id = $1
            ORDER BY pi.position ASC
            "#,
        )
        .bind(playlist_id)
        .fetch_all(pool)
        .await?;

        Ok(rows)
    }

    pub async fn add_item(
        pool: &DbPool,
        dto: AddPlaylistItemDto,
    ) -> Result<PlaylistItemEntity, sqlx::Error> {
        let max_pos: Option<i32> = sqlx::query_scalar(
            "SELECT MAX(position) FROM playlist_items WHERE playlist_id = $1",
        )
        .bind(dto.playlist_id)
        .fetch_optional(pool)
        .await?
        .flatten();

        let next_pos = dto.position.unwrap_or(max_pos.unwrap_or(-1) + 1);

        let item = sqlx::query_as::<_, PlaylistItemEntity>(
            r#"
            INSERT INTO playlist_items (playlist_id, media_item_id, position, duration_seconds, transition_type, is_muted)
            VALUES (
                $1,
                $2,
                $3,
                COALESCE($4, (SELECT duration_seconds FROM media_items WHERE id = $2 AND duration_seconds > 0), 10),
                $5,
                COALESCE($6, false)
            )
            RETURNING *
            "#,
        )
        .bind(dto.playlist_id)
        .bind(dto.media_item_id)
        .bind(next_pos)
        .bind(dto.duration_seconds)
        .bind(dto.transition_type.unwrap_or_else(|| "none".to_string()))
        .bind(dto.is_muted)
        .fetch_one(pool)
        .await?;

        Ok(item)
    }

    pub async fn update_item(
        pool: &DbPool,
        id: Uuid,
        duration_seconds: Option<i32>,
        transition_type: Option<String>,
        position: Option<i32>,
        is_muted: Option<bool>,
    ) -> Result<PlaylistItemEntity, sqlx::Error> {
        let item = sqlx::query_as::<_, PlaylistItemEntity>(
            r#"
            UPDATE playlist_items
            SET 
                duration_seconds = COALESCE($2, duration_seconds),
                transition_type = COALESCE($3, transition_type),
                position = COALESCE($4, position),
                is_muted = COALESCE($5, is_muted)
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(duration_seconds)
        .bind(transition_type)
        .bind(position)
        .bind(is_muted)
        .fetch_one(pool)
        .await?;

        Ok(item)
    }

    pub async fn remove_item(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM playlist_items WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }

    pub async fn reorder_items(
        pool: &DbPool,
        _playlist_id: Uuid,
        item_ids_in_order: Vec<Uuid>,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;

        for (idx, item_id) in item_ids_in_order.iter().enumerate() {
            sqlx::query(
                "UPDATE playlist_items SET position = $1 WHERE id = $2",
            )
            .bind(idx as i32)
            .bind(item_id)
            .execute(&mut *tx)
            .await?;
        }

        tx.commit().await?;
        Ok(())
    }
}
