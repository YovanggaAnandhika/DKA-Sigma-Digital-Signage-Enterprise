use tonic::{Request, Response, Status};
use uuid::Uuid;
use crate::db::DbPool;
use crate::modules::studio::playlist::model::{AddPlaylistItemDto, CreatePlaylistDto, PlaylistItemEntity, PlaylistWithItemsDto, UpdatePlaylistDto};
use crate::modules::studio::playlist::services::PlaylistService;
use crate::grpc::proto::studio::v1::playlist::{
    playlist_service_server::PlaylistService as PlaylistServiceTrait,
    Playlist, PlaylistItem, CreatePlaylistRequest, GetPlaylistRequest,
    ListPlaylistsRequest, ListPlaylistsResponse, UpdatePlaylistRequest,
    DeletePlaylistRequest, DeletePlaylistResponse, AddPlaylistItemRequest,
    UpdatePlaylistItemRequest, RemovePlaylistItemRequest, RemovePlaylistItemResponse,
    ReorderPlaylistItemsRequest, ReorderPlaylistItemsResponse,
};

pub struct PlaylistServiceImpl {
    pub pool: DbPool,
}

impl PlaylistServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_playlist_with_items(dto: PlaylistWithItemsDto) -> Playlist {
        let items = dto.items.into_iter().map(|i| {
            PlaylistItem {
                id: i.id.to_string(),
                playlist_id: i.playlist_id.to_string(),
                media_item_id: i.media_item_id.to_string(),
                media_item: None,
                position: i.position,
                duration_seconds: i.duration_seconds,
                transition_type: i.transition_type,
                is_muted: i.is_muted,
                created_at: "".to_string(),
            }
        }).collect();

        Playlist {
            id: dto.playlist.id.to_string(),
            name: dto.playlist.name,
            description: dto.playlist.description.unwrap_or_default(),
            is_shuffle: dto.playlist.is_shuffle,
            items,
            total_duration_seconds: dto.total_duration_seconds,
            created_at: dto.playlist.created_at.to_rfc3339(),
            updated_at: dto.playlist.updated_at.to_rfc3339(),
        }
    }

    fn map_item_entity(item: PlaylistItemEntity) -> PlaylistItem {
        PlaylistItem {
            id: item.id.to_string(),
            playlist_id: item.playlist_id.to_string(),
            media_item_id: item.media_item_id.to_string(),
            media_item: None,
            position: item.position,
            duration_seconds: item.duration_seconds,
            transition_type: item.transition_type,
            is_muted: item.is_muted,
            created_at: item.created_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl PlaylistServiceTrait for PlaylistServiceImpl {
    async fn create_playlist(
        &self,
        request: Request<CreatePlaylistRequest>,
    ) -> Result<Response<Playlist>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();

        let dto = CreatePlaylistDto {
            name: req.name,
            description: if req.description.is_empty() { None } else { Some(req.description) },
            is_shuffle: Some(req.is_shuffle),
        };

        let playlist = PlaylistService::create_playlist(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        let full_dto = PlaylistService::get_playlist_by_id(&self.pool, playlist.id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_playlist_with_items(full_dto)))
    }

    async fn get_playlist(
        &self,
        request: Request<GetPlaylistRequest>,
    ) -> Result<Response<Playlist>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_playlists")?;
        let req = request.into_inner();
        let playlist_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Playlist tidak valid"))?;

        let dto = PlaylistService::get_playlist_by_id(&self.pool, playlist_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_playlist_with_items(dto)))
    }

    async fn list_playlists(
        &self,
        request: Request<ListPlaylistsRequest>,
    ) -> Result<Response<ListPlaylistsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_playlists")?;
        let playlists = PlaylistService::list_playlists(&self.pool)
            .await
            .map_err(Status::from)?;

        let mut items = Vec::new();
        for p in playlists {
            let dto = PlaylistService::get_playlist_by_id(&self.pool, p.id)
                .await
                .map_err(Status::from)?;
            items.push(Self::map_playlist_with_items(dto));
        }

        Ok(Response::new(ListPlaylistsResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_playlist(
        &self,
        request: Request<UpdatePlaylistRequest>,
    ) -> Result<Response<Playlist>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let playlist_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Playlist tidak valid"))?;

        let dto = UpdatePlaylistDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            description: if req.description.is_empty() { None } else { Some(req.description) },
            is_shuffle: Some(req.is_shuffle),
        };

        PlaylistService::update_playlist(&self.pool, playlist_id, dto)
            .await
            .map_err(Status::from)?;

        let full_dto = PlaylistService::get_playlist_by_id(&self.pool, playlist_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_playlist_with_items(full_dto)))
    }

    async fn delete_playlist(
        &self,
        request: Request<DeletePlaylistRequest>,
    ) -> Result<Response<DeletePlaylistResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let playlist_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Playlist tidak valid"))?;

        let success = PlaylistService::delete_playlist(&self.pool, playlist_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeletePlaylistResponse { success }))
    }

    async fn add_playlist_item(
        &self,
        request: Request<AddPlaylistItemRequest>,
    ) -> Result<Response<PlaylistItem>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();

        let playlist_id = Uuid::parse_str(&req.playlist_id)
            .map_err(|_| Status::invalid_argument("ID Playlist tidak valid"))?;
        let media_item_id = Uuid::parse_str(&req.media_item_id)
            .map_err(|_| Status::invalid_argument("ID Media tidak valid"))?;

        let dto = AddPlaylistItemDto {
            playlist_id,
            media_item_id,
            duration_seconds: if req.duration_seconds > 0 { Some(req.duration_seconds) } else { None },
            transition_type: if req.transition_type.is_empty() { None } else { Some(req.transition_type) },
            position: if req.position >= 0 { Some(req.position) } else { None },
            is_muted: None,
        };

        let item = PlaylistService::add_item(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_item_entity(item)))
    }

    async fn update_playlist_item(
        &self,
        request: Request<UpdatePlaylistItemRequest>,
    ) -> Result<Response<PlaylistItem>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let item_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Item tidak valid"))?;

        let item = PlaylistService::update_item(
            &self.pool,
            item_id,
            if req.duration_seconds > 0 { Some(req.duration_seconds) } else { None },
            if req.transition_type.is_empty() { None } else { Some(req.transition_type) },
            if req.position >= 0 { Some(req.position) } else { None },
            req.is_muted,
        )
        .await
        .map_err(Status::from)?;

        Ok(Response::new(Self::map_item_entity(item)))
    }

    async fn remove_playlist_item(
        &self,
        request: Request<RemovePlaylistItemRequest>,
    ) -> Result<Response<RemovePlaylistItemResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let item_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Item tidak valid"))?;

        let success = PlaylistService::remove_item(&self.pool, item_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(RemovePlaylistItemResponse { success }))
    }

    async fn reorder_playlist_items(
        &self,
        request: Request<ReorderPlaylistItemsRequest>,
    ) -> Result<Response<ReorderPlaylistItemsResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_playlists")?;
        let req = request.into_inner();
        let playlist_id = Uuid::parse_str(&req.playlist_id)
            .map_err(|_| Status::invalid_argument("ID Playlist tidak valid"))?;

        let item_ids = req.item_ids_in_order.into_iter().filter_map(|s| Uuid::parse_str(&s).ok()).collect::<Vec<_>>();

        PlaylistService::reorder_items(&self.pool, playlist_id, item_ids)
            .await
            .map_err(Status::from)?;

        let dto = PlaylistService::get_playlist_by_id(&self.pool, playlist_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(ReorderPlaylistItemsResponse {
            success: true,
            playlist: Some(Self::map_playlist_with_items(dto)),
        }))
    }
}
