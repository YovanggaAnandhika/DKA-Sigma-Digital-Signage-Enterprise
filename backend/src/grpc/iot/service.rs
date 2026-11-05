use std::str::FromStr;
use std::collections::HashSet;

use sqlx::{FromRow, PgPool};
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::iot::v1::device::{
    iot_device_service_server::IotDeviceService as IotDeviceServiceTrait,
    ApproveIotDeviceRequest, DeleteIotDeviceRequest, DeleteIotDeviceResponse, IotDevice,
    IotPinMapping, ListIotDevicesRequest, ListIotDevicesResponse, TriggerIotActionRequest,
    TriggerIotActionResponse, UpdateIotDeviceRequest,
};
use crate::modules::distribution::stream::services::StreamConnectionManager;

#[derive(Clone)]
pub struct IotDeviceServiceImpl {
    pool: PgPool,
    stream_manager: StreamConnectionManager,
}

impl IotDeviceServiceImpl {
    pub fn new(pool: PgPool, stream_manager: StreamConnectionManager) -> Self {
        Self { pool, stream_manager }
    }
}

#[derive(FromRow)]
struct IotDeviceRow {
    id: Uuid,
    device_uid: String,
    name: String,
    device_role: String,
    pin_mappings: serde_json::Value,
    is_active: bool,
    is_approved: bool,
    ip_address: Option<String>,
    firmware_version: Option<String>,
    last_seen_at: Option<chrono::DateTime<chrono::Utc>>,
    last_action: Option<String>,
    created_at: chrono::DateTime<chrono::Utc>,
    updated_at: chrono::DateTime<chrono::Utc>,
}

impl IotDeviceRow {
    fn into_proto(self) -> IotDevice {
        let pin_mappings = self
            .pin_mappings
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(|mapping| {
                Some(IotPinMapping {
                    pin: mapping.get("pin")?.as_i64()? as i32,
                    action: mapping.get("action")?.as_str()?.to_string(),
                    enabled: mapping
                        .get("enabled")
                        .and_then(serde_json::Value::as_bool)
                        .unwrap_or(true),
                    label: mapping
                        .get("label")
                        .and_then(serde_json::Value::as_str)
                        .unwrap_or_default()
                        .to_string(),
                })
            })
            .collect();

        IotDevice {
            id: self.id.to_string(),
            device_uid: self.device_uid,
            name: self.name,
            device_role: self.device_role,
            pin_mappings,
            is_active: self.is_active,
            is_approved: self.is_approved,
            ip_address: self.ip_address.unwrap_or_default(),
            firmware_version: self.firmware_version.unwrap_or_default(),
            last_seen_at: self
                .last_seen_at
                .map(|time| time.to_rfc3339())
                .unwrap_or_default(),
            last_action: self.last_action.unwrap_or_default(),
            created_at: self.created_at.to_rfc3339(),
            updated_at: self.updated_at.to_rfc3339(),
        }
    }
}

const DEVICE_COLUMNS: &str = "
    id, device_uid, name, device_role, pin_mappings, is_active, is_approved,
    ip_address, firmware_version, last_seen_at, last_action, created_at, updated_at
";

#[tonic::async_trait]
impl IotDeviceServiceTrait for IotDeviceServiceImpl {
    async fn list_devices(
        &self,
        request: Request<ListIotDevicesRequest>,
    ) -> Result<Response<ListIotDevicesResponse>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let rows = sqlx::query_as::<_, IotDeviceRow>(&format!(
            "SELECT {DEVICE_COLUMNS} FROM iot_devices ORDER BY is_approved, last_seen_at DESC NULLS LAST"
        ))
        .fetch_all(&self.pool)
        .await
        .map_err(|error| Status::internal(error.to_string()))?;

        Ok(Response::new(ListIotDevicesResponse {
            items: rows.into_iter().map(IotDeviceRow::into_proto).collect(),
        }))
    }

    async fn approve_device(
        &self,
        request: Request<ApproveIotDeviceRequest>,
    ) -> Result<Response<IotDevice>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;
        let row = sqlx::query_as::<_, IotDeviceRow>(&format!(
            "UPDATE iot_devices SET is_approved = true, is_active = true, updated_at = NOW() \
             WHERE id = $1 RETURNING {DEVICE_COLUMNS}"
        ))
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| Status::internal(error.to_string()))?
        .ok_or_else(|| Status::not_found("IoT device not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn update_device(
        &self,
        request: Request<UpdateIotDeviceRequest>,
    ) -> Result<Response<IotDevice>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;
        if req.name.trim().is_empty() {
            return Err(Status::invalid_argument("Device name cannot be empty"));
        }
        let mut pins = HashSet::with_capacity(req.pin_mappings.len());
        for mapping in &req.pin_mappings {
            if mapping.pin < 0 || !pins.insert(mapping.pin) {
                return Err(Status::invalid_argument(
                    "Pin numbers must be non-negative and unique",
                ));
            }
            if !matches!(
                mapping.action.as_str(),
                "CALL_NEXT" | "RECALL" | "CALL_PREV" | "TOGGLE_BREAK" | "TOGGLE_CLOSE" | "ISSUE_TICKET"
            ) {
                return Err(Status::invalid_argument("Unsupported IoT pin action"));
            }
        }
        let pin_mappings = serde_json::to_value(
            req.pin_mappings
                .iter()
                .map(|mapping| {
                    serde_json::json!({
                        "pin": mapping.pin,
                        "action": mapping.action,
                        "enabled": mapping.enabled,
                        "label": mapping.label,
                    })
                })
                .collect::<Vec<_>>(),
        )
        .map_err(|error| Status::internal(error.to_string()))?;

        let row = sqlx::query_as::<_, IotDeviceRow>(&format!(
            "UPDATE iot_devices SET name = $2, device_role = $3, pin_mappings = $4, \
             is_active = $5, updated_at = NOW() WHERE id = $1 RETURNING {DEVICE_COLUMNS}"
        ))
        .bind(id)
        .bind(req.name.trim())
        .bind(req.device_role)
        .bind(pin_mappings)
        .bind(req.is_active)
        .fetch_optional(&self.pool)
        .await
        .map_err(|error| Status::internal(error.to_string()))?
        .ok_or_else(|| Status::not_found("IoT device not found"))?;

        Ok(Response::new(row.into_proto()))
    }

    async fn delete_device(
        &self,
        request: Request<DeleteIotDeviceRequest>,
    ) -> Result<Response<DeleteIotDeviceResponse>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;
        let result = sqlx::query("DELETE FROM iot_devices WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(|error| Status::internal(error.to_string()))?;

        if result.rows_affected() == 0 {
            return Err(Status::not_found("IoT device not found"));
        }
        Ok(Response::new(DeleteIotDeviceResponse { success: true }))
    }

    async fn trigger_action(
        &self,
        request: Request<TriggerIotActionRequest>,
    ) -> Result<Response<TriggerIotActionResponse>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let queue_service = crate::grpc::components::queue::service::QueueServiceImpl::with_stream_manager(
            self.pool.clone(),
            self.stream_manager.clone(),
        );
        let response = queue_service
            .trigger_iot_action(&req.device_uid, req.pin)
            .await?;
        Ok(Response::new(response))
    }
}
