use super::model::{
    AddPlaylistItemDto, CreatePlaylistDto, PlaylistEntity, PlaylistItemEntity,
    PlaylistWithItemsDto, UpdatePlaylistDto,
};
use super::repositories::PlaylistRepository;
use crate::common::AppError;
use crate::db::DbPool;
use uuid::Uuid;

pub struct PlaylistService;

impl PlaylistService {
    pub async fn create_playlist(
        pool: &DbPool,
        dto: CreatePlaylistDto,
    ) -> Result<PlaylistEntity, AppError> {
        let playlist = PlaylistRepository::create(pool, dto).await?;
        Ok(playlist)
    }

    pub async fn get_playlist_by_id(
        pool: &DbPool,
        id: Uuid,
    ) -> Result<PlaylistWithItemsDto, AppError> {
        let playlist = PlaylistRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Playlist {} not found", id)))?;

        let items = PlaylistRepository::get_items(pool, id).await?;
        let total_duration_seconds: i32 = items.iter().map(|i| i.duration_seconds).sum();

        Ok(PlaylistWithItemsDto {
            playlist,
            items,
            total_duration_seconds,
        })
    }

    pub async fn list_playlists(pool: &DbPool) -> Result<Vec<PlaylistEntity>, AppError> {
        let playlists = PlaylistRepository::find_all(pool).await?;
        Ok(playlists)
    }

    pub async fn update_playlist(
        pool: &DbPool,
        id: Uuid,
        dto: UpdatePlaylistDto,
    ) -> Result<PlaylistEntity, AppError> {
        let playlist = PlaylistRepository::update(pool, id, dto).await?;
        Ok(playlist)
    }

    pub async fn delete_playlist(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = PlaylistRepository::delete(pool, id).await?;
        Ok(deleted)
    }

    pub async fn add_item(
        pool: &DbPool,
        dto: AddPlaylistItemDto,
    ) -> Result<PlaylistItemEntity, AppError> {
        let item = PlaylistRepository::add_item(pool, dto).await?;
        Ok(item)
    }

    pub async fn update_item(
        pool: &DbPool,
        id: Uuid,
        duration_seconds: Option<i32>,
        transition_type: Option<String>,
        position: Option<i32>,
    ) -> Result<PlaylistItemEntity, AppError> {
        let item = PlaylistRepository::update_item(pool, id, duration_seconds, transition_type, position).await?;
        Ok(item)
    }

    pub async fn remove_item(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = PlaylistRepository::remove_item(pool, id).await?;
        Ok(deleted)
    }

    pub async fn reorder_items(
        pool: &DbPool,
        playlist_id: Uuid,
        item_ids_in_order: Vec<Uuid>,
    ) -> Result<(), AppError> {
        PlaylistRepository::reorder_items(pool, playlist_id, item_ids_in_order).await?;
        Ok(())
    }
}
