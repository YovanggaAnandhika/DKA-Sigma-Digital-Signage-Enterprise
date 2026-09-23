use tonic::{Request, Response, Status};
use uuid::Uuid;
use tokio::io::AsyncWriteExt;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncSeekExt;
use std::io::SeekFrom;
use tokio_stream::wrappers::ReceiverStream;
use sha2::{Sha256, Digest};
use crate::db::DbPool;
use crate::modules::studio::media::model::{CreateMediaDto, MediaEntity, UpdateMediaDto};
use crate::modules::studio::media::services::MediaService;
use crate::grpc::proto::studio::v1::media::{
    media_service_server::MediaService as MediaServiceTrait,
    MediaItem, CreateMediaRequest, GetMediaRequest,
    ListMediaRequest, ListMediaResponse, UpdateMediaRequest,
    DeleteMediaRequest, DeleteMediaResponse,
    UploadMediaChunkRequest, UploadMediaChunkResponse,
    GetMediaFileRequest, GetMediaFileResponse,
    StreamMediaFileRequest, StreamMediaFileResponse,
    FinalizeUploadRequest, CancelUploadRequest, CancelUploadResponse,
};

pub struct MediaServiceImpl {
    pub pool: DbPool,
}

impl MediaServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        Self { pool }
    }

    fn map_media_entity(m: MediaEntity) -> MediaItem {
        let media_type = match m.media_type.to_lowercase().as_str() {
            "image" => crate::grpc::proto::studio::v1::media::MediaType::Image as i32,
            "video" => crate::grpc::proto::studio::v1::media::MediaType::Video as i32,
            "web" => crate::grpc::proto::studio::v1::media::MediaType::Web as i32,
            _ => crate::grpc::proto::studio::v1::media::MediaType::Unspecified as i32,
        };

        MediaItem {
            id: m.id.to_string(),
            name: m.name,
            original_filename: m.original_filename,
            file_path: m.file_path,
            public_url: m.public_url,
            file_size_bytes: m.file_size_bytes,
            mime_type: m.mime_type,
            sha256_hash: m.sha256_hash,
            media_type,
            width: m.width,
            height: m.height,
            duration_seconds: m.duration_seconds,
            thumbnail_url: m.thumbnail_url.unwrap_or_default(),
            created_at: m.created_at.to_rfc3339(),
            updated_at: m.updated_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl MediaServiceTrait for MediaServiceImpl {
    async fn create_media(
        &self,
        request: Request<CreateMediaRequest>,
    ) -> Result<Response<MediaItem>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_media")?;
        let req = request.into_inner();

        let media_type_str = match req.media_type() {
            crate::grpc::proto::studio::v1::media::MediaType::Image => "image".to_string(),
            crate::grpc::proto::studio::v1::media::MediaType::Video => "video".to_string(),
            crate::grpc::proto::studio::v1::media::MediaType::Web => "web".to_string(),
            _ => "image".to_string(),
        };

        let dto = CreateMediaDto {
            name: req.name,
            original_filename: req.original_filename,
            file_path: req.file_path,
            public_url: req.public_url,
            file_size_bytes: req.file_size_bytes,
            mime_type: req.mime_type,
            sha256_hash: req.sha256_hash,
            media_type: media_type_str,
            width: if req.width > 0 { Some(req.width) } else { None },
            height: if req.height > 0 { Some(req.height) } else { None },
            duration_seconds: if req.duration_seconds > 0 { Some(req.duration_seconds) } else { None },
            thumbnail_url: if req.thumbnail_url.is_empty() { None } else { Some(req.thumbnail_url) },
        };

        let media = MediaService::create_media(&self.pool, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_media_entity(media)))
    }

    async fn get_media(
        &self,
        request: Request<GetMediaRequest>,
    ) -> Result<Response<MediaItem>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_media")?;
        let req = request.into_inner();
        let media_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Media tidak valid"))?;

        let media = MediaService::get_media_by_id(&self.pool, media_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_media_entity(media)))
    }

    async fn list_media(
        &self,
        request: Request<ListMediaRequest>,
    ) -> Result<Response<ListMediaResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_view_media")?;
        let media_list = MediaService::list_media(&self.pool)
            .await
            .map_err(Status::from)?;

        let items = media_list.into_iter().map(Self::map_media_entity).collect();

        Ok(Response::new(ListMediaResponse {
            items,
            pagination: None,
        }))
    }

    async fn update_media(
        &self,
        request: Request<UpdateMediaRequest>,
    ) -> Result<Response<MediaItem>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_media")?;
        let req = request.into_inner();
        let media_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Media tidak valid"))?;

        let dto = UpdateMediaDto {
            name: if req.name.is_empty() { None } else { Some(req.name) },
            duration_seconds: if req.duration_seconds > 0 { Some(req.duration_seconds) } else { None },
        };

        let media = MediaService::update_media(&self.pool, media_id, dto)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(Self::map_media_entity(media)))
    }

    async fn delete_media(
        &self,
        request: Request<DeleteMediaRequest>,
    ) -> Result<Response<DeleteMediaResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_media")?;
        let req = request.into_inner();
        let media_id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("ID Media tidak valid"))?;

        let success = MediaService::delete_media(&self.pool, media_id)
            .await
            .map_err(Status::from)?;

        Ok(Response::new(DeleteMediaResponse { success }))
    }

    async fn upload_media_chunk(
        &self,
        request: Request<UploadMediaChunkRequest>,
    ) -> Result<Response<UploadMediaChunkResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_media")?;
        let req = request.into_inner();

        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
        tokio::fs::create_dir_all(&upload_dir)
            .await
            .map_err(|e| Status::internal(format!("Gagal membuat direktori upload: {}", e)))?;

        let upload_id = if req.upload_id.is_empty() {
            Uuid::new_v4().to_string()
        } else {
            req.upload_id
        };

        let temp_filename = format!(".part_{}", upload_id);
        let temp_path = std::path::Path::new(&upload_dir).join(&temp_filename);

        let mut file = tokio::fs::OpenOptions::new()
            .create(true)
            .write(true)
            .open(&temp_path)
            .await
            .map_err(|e| Status::internal(format!("Gagal membuka file temp chunk: {}", e)))?;

        file.seek(SeekFrom::Start(req.chunk_offset as u64))
            .await
            .map_err(|e| Status::internal(format!("Gagal seek ke offset file: {}", e)))?;

        file.write_all(&req.chunk_data)
            .await
            .map_err(|e| Status::internal(format!("Gagal menulis data chunk: {}", e)))?;

        file.flush()
            .await
            .map_err(|e| Status::internal(format!("Gagal flush file: {}", e)))?;

        Ok(Response::new(UploadMediaChunkResponse {
            success: true,
            upload_id,
            chunk_index: req.chunk_index,
            is_completed: false,
            file_path: String::new(),
            public_url: String::new(),
            sha256_hash: String::new(),
            file_size_bytes: 0,
            error_message: String::new(),
        }))
    }

    async fn finalize_upload(
        &self,
        request: Request<FinalizeUploadRequest>,
    ) -> Result<Response<UploadMediaChunkResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_media")?;
        let req = request.into_inner();

        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
        let temp_filename = format!(".part_{}", req.upload_id);
        let temp_path = std::path::Path::new(&upload_dir).join(&temp_filename);

        if !temp_path.exists() {
            return Err(Status::not_found("File sementara tidak ditemukan"));
        }

        let full_bytes = tokio::fs::read(&temp_path)
            .await
            .map_err(|e| Status::internal(format!("Gagal membaca file lengkap: {}", e)))?;

        let mut hasher = Sha256::new();
        hasher.update(&full_bytes);
        let sha256_hash = format!("{:x}", hasher.finalize());

        let clean_name = req.original_filename.replace(|c: char| !c.is_alphanumeric() && c != '.' && c != '_' && c != '-', "_");
        let final_filename = format!("{}_{}", chrono::Utc::now().timestamp_millis(), clean_name);
        let final_path = std::path::Path::new(&upload_dir).join(&final_filename);

        tokio::fs::rename(&temp_path, &final_path)
            .await
            .map_err(|e| Status::internal(format!("Gagal memindahkan file upload: {}", e)))?;

        let file_size_bytes = full_bytes.len() as i64;
        let public_url = format!("/api/assets/{}", final_filename);
        let file_path = format!("/storage/media/{}", final_filename);

        Ok(Response::new(UploadMediaChunkResponse {
            success: true,
            upload_id: req.upload_id,
            chunk_index: -1,
            is_completed: true,
            file_path,
            public_url,
            sha256_hash,
            file_size_bytes,
            error_message: String::new(),
        }))
    }

    async fn cancel_upload(
        &self,
        request: Request<CancelUploadRequest>,
    ) -> Result<Response<CancelUploadResponse>, Status> {
        let _claims = crate::grpc::middleware::require_permission(&request, "can_manage_media")?;
        let req = request.into_inner();

        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
        let temp_filename = format!(".part_{}", req.upload_id);
        let temp_path = std::path::Path::new(&upload_dir).join(&temp_filename);

        if temp_path.exists() {
            let _ = tokio::fs::remove_file(&temp_path).await;
        }

        Ok(Response::new(CancelUploadResponse { success: true }))
    }

    async fn get_media_file(
        &self,
        request: Request<GetMediaFileRequest>,
    ) -> Result<Response<GetMediaFileResponse>, Status> {
        let req = request.into_inner();
        let filename = req.filename;
        let clean_filename = std::path::Path::new(&filename)
            .file_name()
            .and_then(|f| f.to_str())
            .ok_or_else(|| Status::invalid_argument("Nama file tidak valid"))?;

        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
        let file_path = std::path::Path::new(&upload_dir).join(clean_filename);

        if !file_path.exists() {
            return Err(Status::not_found(format!("File {} tidak ditemukan di backend", clean_filename)));
        }

        let file_data = tokio::fs::read(&file_path)
            .await
            .map_err(|e| Status::internal(format!("Gagal membaca file: {}", e)))?;

        let ext = std::path::Path::new(clean_filename)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let mime_type = match ext.as_str() {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            "gif" => "image/gif",
            "svg" => "image/svg+xml",
            "mp4" => "video/mp4",
            "webm" => "video/webm",
            _ => "application/octet-stream",
        }.to_string();

        Ok(Response::new(GetMediaFileResponse {
            success: true,
            filename: clean_filename.to_string(),
            mime_type,
            file_data,
            error_message: String::new(),
        }))
    }

    type StreamMediaFileStream = ReceiverStream<Result<StreamMediaFileResponse, Status>>;

    async fn stream_media_file(
        &self,
        request: Request<StreamMediaFileRequest>,
    ) -> Result<Response<Self::StreamMediaFileStream>, Status> {
        let req = request.into_inner();
        let filename = req.filename;
        let start_byte = req.start_byte.max(0) as u64;
        let end_byte_req = req.end_byte; // -1 means stream to end

        let clean_filename = std::path::Path::new(&filename)
            .file_name()
            .and_then(|f| f.to_str())
            .ok_or_else(|| Status::invalid_argument("Nama file tidak valid"))?;

        let upload_dir = std::env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string());
        let file_path = std::path::Path::new(&upload_dir).join(clean_filename);

        if !file_path.exists() {
            return Err(Status::not_found(format!("File {} tidak ditemukan di backend", clean_filename)));
        }

        let ext = std::path::Path::new(clean_filename)
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let mime_type = match ext.as_str() {
            "jpg" | "jpeg" => "image/jpeg",
            "png" => "image/png",
            "webp" => "image/webp",
            "gif" => "image/gif",
            "svg" => "image/svg+xml",
            "mp4" => "video/mp4",
            "webm" => "video/webm",
            _ => "application/octet-stream",
        }.to_string();

        let metadata = tokio::fs::metadata(&file_path)
            .await
            .map_err(|e| Status::internal(format!("Gagal membaca metadata file: {}", e)))?;
        let total_size = metadata.len() as i64;

        // Resolve end byte: -1 means "to end of file"
        let end_byte: u64 = if end_byte_req < 0 {
            metadata.len().saturating_sub(1)
        } else {
            (end_byte_req as u64).min(metadata.len().saturating_sub(1))
        };

        if start_byte > end_byte {
            return Err(Status::invalid_argument("start_byte lebih besar dari end_byte"));
        }

        let bytes_to_send = end_byte - start_byte + 1;

        let mut file = tokio::fs::File::open(&file_path)
            .await
            .map_err(|e| Status::internal(format!("Gagal membuka file: {}", e)))?;

        // Seek to start position for range requests
        if start_byte > 0 {
            file.seek(SeekFrom::Start(start_byte))
                .await
                .map_err(|e| Status::internal(format!("Gagal seek ke byte {}: {}", start_byte, e)))?;
        }

        let (tx, rx) = tokio::sync::mpsc::channel(8);
        let chunk_size: u64 = 256 * 1024; // 256KB chunks for smoother buffering

        tokio::spawn(async move {
            let mut is_first = true;
            let mut bytes_remaining = bytes_to_send;

            while bytes_remaining > 0 {
                let to_read = chunk_size.min(bytes_remaining) as usize;
                let mut buffer = vec![0u8; to_read];

                match file.read(&mut buffer).await {
                    Ok(0) => break, // EOF
                    Ok(n) => {
                        buffer.truncate(n);
                        bytes_remaining = bytes_remaining.saturating_sub(n as u64);

                        let response = StreamMediaFileResponse {
                            chunk_data: buffer,
                            mime_type: if is_first { mime_type.clone() } else { String::new() },
                            total_size: if is_first { total_size } else { 0 },
                            error_message: String::new(),
                        };
                        is_first = false;

                        if tx.send(Ok(response)).await.is_err() {
                            break; // Client disconnected
                        }
                    }
                    Err(e) => {
                        let _ = tx.send(Err(Status::internal(format!("Error membaca file: {}", e)))).await;
                        break;
                    }
                }
            }
        });

        Ok(Response::new(ReceiverStream::new(rx)))
    }
}


