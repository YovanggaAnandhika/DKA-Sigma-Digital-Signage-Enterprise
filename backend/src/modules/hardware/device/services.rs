use super::model::{
    DeviceEntity, HeartbeatDto, PairDeviceDto, PairDeviceResultDto, RegisterDeviceDto,
    UpdateDeviceDto,
};
use super::repositories::DeviceRepository;
use crate::common::AppError;
use crate::db::DbPool;
use rand::Rng;
use sha2::{Digest, Sha256};
use uuid::Uuid;

pub struct DeviceService;

impl DeviceService {
    pub async fn register_device(
        pool: &DbPool,
        dto: RegisterDeviceDto,
    ) -> Result<(DeviceEntity, bool, Option<String>, String), AppError> {
        let code = Self::generate_pairing_code();
        let (device, is_paired, token_opt) = DeviceRepository::register(pool, dto, code.clone()).await?;
        Ok((device, is_paired, token_opt, code))
    }

    pub async fn pair_device(
        pool: &DbPool,
        dto: PairDeviceDto,
    ) -> Result<PairDeviceResultDto, AppError> {
        let device = DeviceRepository::find_by_id(pool, dto.device_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Device not found".into()))?;

        let raw_token = Uuid::new_v4().to_string();
        let mut hasher = Sha256::new();
        hasher.update(raw_token.as_bytes());
        let token_hash = format!("{:x}", hasher.finalize());

        let paired_device = DeviceRepository::pair_device(
            pool,
            device.id,
            dto.device_name.as_deref(),
            &raw_token,
            &token_hash,
            dto.default_layout_id,
            dto.canary_group_id,
        )
        .await?;

        Ok(PairDeviceResultDto {
            device: paired_device,
            device_token: raw_token,
        })
    }

    pub async fn get_pairing_status(
        pool: &DbPool,
        device_id_str: Option<&str>,
        code: Option<&str>,
    ) -> Result<Option<(Uuid, String, Option<String>)>, AppError> {
        if let Some(dev_id_str) = device_id_str {
            if let Ok(dev_id) = Uuid::parse_str(dev_id_str) {
                let status = DeviceRepository::get_pairing_status_by_device_id(pool, dev_id).await?;
                if status.is_some() {
                    return Ok(status);
                }
            }
        }
        if let Some(c) = code {
            if !c.trim().is_empty() {
                let status = DeviceRepository::get_pairing_status(pool, c).await?;
                return Ok(status);
            }
        }
        Ok(None)
    }

    pub async fn process_heartbeat(pool: &DbPool, dto: HeartbeatDto) -> Result<bool, AppError> {
        let device = DeviceRepository::find_by_id(pool, dto.device_id)
            .await?
            .ok_or_else(|| AppError::NotFound("Device not found".into()))?;

        let mut hasher = Sha256::new();
        hasher.update(dto.device_token.as_bytes());
        let computed_hash = format!("{:x}", hasher.finalize());

        if let Some(expected_hash) = &device.device_token_hash {
            if expected_hash != &computed_hash {
                return Err(AppError::Unauthorized("Invalid device token".into()));
            }
        } else {
            return Err(AppError::Unauthorized("Device not paired yet".into()));
        }

        DeviceRepository::update_heartbeat(pool, &dto).await?;
        Ok(true)
    }

    pub async fn get_device_by_id(pool: &DbPool, id: Uuid) -> Result<DeviceEntity, AppError> {
        DeviceRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("Device {} not found", id)))
    }

    pub async fn list_devices(pool: &DbPool) -> Result<Vec<DeviceEntity>, AppError> {
        let devices = DeviceRepository::find_all(pool).await?;
        Ok(devices)
    }

    pub async fn update_device(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateDeviceDto,
    ) -> Result<DeviceEntity, AppError> {
        let device = DeviceRepository::update(pool, id, dto).await?;
        Ok(device)
    }

    pub async fn delete_device(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = DeviceRepository::delete(pool, id).await?;
        Ok(deleted)
    }

    fn generate_pairing_code() -> String {
        let chars = b"ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
        let mut rng = rand::thread_rng();
        let part1: String = (0..3)
            .map(|_| chars[rng.gen_range(0..chars.len())] as char)
            .collect();
        let part2: String = (0..3)
            .map(|_| chars[rng.gen_range(0..chars.len())] as char)
            .collect();
        format!("{}-{}", part1, part2)
    }
}
