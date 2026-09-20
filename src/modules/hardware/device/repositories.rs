use super::model::{DeviceEntity, HeartbeatDto, RegisterDeviceDto, UpdateDeviceDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct DeviceRepository;

impl DeviceRepository {
    pub async fn register(
        pool: &DbPool,
        dto: RegisterDeviceDto,
        pairing_code: String,
    ) -> Result<DeviceEntity, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>(
            r#"
            INSERT INTO devices (
                name, pairing_code, is_paired, screen_width, screen_height,
                orientation, mac_address, app_version, android_version
            )
            VALUES ($1, $2, FALSE, $3, $4, $5, $6, $7, $8)
            RETURNING *
            "#,
        )
        .bind("New Display")
        .bind(pairing_code)
        .bind(dto.screen_width.unwrap_or(1920))
        .bind(dto.screen_height.unwrap_or(1080))
        .bind(dto.orientation.unwrap_or_else(|| "landscape".to_string()))
        .bind(dto.mac_address)
        .bind(dto.app_version)
        .bind(dto.android_version)
        .fetch_one(pool)
        .await?;

        Ok(device)
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<DeviceEntity>, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>("SELECT * FROM devices WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        Ok(device)
    }

    pub async fn find_by_pairing_code(
        pool: &DbPool,
        code: &str,
    ) -> Result<Option<DeviceEntity>, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>("SELECT * FROM devices WHERE pairing_code = $1")
            .bind(code)
            .fetch_optional(pool)
            .await?;

        Ok(device)
    }

    pub async fn pair_device(
        pool: &DbPool,
        id: Uuid,
        name: &str,
        token_hash: &str,
        default_layout_id: Option<Uuid>,
        canary_group_id: Option<Uuid>,
    ) -> Result<DeviceEntity, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>(
            r#"
            UPDATE devices
            SET 
                name = $2,
                is_paired = TRUE,
                device_token_hash = $3,
                current_layout_id = COALESCE($4, current_layout_id),
                canary_group_id = COALESCE($5, canary_group_id),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(name)
        .bind(token_hash)
        .bind(default_layout_id)
        .bind(canary_group_id)
        .fetch_one(pool)
        .await?;

        Ok(device)
    }

    pub async fn update_heartbeat(
        pool: &DbPool,
        dto: &HeartbeatDto,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;

        sqlx::query(
            r#"
            UPDATE devices
            SET 
                is_online = TRUE,
                last_heartbeat_at = NOW(),
                storage_free_bytes = COALESCE($2, storage_free_bytes),
                storage_total_bytes = COALESCE($3, storage_total_bytes),
                current_layout_id = COALESCE($4, current_layout_id),
                updated_at = NOW()
            WHERE id = $1
            "#,
        )
        .bind(dto.device_id)
        .bind(dto.storage_free_bytes)
        .bind(dto.storage_total_bytes)
        .bind(dto.active_layout_id)
        .execute(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO device_telemetry (
                device_id, memory_percent, storage_free_bytes, storage_total_bytes,
                current_playing_media_id, active_layout_id
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            "#,
        )
        .bind(dto.device_id)
        .bind(dto.memory_percent)
        .bind(dto.storage_free_bytes)
        .bind(dto.storage_total_bytes)
        .bind(dto.current_playing_media_id)
        .bind(dto.active_layout_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn find_all(pool: &DbPool) -> Result<Vec<DeviceEntity>, sqlx::Error> {
        let devices = sqlx::query_as::<_, DeviceEntity>(
            "SELECT * FROM devices ORDER BY is_online DESC, name ASC",
        )
        .fetch_all(pool)
        .await?;

        Ok(devices)
    }

    pub async fn update(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateDeviceDto,
    ) -> Result<DeviceEntity, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>(
            r#"
            UPDATE devices
            SET 
                name = COALESCE($2, name),
                screen_width = COALESCE($3, screen_width),
                screen_height = COALESCE($4, screen_height),
                orientation = COALESCE($5, orientation),
                current_layout_id = COALESCE($6, current_layout_id),
                canary_group_id = COALESCE($7, canary_group_id),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(id)
        .bind(dto.name)
        .bind(dto.screen_width)
        .bind(dto.screen_height)
        .bind(dto.orientation)
        .bind(dto.current_layout_id)
        .bind(dto.canary_group_id)
        .fetch_one(pool)
        .await?;

        Ok(device)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM devices WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
