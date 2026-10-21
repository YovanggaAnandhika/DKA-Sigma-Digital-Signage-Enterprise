use super::model::{DeviceEntity, HeartbeatDto, RegisterDeviceDto, UpdateDeviceDto};
use crate::db::DbPool;
use uuid::Uuid;

pub struct DeviceRepository;

impl DeviceRepository {
    pub async fn find_by_hardware_fingerprint(
        pool: &DbPool,
        fingerprint: &str,
    ) -> Result<Option<DeviceEntity>, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>(
            "SELECT * FROM hardware_devices WHERE hardware_fingerprint = $1"
        )
        .bind(fingerprint)
        .fetch_optional(pool)
        .await?;

        Ok(device)
    }

    pub async fn register(
        pool: &DbPool,
        dto: RegisterDeviceDto,
        pairing_code: String,
    ) -> Result<(DeviceEntity, bool, Option<String>), sqlx::Error> {
        let mut tx = pool.begin().await?;

        // 1. Cek apakah ada hardware_fingerprint yang sudah terdaftar
        if let Some(fingerprint) = &dto.hardware_fingerprint {
            if !fingerprint.trim().is_empty() {
                let existing = sqlx::query_as::<_, DeviceEntity>(
                    "SELECT * FROM hardware_devices WHERE hardware_fingerprint = $1"
                )
                .bind(fingerprint)
                .fetch_optional(&mut *tx)
                .await?;

                if let Some(dev) = existing {
                    // Update info jaringan & layar terkini
                    let updated = sqlx::query_as::<_, DeviceEntity>(
                        r#"
                        UPDATE hardware_devices
                        SET 
                            name = COALESCE($2, name),
                            mac_address = COALESCE($3, mac_address),
                            ip_address = COALESCE($4, ip_address),
                            app_version = COALESCE($5, app_version),
                            android_version = COALESCE($6, android_version),
                            screen_width = COALESCE($7, screen_width),
                            screen_height = COALESCE($8, screen_height),
                            orientation = COALESCE($9, orientation),
                            updated_at = NOW()
                        WHERE id = $1
                        RETURNING *
                        "#,
                    )
                    .bind(dev.id)
                    .bind(dto.name)
                    .bind(dto.mac_address)
                    .bind(dto.ip_address)
                    .bind(dto.app_version)
                    .bind(dto.android_version)
                    .bind(dto.screen_width)
                    .bind(dto.screen_height)
                    .bind(dto.orientation)
                    .fetch_one(&mut *tx)
                    .await?;

                    // Jika device sudah pernah dipair, ambil token aktif
                    let mut active_token: Option<String> = None;
                    if updated.is_paired {
                        let token_row = sqlx::query_scalar::<_, Option<String>>(
                            r#"
                            SELECT device_token
                            FROM hardware_device_pairings
                            WHERE device_id = $1 AND status = 'paired' AND device_token IS NOT NULL
                            ORDER BY created_at DESC
                            LIMIT 1
                            "#,
                        )
                        .bind(updated.id)
                        .fetch_optional(&mut *tx)
                        .await?
                        .flatten();
                        active_token = token_row;
                    } else {
                        // Belum dipair, buatkan pairing pending
                        sqlx::query(
                            r#"
                            INSERT INTO hardware_device_pairings (device_id, pairing_code, status, expires_at)
                            VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 minutes')
                            "#,
                        )
                        .bind(updated.id)
                        .bind(&pairing_code)
                        .execute(&mut *tx)
                        .await?;
                    }

                    tx.commit().await?;
                    return Ok((updated, dev.is_paired, active_token));
                }
            }
        }

        // Perangkat baru belum pernah terdaftar
        let device = sqlx::query_as::<_, DeviceEntity>(
            r#"
            INSERT INTO hardware_devices (
                name, is_paired, screen_width, screen_height,
                orientation, timezone, mac_address, ip_address,
                hardware_fingerprint, app_version, android_version
            )
            VALUES ($1, FALSE, $2, $3, $4, 'UTC', $5, $6, $7, $8, $9)
            RETURNING *
            "#,
        )
        .bind(dto.name.unwrap_or_else(|| "Android Display".to_string()))
        .bind(dto.screen_width.unwrap_or(1920))
        .bind(dto.screen_height.unwrap_or(1080))
        .bind(dto.orientation.unwrap_or_else(|| "landscape".to_string()))
        .bind(dto.mac_address)
        .bind(dto.ip_address)
        .bind(dto.hardware_fingerprint)
        .bind(dto.app_version)
        .bind(dto.android_version)
        .fetch_one(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO hardware_device_pairings (device_id, pairing_code, status, expires_at)
            VALUES ($1, $2, 'pending', NOW() + INTERVAL '30 minutes')
            "#,
        )
        .bind(device.id)
        .bind(&pairing_code)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok((device, false, None))
    }

    pub async fn find_by_id(pool: &DbPool, id: Uuid) -> Result<Option<DeviceEntity>, sqlx::Error> {
        let device = sqlx::query_as::<_, DeviceEntity>("SELECT * FROM hardware_devices WHERE id = $1")
            .bind(id)
            .fetch_optional(pool)
            .await?;

        Ok(device)
    }

    pub async fn find_pending_pairing(
        pool: &DbPool,
        code: &str,
    ) -> Result<Option<(DeviceEntity, Uuid)>, sqlx::Error> {
        let record = sqlx::query_as::<_, (Uuid, Uuid)>(
            r#"
            SELECT p.id, p.device_id
            FROM hardware_device_pairings p
            WHERE p.pairing_code = $1 AND p.status = 'pending' AND p.expires_at > NOW()
            ORDER BY p.created_at DESC
            LIMIT 1
            "#,
        )
        .bind(code)
        .fetch_optional(pool)
        .await?;

        if let Some((pairing_id, device_id)) = record {
            if let Some(device) = Self::find_by_id(pool, device_id).await? {
                return Ok(Some((device, pairing_id)));
            }
        }

        Ok(None)
    }

    pub async fn pair_device(
        pool: &DbPool,
        device_id: Uuid,
        name: Option<&str>,
        raw_token: &str,
        token_hash: &str,
        default_layout_id: Option<Uuid>,
        canary_group_id: Option<Uuid>,
    ) -> Result<DeviceEntity, sqlx::Error> {
        let mut tx = pool.begin().await?;

        let device = sqlx::query_as::<_, DeviceEntity>(
            r#"
            UPDATE hardware_devices
            SET 
                name = COALESCE($2, name),
                is_paired = TRUE,
                device_token_hash = $3,
                current_layout_id = COALESCE($4, current_layout_id),
                canary_group_id = COALESCE($5, canary_group_id),
                updated_at = NOW()
            WHERE id = $1
            RETURNING *
            "#,
        )
        .bind(device_id)
        .bind(name)
        .bind(token_hash)
        .bind(default_layout_id)
        .bind(canary_group_id)
        .fetch_one(&mut *tx)
        .await?;

        sqlx::query(
            r#"
            INSERT INTO hardware_device_pairings (device_id, pairing_code, status, paired_at, device_token)
            VALUES ($1, 'APPROVED', 'paired', NOW(), $2)
            "#,
        )
        .bind(device_id)
        .bind(raw_token)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;

        Ok(device)
    }

    pub async fn get_pairing_status_by_device_id(
        pool: &DbPool,
        device_id: Uuid,
    ) -> Result<Option<(Uuid, String, Option<String>)>, sqlx::Error> {
        let dev = sqlx::query_as::<_, (Uuid, bool)>(
            "SELECT id, is_paired FROM hardware_devices WHERE id = $1"
        )
        .bind(device_id)
        .fetch_optional(pool)
        .await?;

        if let Some((id, is_paired)) = dev {
            let status = if is_paired { "paired".to_string() } else { "pending".to_string() };
            let token = if is_paired {
                sqlx::query_scalar::<_, Option<String>>(
                    r#"
                    SELECT device_token
                    FROM hardware_device_pairings
                    WHERE device_id = $1 AND status = 'paired' AND device_token IS NOT NULL
                    ORDER BY created_at DESC
                    LIMIT 1
                    "#,
                )
                .bind(id)
                .fetch_optional(pool)
                .await?
                .flatten()
            } else {
                None
            };
            return Ok(Some((id, status, token)));
        }

        Ok(None)
    }

    pub async fn get_pairing_status(
        pool: &DbPool,
        code: &str,
    ) -> Result<Option<(Uuid, String, Option<String>)>, sqlx::Error> {
        let record = sqlx::query_as::<_, (Uuid, String, Option<String>)>(
            r#"
            SELECT device_id, status, device_token
            FROM hardware_device_pairings
            WHERE pairing_code = $1
            ORDER BY created_at DESC
            LIMIT 1
            "#,
        )
        .bind(code)
        .fetch_optional(pool)
        .await?;

        Ok(record)
    }

    pub async fn update_heartbeat(
        pool: &DbPool,
        dto: &HeartbeatDto,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;

        sqlx::query(
            r#"
            UPDATE hardware_devices
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
            INSERT INTO hardware_device_telemetry (
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
            "SELECT * FROM hardware_devices ORDER BY is_online DESC, name ASC",
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
        let sleep_time = dto.sleep_time.as_ref().and_then(|s| {
            chrono::NaiveTime::parse_from_str(s, "%H:%M:%S")
                .ok()
                .or_else(|| chrono::NaiveTime::parse_from_str(s, "%H:%M").ok())
        });
        let wake_time = dto.wake_time.as_ref().and_then(|s| {
            chrono::NaiveTime::parse_from_str(s, "%H:%M:%S")
                .ok()
                .or_else(|| chrono::NaiveTime::parse_from_str(s, "%H:%M").ok())
        });

        let device = sqlx::query_as::<_, DeviceEntity>(
            r#"
            UPDATE hardware_devices
            SET 
                name = COALESCE($2, name),
                screen_width = COALESCE($3, screen_width),
                screen_height = COALESCE($4, screen_height),
                orientation = COALESCE($5, orientation),
                current_layout_id = COALESCE($6, current_layout_id),
                canary_group_id = COALESCE($7, canary_group_id),
                display_group_id = COALESCE($8, display_group_id),
                schedule_id = COALESCE($9, schedule_id),
                timezone = COALESCE($10, timezone),
                sleep_time = COALESCE($11, sleep_time),
                wake_time = COALESCE($12, wake_time),
                power_schedule_enabled = COALESCE($13, power_schedule_enabled),
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
        .bind(dto.display_group_id)
        .bind(dto.schedule_id)
        .bind(dto.timezone)
        .bind(sleep_time)
        .bind(wake_time)
        .bind(dto.power_schedule_enabled)
        .fetch_one(pool)
        .await?;

        Ok(device)
    }

    pub async fn delete(pool: &DbPool, id: Uuid) -> Result<bool, sqlx::Error> {
        let result = sqlx::query("DELETE FROM hardware_devices WHERE id = $1")
            .bind(id)
            .execute(pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
}
