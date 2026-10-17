use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::PgPool;
use std::str::FromStr;

use crate::grpc::proto::studio::v1::album::{
    album_service_server::AlbumService as AlbumServiceTrait,
    CreateAlbumRequest, GetAlbumRequest, ListAlbumsRequest, ListAlbumsResponse,
    UpdateAlbumRequest, DeleteAlbumRequest, DeleteAlbumResponse, AddAlbumPhotoRequest,
    DeleteAlbumPhotoRequest, DeleteAlbumPhotoResponse, AlbumDetail, AlbumPhoto,
};
use crate::grpc::proto::common::v1::PaginationResponse;

pub struct AlbumServiceImpl {
    pub pool: PgPool,
}

impl AlbumServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn fetch_album_detail(&self, id: Uuid) -> Result<AlbumDetail, Status> {
        let album = sqlx::query!(
            "SELECT id, name, description, transition_effect, slide_duration_seconds, created_at, updated_at FROM albums WHERE id = $1",
            id
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Album not found"))?;

        let photos = sqlx::query!(
            r#"
            SELECT id, album_id, media_item_id, position, promo_badge, price_tag, created_at
            FROM album_photos
            WHERE album_id = $1
            ORDER BY position ASC, created_at ASC
            "#,
            id
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .into_iter()
        .map(|p| AlbumPhoto {
            id: p.id.to_string(),
            album_id: p.album_id.to_string(),
            media_item_id: p.media_item_id.to_string(),
            order_index: p.position,
            caption: p.promo_badge.unwrap_or_default(),
            duration_seconds: album.slide_duration_seconds,
            created_at: p.created_at.to_rfc3339(),
            media_item: None,
        })
        .collect();

        Ok(AlbumDetail {
            id: album.id.to_string(),
            name: album.name,
            description: album.description,
            transition_effect: album.transition_effect,
            slide_duration_seconds: album.slide_duration_seconds,
            photos,
            created_at: album.created_at.to_rfc3339(),
            updated_at: album.updated_at.to_rfc3339(),
        })
    }
}

#[tonic::async_trait]
impl AlbumServiceTrait for AlbumServiceImpl {
    async fn create_album(
        &self,
        request: Request<CreateAlbumRequest>,
    ) -> Result<Response<AlbumDetail>, Status> {
        let req = request.into_inner();
        let album_id = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO albums (id, name, description, transition_effect, slide_duration_seconds)
            VALUES ($1, $2, $3, $4, $5)
            "#,
            album_id,
            req.name,
            req.description,
            if req.transition_effect.is_empty() { "ken-burns" } else { &req.transition_effect },
            if req.slide_duration_seconds > 0 { req.slide_duration_seconds } else { 5 },
        )
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        for p in req.photos {
            if let Ok(mid) = Uuid::from_str(&p.media_item_id) {
                let pid = Uuid::new_v4();
                sqlx::query!(
                    r#"
                    INSERT INTO album_photos (id, album_id, media_item_id, position, promo_badge, price_tag)
                    VALUES ($1, $2, $3, $4, $5, '')
                    "#,
                    pid,
                    album_id,
                    mid,
                    p.order_index,
                    p.caption,
                )
                .execute(&self.pool)
                .await
                .ok();
            }
        }

        self.fetch_album_detail(album_id).await.map(Response::new)
    }

    async fn get_album(
        &self,
        request: Request<GetAlbumRequest>,
    ) -> Result<Response<AlbumDetail>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        self.fetch_album_detail(id).await.map(Response::new)
    }

    async fn list_albums(
        &self,
        request: Request<ListAlbumsRequest>,
    ) -> Result<Response<ListAlbumsResponse>, Status> {
        let req = request.into_inner();
        let search = format!("%{}%", req.search);

        let rows = sqlx::query!(
            "SELECT id FROM albums WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT 50",
            search
        )
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for r in rows {
            if let Ok(a) = self.fetch_album_detail(r.id).await {
                items.push(a);
            }
        }

        Ok(Response::new(ListAlbumsResponse {
            items,
            pagination: Some(PaginationResponse {
                current_page: 1,
                limit: 50,
                total_items: 0,
                total_pages: 1,
            }),
        }))
    }

    async fn update_album(
        &self,
        request: Request<UpdateAlbumRequest>,
    ) -> Result<Response<AlbumDetail>, Status> {
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id).map_err(|_| Status::invalid_argument("Invalid id"))?;

        sqlx::query!(
            r#"
            UPDATE albums
            SET name = COALESCE(NULLIF($2, ''), name),
                description = COALESCE(NULLIF($3, ''), description),
                transition_effect = COALESCE(NULLIF($4, ''), transition_effect),
                slide_duration_seconds = CASE WHEN $5 > 0 THEN $5 ELSE slide_duration_seconds END,
                updated_at = NOW()
            WHERE id = $1
            "#,
            id,
            req.name,
            req.description,
            req.transition_effect,
            req.slide_duration_seconds,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        if !req.photos.is_empty() {
            sqlx::query!("DELETE FROM album_photos WHERE album_id = $1", id)
                .execute(&self.pool)
                .await
                .ok();

            for p in req.photos {
                if let Ok(mid) = Uuid::from_str(&p.media_item_id) {
                    let pid = Uuid::new_v4();
                    sqlx::query!(
                        r#"
                        INSERT INTO album_photos (id, album_id, media_item_id, position, promo_badge, price_tag)
                        VALUES ($1, $2, $3, $4, $5, '')
                        "#,
                        pid,
                        id,
                        mid,
                        p.order_index,
                        p.caption,
                    )
                    .execute(&self.pool)
                    .await
                    .ok();
                }
            }
        }

        self.fetch_album_detail(id).await.map(Response::new)
    }

    async fn delete_album(
        &self,
        request: Request<DeleteAlbumRequest>,
    ) -> Result<Response<DeleteAlbumResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM albums WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteAlbumResponse { success: true }))
    }

    async fn add_album_photo(
        &self,
        request: Request<AddAlbumPhotoRequest>,
    ) -> Result<Response<AlbumPhoto>, Status> {
        let req = request.into_inner();
        let album_id = Uuid::from_str(&req.album_id).map_err(|_| Status::invalid_argument("Invalid album_id"))?;
        let media_id = Uuid::from_str(&req.media_item_id).map_err(|_| Status::invalid_argument("Invalid media_item_id"))?;
        let pid = Uuid::new_v4();

        sqlx::query!(
            r#"
            INSERT INTO album_photos (id, album_id, media_item_id, position, promo_badge, price_tag)
            VALUES ($1, $2, $3, $4, $5, '')
            "#,
            pid,
            album_id,
            media_id,
            req.order_index,
            req.caption,
        )
        .execute(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        Ok(Response::new(AlbumPhoto {
            id: pid.to_string(),
            album_id: album_id.to_string(),
            media_item_id: media_id.to_string(),
            order_index: req.order_index,
            caption: req.caption,
            duration_seconds: 5,
            created_at: chrono::Utc::now().to_rfc3339(),
            media_item: None,
        }))
    }

    async fn delete_album_photo(
        &self,
        request: Request<DeleteAlbumPhotoRequest>,
    ) -> Result<Response<DeleteAlbumPhotoResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query!("DELETE FROM album_photos WHERE id = $1", id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteAlbumPhotoResponse { success: true }))
    }
}
