use tonic::{Request, Response, Status};
use uuid::Uuid;
use sqlx::{PgPool, FromRow};
use std::str::FromStr;

use crate::grpc::proto::components::v1::album::album::{
    album_service_server::AlbumService as AlbumServiceTrait,
    CreateAlbumRequest, GetAlbumRequest, ListAlbumsRequest, ListAlbumsResponse,
    UpdateAlbumRequest, DeleteAlbumRequest, DeleteAlbumResponse, AlbumDetail,
};
use crate::grpc::proto::components::v1::album::photo::{
    album_photo_service_server::AlbumPhotoService as AlbumPhotoServiceTrait,
    AddAlbumPhotoRequest, DeleteAlbumPhotoRequest, DeleteAlbumPhotoResponse, AlbumPhoto,
};
use crate::grpc::proto::common::v1::PaginationResponse;

#[derive(FromRow)]
struct AlbumRow {
    id: Uuid,
    name: String,
    description: String,
    transition_effect: String,
    slide_duration_seconds: i32,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

#[derive(Clone)]
pub struct AlbumPhotoServiceImpl { pub pool: PgPool }

impl AlbumPhotoServiceImpl {
    pub fn new(pool: PgPool) -> Self { Self { pool } }
}

#[derive(FromRow)]
struct AlbumPhotoRow {
    id: Uuid,
    album_id: Uuid,
    media_item_id: Uuid,
    position: i32,
    promo_badge: Option<String>,
    price_tag: String,
    created_at: chrono::DateTime<chrono::Utc>,
    media_name: String,
    original_filename: String,
    file_path: String,
    public_url: String,
    file_size_bytes: i64,
    mime_type: String,
    sha256_hash: String,
    media_type: String,
    width: i32,
    height: i32,
    duration_seconds: i32,
    thumbnail_url: Option<String>,
    media_created_at: chrono::DateTime<chrono::Utc>,
    media_updated_at: chrono::DateTime<chrono::Utc>,
}

pub struct AlbumServiceImpl {
    pub pool: PgPool,
}

impl AlbumServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }

    async fn fetch_album_detail(&self, id: Uuid) -> Result<AlbumDetail, Status> {
        let album = sqlx::query_as::<_, AlbumRow>(
            "SELECT id, name, description, transition_effect, slide_duration_seconds, created_at, updated_at FROM components_albums WHERE id = $1"
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .ok_or_else(|| Status::not_found("Album not found"))?;

        let photos = sqlx::query_as::<_, AlbumPhotoRow>(
            r#"
            SELECT p.id, p.album_id, p.media_item_id, p.position, p.promo_badge, p.price_tag, p.created_at,
                   m.name AS media_name, m.original_filename, m.file_path, m.public_url, m.file_size_bytes,
                   m.mime_type, m.sha256_hash, m.media_type, m.width, m.height, m.duration_seconds,
                   m.thumbnail_url, m.created_at AS media_created_at, m.updated_at AS media_updated_at
            FROM components_album_photos p
            JOIN studio_media_items m ON m.id = p.media_item_id
            WHERE p.album_id = $1
            ORDER BY p.position ASC, p.created_at ASC
            "#
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?
        .into_iter()
        .map(|p| {
            let media_type = match p.media_type.to_lowercase().as_str() {
                "image" => crate::grpc::proto::studio::v1::media::MediaType::Image as i32,
                "video" => crate::grpc::proto::studio::v1::media::MediaType::Video as i32,
                "web" => crate::grpc::proto::studio::v1::media::MediaType::Web as i32,
                "audio" => crate::grpc::proto::studio::v1::media::MediaType::Audio as i32,
                _ => crate::grpc::proto::studio::v1::media::MediaType::Unspecified as i32,
            };
            AlbumPhoto {
                id: p.id.to_string(),
                album_id: p.album_id.to_string(),
                media_item_id: p.media_item_id.to_string(),
                order_index: p.position,
                caption: p.promo_badge.unwrap_or_default(),
                duration_seconds: album.slide_duration_seconds,
                created_at: p.created_at.to_rfc3339(),
                media_item: Some(crate::grpc::proto::studio::v1::media::MediaItem {
                    id: p.media_item_id.to_string(),
                    name: p.media_name,
                    original_filename: p.original_filename,
                    file_path: p.file_path,
                    public_url: p.public_url,
                    file_size_bytes: p.file_size_bytes,
                    mime_type: p.mime_type,
                    sha256_hash: p.sha256_hash,
                    media_type,
                    width: p.width,
                    height: p.height,
                    duration_seconds: p.duration_seconds,
                    thumbnail_url: p.thumbnail_url.unwrap_or_default(),
                    created_at: p.media_created_at.to_rfc3339(),
                    updated_at: p.media_updated_at.to_rfc3339(),
                }),
                price_tag: p.price_tag,
            }
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
        if req.name.trim().is_empty() {
            return Err(Status::invalid_argument("Album name is required"));
        }
        let album_id = Uuid::new_v4();
        let transition = if req.transition_effect.is_empty() { "ken-burns".to_string() } else { req.transition_effect };
        let slide_duration = if req.slide_duration_seconds > 0 { req.slide_duration_seconds } else { 5 };
        let mut tx = self.pool.begin().await.map_err(|e| Status::internal(e.to_string()))?;

        sqlx::query(
            r#"
            INSERT INTO components_albums (id, name, description, transition_effect, slide_duration_seconds)
            VALUES ($1, $2, $3, $4, $5)
            "#
        )
        .bind(album_id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&transition)
        .bind(slide_duration)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        for p in req.photos {
            let media_id = Uuid::from_str(&p.media_item_id)
                .map_err(|_| Status::invalid_argument("Invalid media_item_id"))?;
            sqlx::query(
                r#"
                INSERT INTO components_album_photos (id, album_id, media_item_id, position, promo_badge, price_tag)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#
            )
            .bind(Uuid::new_v4())
            .bind(album_id)
            .bind(media_id)
            .bind(p.order_index)
            .bind(&p.caption)
            .bind(&p.price_tag)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| Status::internal(e.to_string()))?;
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

        let rows = sqlx::query_as::<_, (Uuid,)>(
            "SELECT id FROM components_albums WHERE name ILIKE $1 ORDER BY created_at DESC LIMIT 50"
        )
        .bind(&search)
        .fetch_all(&self.pool)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;

        let mut items = Vec::new();
        for r in rows {
            items.push(self.fetch_album_detail(r.0).await?);
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

        let mut tx = self.pool.begin().await.map_err(|e| Status::internal(e.to_string()))?;
        let result = sqlx::query(
            r#"
            UPDATE components_albums
            SET name = COALESCE(NULLIF($2, ''), name),
                description = COALESCE(NULLIF($3, ''), description),
                transition_effect = COALESCE(NULLIF($4, ''), transition_effect),
                slide_duration_seconds = CASE WHEN $5 > 0 THEN $5 ELSE slide_duration_seconds END,
                updated_at = NOW()
            WHERE id = $1
            "#
        )
        .bind(id)
        .bind(&req.name)
        .bind(&req.description)
        .bind(&req.transition_effect)
        .bind(req.slide_duration_seconds)
        .execute(&mut *tx)
        .await
        .map_err(|e| Status::internal(e.to_string()))?;
        if result.rows_affected() == 0 {
            return Err(Status::not_found("Album not found"));
        }

        sqlx::query("DELETE FROM components_album_photos WHERE album_id = $1")
            .bind(id)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;

        for p in req.photos {
            let media_id = Uuid::from_str(&p.media_item_id)
                .map_err(|_| Status::invalid_argument("Invalid media_item_id"))?;
            sqlx::query(
                r#"
                INSERT INTO components_album_photos (id, album_id, media_item_id, position, promo_badge, price_tag)
                VALUES ($1, $2, $3, $4, $5, $6)
                "#
            )
            .bind(Uuid::new_v4())
            .bind(id)
            .bind(media_id)
            .bind(p.order_index)
            .bind(&p.caption)
            .bind(&p.price_tag)
            .execute(&mut *tx)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        }

        tx.commit().await.map_err(|e| Status::internal(e.to_string()))?;
        self.fetch_album_detail(id).await.map(Response::new)
    }

    async fn delete_album(
        &self,
        request: Request<DeleteAlbumRequest>,
    ) -> Result<Response<DeleteAlbumResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM components_albums WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteAlbumResponse { success: true }))
    }
}

#[tonic::async_trait]
impl AlbumPhotoServiceTrait for AlbumPhotoServiceImpl {
    async fn add_album_photo(
        &self,
        request: Request<AddAlbumPhotoRequest>,
    ) -> Result<Response<AlbumPhoto>, Status> {
        let req = request.into_inner();
        let album_id = Uuid::from_str(&req.album_id).map_err(|_| Status::invalid_argument("Invalid album_id"))?;
        let media_id = Uuid::from_str(&req.media_item_id).map_err(|_| Status::invalid_argument("Invalid media_item_id"))?;
        let pid = Uuid::new_v4();

        sqlx::query(
            r#"
            INSERT INTO components_album_photos (id, album_id, media_item_id, position, promo_badge, price_tag)
            VALUES ($1, $2, $3, $4, $5, $6)
            "#
        )
        .bind(pid)
        .bind(album_id)
        .bind(media_id)
        .bind(req.order_index)
        .bind(&req.caption)
        .bind(&req.price_tag)
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
            price_tag: req.price_tag,
        }))
    }

    async fn delete_album_photo(
        &self,
        request: Request<DeleteAlbumPhotoRequest>,
    ) -> Result<Response<DeleteAlbumPhotoResponse>, Status> {
        let id = Uuid::from_str(&request.into_inner().id).map_err(|_| Status::invalid_argument("Invalid id"))?;
        sqlx::query("DELETE FROM components_album_photos WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(e.to_string()))?;
        Ok(Response::new(DeleteAlbumPhotoResponse { success: true }))
    }
}
