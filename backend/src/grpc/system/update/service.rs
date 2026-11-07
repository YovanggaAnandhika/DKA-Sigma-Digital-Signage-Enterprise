use chrono::{DateTime, Utc};
use sqlx::{FromRow, PgPool};
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::system::v1::update::{
    app_update_service_server::AppUpdateService, AppRelease, CheckDeviceAppUpdateRequest,
    CheckDeviceAppUpdateResponse, CreateAppReleaseRequest, DeleteAppReleaseRequest,
    DeleteAppReleaseResponse, GetLatestReleaseRequest, ListAppReleasesRequest,
    ListAppReleasesResponse, ToggleAppReleaseActiveRequest,
};

#[derive(Clone)]
pub struct AppUpdateServiceImpl {
    pool: PgPool,
}

impl AppUpdateServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct AppReleaseRow {
    id: Uuid,
    version_code: i32,
    version_name: String,
    apk_file_url: String,
    file_size_bytes: i64,
    sha256_hash: String,
    release_notes: Option<String>,
    is_force_update: bool,
    min_supported_version_code: Option<i32>,
    is_active: bool,
    created_at: DateTime<Utc>,
}

impl AppReleaseRow {
    fn into_proto(self) -> AppRelease {
        AppRelease {
            id: self.id.to_string(),
            version_code: self.version_code,
            version_name: self.version_name,
            apk_file_url: self.apk_file_url,
            file_size_bytes: self.file_size_bytes,
            sha256_hash: self.sha256_hash,
            release_notes: self.release_notes.unwrap_or_default(),
            is_force_update: self.is_force_update,
            min_supported_version_code: self.min_supported_version_code.unwrap_or(1),
            is_active: self.is_active,
            created_at: self.created_at.to_rfc3339(),
        }
    }
}

#[tonic::async_trait]
impl AppUpdateService for AppUpdateServiceImpl {
    async fn get_latest_app_release(
        &self,
        _request: Request<GetLatestReleaseRequest>,
    ) -> Result<Response<AppRelease>, Status> {
        let row = sqlx::query_as::<_, AppReleaseRow>(
            "SELECT id, version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, \
             release_notes, is_force_update, min_supported_version_code, is_active, created_at \
             FROM system_apk_releases WHERE is_active = true \
             ORDER BY version_code DESC LIMIT 1",
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Database query failed: {}", e)))?;

        match row {
            Some(release) => Ok(Response::new(release.into_proto())),
            None => Err(Status::not_found("No active APK release found")),
        }
    }

    async fn list_app_releases(
        &self,
        request: Request<ListAppReleasesRequest>,
    ) -> Result<Response<ListAppReleasesResponse>, Status> {
        let req = request.into_inner();
        let page = if req.page <= 0 { 1 } else { req.page };
        let page_size = if req.page_size <= 0 { 20 } else { req.page_size };
        let offset = (page - 1) * page_size;
        let only_active = req.only_active.unwrap_or(false);

        let (rows, total) = if only_active {
            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM system_apk_releases WHERE is_active = true",
            )
            .fetch_one(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Failed to count releases: {}", e)))?;

            let rows = sqlx::query_as::<_, AppReleaseRow>(
                "SELECT id, version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, \
                 release_notes, is_force_update, min_supported_version_code, is_active, created_at \
                 FROM system_apk_releases WHERE is_active = true \
                 ORDER BY version_code DESC LIMIT $1 OFFSET $2",
            )
            .bind(page_size as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Failed to fetch releases: {}", e)))?;

            (rows, total.0 as i32)
        } else {
            let total: (i64,) = sqlx::query_as(
                "SELECT COUNT(*) FROM system_apk_releases",
            )
            .fetch_one(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Failed to count releases: {}", e)))?;

            let rows = sqlx::query_as::<_, AppReleaseRow>(
                "SELECT id, version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, \
                 release_notes, is_force_update, min_supported_version_code, is_active, created_at \
                 FROM system_apk_releases \
                 ORDER BY version_code DESC LIMIT $1 OFFSET $2",
            )
            .bind(page_size as i64)
            .bind(offset as i64)
            .fetch_all(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Failed to fetch releases: {}", e)))?;

            (rows, total.0 as i32)
        };

        Ok(Response::new(ListAppReleasesResponse {
            items: rows.into_iter().map(AppReleaseRow::into_proto).collect(),
            total,
            page,
            page_size,
        }))
    }

    async fn create_app_release(
        &self,
        request: Request<CreateAppReleaseRequest>,
    ) -> Result<Response<AppRelease>, Status> {
        let req = request.into_inner();

        if req.version_code <= 0 {
            return Err(Status::invalid_argument("version_code must be positive"));
        }
        if req.version_name.trim().is_empty() {
            return Err(Status::invalid_argument("version_name cannot be empty"));
        }
        if req.apk_file_url.trim().is_empty() {
            return Err(Status::invalid_argument("apk_file_url cannot be empty"));
        }
        if req.sha256_hash.trim().is_empty() {
            return Err(Status::invalid_argument("sha256_hash cannot be empty"));
        }

        let row = sqlx::query_as::<_, AppReleaseRow>(
            "INSERT INTO system_apk_releases \
             (version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, release_notes, is_force_update, min_supported_version_code, is_active) \
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true) \
             RETURNING id, version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, release_notes, is_force_update, min_supported_version_code, is_active, created_at",
        )
        .bind(req.version_code)
        .bind(req.version_name)
        .bind(req.apk_file_url)
        .bind(req.file_size_bytes)
        .bind(req.sha256_hash)
        .bind(if req.release_notes.trim().is_empty() { None } else { Some(req.release_notes) })
        .bind(req.is_force_update)
        .bind(if req.min_supported_version_code <= 0 { 1 } else { req.min_supported_version_code })
        .fetch_one(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Failed to create release: {}", e)))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn delete_app_release(
        &self,
        request: Request<DeleteAppReleaseRequest>,
    ) -> Result<Response<DeleteAppReleaseResponse>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid UUID format"))?;

        let result = sqlx::query("DELETE FROM system_apk_releases WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|e| Status::internal(format!("Failed to delete release: {}", e)))?;

        Ok(Response::new(DeleteAppReleaseResponse {
            success: result.rows_affected() > 0,
        }))
    }

    async fn toggle_app_release_active(
        &self,
        request: Request<ToggleAppReleaseActiveRequest>,
    ) -> Result<Response<AppRelease>, Status> {
        let req = request.into_inner();
        let id = Uuid::parse_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid UUID format"))?;

        let row = sqlx::query_as::<_, AppReleaseRow>(
            "UPDATE system_apk_releases SET is_active = $2 \
             WHERE id = $1 \
             RETURNING id, version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, release_notes, is_force_update, min_supported_version_code, is_active, created_at",
        )
        .bind(id)
        .bind(req.is_active)
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Failed to update release: {}", e)))?;

        match row {
            Some(release) => Ok(Response::new(release.into_proto())),
            None => Err(Status::not_found("Release not found")),
        }
    }

    async fn check_device_app_update(
        &self,
        request: Request<CheckDeviceAppUpdateRequest>,
    ) -> Result<Response<CheckDeviceAppUpdateResponse>, Status> {
        let req = request.into_inner();

        let row = sqlx::query_as::<_, AppReleaseRow>(
            "SELECT id, version_code, version_name, apk_file_url, file_size_bytes, sha256_hash, \
             release_notes, is_force_update, min_supported_version_code, is_active, created_at \
             FROM system_apk_releases WHERE is_active = true \
             ORDER BY version_code DESC LIMIT 1",
        )
        .fetch_optional(&self.pool)
        .await
        .map_err(|e| Status::internal(format!("Database query failed: {}", e)))?;

        match row {
            Some(latest) => {
                let update_available = latest.version_code > req.current_version_code;
                let min_version = latest.min_supported_version_code.unwrap_or(1);
                let is_force = latest.is_force_update || req.current_version_code < min_version;

                Ok(Response::new(CheckDeviceAppUpdateResponse {
                    update_available,
                    latest_release: Some(latest.into_proto()),
                    is_force_update: is_force,
                }))
            }
            None => Ok(Response::new(CheckDeviceAppUpdateResponse {
                update_available: false,
                latest_release: None,
                is_force_update: false,
            })),
        }
    }
}

