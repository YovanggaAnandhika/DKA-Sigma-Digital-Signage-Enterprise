use std::collections::HashSet;
use std::str::FromStr;
use std::time::Duration;

use rumqttc::{AsyncClient, Event, MqttOptions, Packet, QoS};
use sqlx::{FromRow, PgPool};
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::iot::v1::device::{
    iot_device_service_server::IotDeviceService as IotDeviceServiceTrait, ApproveIotDeviceRequest,
    DeleteIotDeviceRequest, DeleteIotDeviceResponse, GetIotDeviceTelemetryRequest, IotDevice,
    IotDeviceTelemetry, IotDeviceTelemetryRecord, IotPinMapping, ListIotDevicesRequest,
    ListIotDevicesResponse, TriggerIotActionRequest, TriggerIotActionResponse,
    UpdateIotDeviceRequest,
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

async fn request_pairing_reset(device_uid: &str) -> Result<(), Status> {
    let host =
        std::env::var("MQTT_HOST").unwrap_or_else(|_| "dka-product-sigma-mqtt".into());
    let port = std::env::var("MQTT_PORT")
        .ok()
        .and_then(|value| value.parse::<u16>().ok())
        .unwrap_or(1883);
    let request_id = Uuid::new_v4().to_string();
    let reset_topic = format!("dka/iot/{device_uid}/reset_ack");
    let command_topic = format!("dka/iot/{device_uid}/command");
    let mut options = MqttOptions::new(
        format!("dka-reset-{}", Uuid::new_v4()),
        host,
        port,
    );
    options.set_keep_alive(Duration::from_secs(10));
    options.set_clean_session(true);
    if let (Ok(username), Ok(password)) = (
        std::env::var("MQTT_USERNAME"),
        std::env::var("MQTT_PASSWORD"),
    ) {
        if !username.is_empty() && !password.is_empty() {
            options.set_credentials(username, password);
        }
    }
    let (client, mut eventloop) = AsyncClient::new(options, 10);
    client
        .subscribe(&reset_topic, QoS::AtLeastOnce)
        .await
        .map_err(|error| {
            tracing::error!("Failed to subscribe for IoT reset confirmation: {error}");
            Status::unavailable("Could not request reset confirmation from IoT device")
        })?;

    let expected_request_id = request_id.clone();
    let result = tokio::time::timeout(Duration::from_secs(35), async {
        let mut command_sent = false;
        loop {
            match eventloop.poll().await.map_err(|error| {
                tracing::error!("MQTT connection failed during IoT reset: {error}");
                Status::unavailable("Could not reach IoT device over MQTT")
            })? {
                Event::Incoming(Packet::SubAck(_)) if !command_sent => {
                    let payload = serde_json::json!({
                        "command": "RESET_PAIRING",
                        "request_id": expected_request_id,
                    })
                    .to_string();
                    client
                        .publish(
                            &command_topic,
                            QoS::AtLeastOnce,
                            false,
                            payload.into_bytes(),
                        )
                        .await
                        .map_err(|error| {
                            tracing::error!("Failed to publish IoT reset command: {error}");
                            Status::unavailable("Could not send reset command to IoT device")
                        })?;
                    command_sent = true;
                }
                Event::Incoming(Packet::Publish(packet))
                    if command_sent && packet.topic == reset_topic =>
                {
                    let response: serde_json::Value =
                        serde_json::from_slice(&packet.payload).map_err(|error| {
                            tracing::warn!("Invalid IoT reset acknowledgement: {error}");
                            Status::data_loss("IoT device sent an invalid reset acknowledgement")
                        })?;
                    if response.get("request_id").and_then(|value| value.as_str())
                        != Some(expected_request_id.as_str())
                    {
                        continue;
                    }
                    return match response.get("status").and_then(|value| value.as_str()) {
                        Some("OK") => Ok(()),
                        Some(_) => Err(Status::failed_precondition(
                            "IoT device rejected the pairing reset",
                        )),
                        None => Err(Status::data_loss(
                            "IoT device reset acknowledgement has no status",
                        )),
                    };
                }
                _ => {}
            }
        }
    })
    .await
    .map_err(|_| Status::deadline_exceeded("Timed out waiting for IoT reset confirmation"))?;

    if let Err(error) = client.disconnect().await {
        tracing::warn!("Failed to disconnect temporary MQTT reset client: {error}");
    }
    result
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

#[derive(FromRow)]
struct IotDeviceTelemetryDeviceRow {
    id: Uuid,
    device_uid: String,
    device_name: String,
    ip_address: Option<String>,
    firmware_version: Option<String>,
    last_seen_at: Option<chrono::DateTime<chrono::Utc>>,
    last_action: Option<String>,
}

#[derive(FromRow)]
struct IotDeviceTelemetryRecordRow {
    id: Uuid,
    record_type: String,
    ip_address: Option<String>,
    rssi: Option<i32>,
    firmware_version: Option<String>,
    uptime_ms: Option<i64>,
    pin: Option<i32>,
    button_event: Option<String>,
    action: Option<String>,
    status: Option<String>,
    message: Option<String>,
    recorded_at: chrono::DateTime<chrono::Utc>,
}

impl IotDeviceTelemetryRecordRow {
    fn into_proto(self) -> IotDeviceTelemetryRecord {
        IotDeviceTelemetryRecord {
            id: self.id.to_string(),
            record_type: self.record_type,
            ip_address: self.ip_address.unwrap_or_default(),
            rssi: self.rssi.unwrap_or_default(),
            has_rssi: self.rssi.is_some(),
            firmware_version: self.firmware_version.unwrap_or_default(),
            uptime_ms: self.uptime_ms.unwrap_or_default(),
            has_uptime: self.uptime_ms.is_some(),
            pin: self.pin.unwrap_or_default(),
            has_pin: self.pin.is_some(),
            event: self.button_event.unwrap_or_default(),
            action: self.action.unwrap_or_default(),
            status: self.status.unwrap_or_default(),
            message: self.message.unwrap_or_default(),
            recorded_at: self.recorded_at.to_rfc3339(),
        }
    }
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
                    pin: i32::try_from(mapping.get("pin")?.as_i64()?).ok()?,
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

#[tonic::async_trait]
impl IotDeviceServiceTrait for IotDeviceServiceImpl {
    async fn get_device_telemetry(
        &self,
        request: Request<GetIotDeviceTelemetryRequest>,
    ) -> Result<Response<IotDeviceTelemetry>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let id = Uuid::from_str(&request.into_inner().id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;
        let row = sqlx::query_as::<_, IotDeviceTelemetryDeviceRow>(
            "SELECT id, device_uid, name AS device_name, ip_address, firmware_version, \
             last_seen_at, last_action \
             FROM iot_devices WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?
        .ok_or_else(|| Status::not_found("IoT device not found"))?;

        let latest_telemetry = sqlx::query_as::<_, IotDeviceTelemetryRecordRow>(
            "SELECT id, record_type, ip_address, rssi, firmware_version, uptime_ms, pin, \
             button_event, action, status, message, recorded_at \
             FROM iot_device_telemetry WHERE iot_device_id = $1 AND record_type = 'TELEMETRY' \
             ORDER BY recorded_at DESC, id DESC LIMIT 1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?;

        let latest_button = sqlx::query_as::<_, IotDeviceTelemetryRecordRow>(
            "SELECT id, record_type, ip_address, rssi, firmware_version, uptime_ms, pin, \
             button_event, action, status, message, recorded_at \
             FROM iot_device_telemetry WHERE iot_device_id = $1 AND record_type = 'BUTTON' \
             ORDER BY recorded_at DESC, id DESC LIMIT 1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?;

        // shortcut: the RPC returns only the latest 100 records; add range-based pagination when historical charting needs older data.
        let history = sqlx::query_as::<_, IotDeviceTelemetryRecordRow>(
            "SELECT id, record_type, ip_address, rssi, firmware_version, uptime_ms, pin, \
             button_event, action, status, message, recorded_at \
             FROM iot_device_telemetry WHERE iot_device_id = $1 \
             ORDER BY recorded_at DESC, id DESC LIMIT 100",
        )
        .bind(id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_error)?;

        let rssi = latest_telemetry.as_ref().and_then(|record| record.rssi);
        let uptime_ms = latest_telemetry
            .as_ref()
            .and_then(|record| record.uptime_ms);
        let last_pin = latest_button.as_ref().and_then(|record| record.pin);
        let last_event = latest_button
            .as_ref()
            .and_then(|record| record.button_event.clone());
        let last_event_at = latest_button.map(|record| record.recorded_at.to_rfc3339());

        Ok(Response::new(IotDeviceTelemetry {
            id: row.id.to_string(),
            device_uid: row.device_uid,
            device_name: row.device_name,
            ip_address: row.ip_address.unwrap_or_default(),
            rssi: rssi.unwrap_or_default(),
            has_rssi: rssi.is_some(),
            firmware_version: row.firmware_version.unwrap_or_default(),
            uptime_ms: uptime_ms.unwrap_or_default(),
            has_uptime: uptime_ms.is_some(),
            last_seen_at: row
                .last_seen_at
                .map(|time| time.to_rfc3339())
                .unwrap_or_default(),
            last_pin: last_pin.unwrap_or_default(),
            has_last_pin: last_pin.is_some(),
            last_event: last_event.unwrap_or_default(),
            last_event_at: last_event_at.unwrap_or_default(),
            last_action: row.last_action.unwrap_or_default(),
            history: history
                .into_iter()
                .map(IotDeviceTelemetryRecordRow::into_proto)
                .collect(),
        }))
    }

    async fn list_devices(
        &self,
        request: Request<ListIotDevicesRequest>,
    ) -> Result<Response<ListIotDevicesResponse>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let corp_id = claims.active_corporation_id().and_then(|s| Uuid::from_str(s).ok());
        let rows = if let Some(cid) = corp_id {
            sqlx::query_as::<_, IotDeviceRow>(
                "SELECT id, device_uid, name, device_role, pin_mappings, is_active, is_approved, \
                 ip_address, firmware_version, last_seen_at, last_action, created_at, updated_at \
                 FROM iot_devices WHERE corporation_id = $1 OR corporation_id IS NULL \
                 ORDER BY is_approved, last_seen_at DESC NULLS LAST",
            )
            .bind(cid)
            .fetch_all(&self.pool)
            .await
            .map_err(db_error)?
        } else {
            sqlx::query_as::<_, IotDeviceRow>(
                "SELECT id, device_uid, name, device_role, pin_mappings, is_active, is_approved, \
                 ip_address, firmware_version, last_seen_at, last_action, created_at, updated_at \
                 FROM iot_devices ORDER BY is_approved, last_seen_at DESC NULLS LAST",
            )
            .fetch_all(&self.pool)
            .await
            .map_err(db_error)?
        };

        Ok(Response::new(ListIotDevicesResponse {
            items: rows.into_iter().map(IotDeviceRow::into_proto).collect(),
        }))
    }

    async fn approve_device(
        &self,
        request: Request<ApproveIotDeviceRequest>,
    ) -> Result<Response<IotDevice>, Status> {
        let claims = crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let corp_id = claims.active_corporation_id().and_then(|s| Uuid::from_str(s).ok());
        let branch_id = claims.branch_id.as_deref().and_then(|s| Uuid::from_str(s).ok());
        let user_id = Uuid::from_str(&claims.sub).ok();

        let req = request.into_inner();
        let id = Uuid::from_str(&req.id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;

        let verification_code = req.verification_code.trim().to_uppercase();
        if verification_code.is_empty() {
            return Err(Status::invalid_argument("Kode verifikasi 6-digit fisik MAC Address wajib dimasukkan"));
        }

        let dev: Option<(String,)> = sqlx::query_as("SELECT device_uid FROM iot_devices WHERE id = $1")
            .bind(id)
            .fetch_optional(&self.pool)
            .await
            .map_err(db_error)?;
        let device_uid = dev.ok_or_else(|| Status::not_found("IoT device not found"))?.0;

        let clean_uid = device_uid.replace([':', '-', ' '], "").to_uppercase();
        let clean_code = verification_code.replace([':', '-', ' '], "").to_uppercase();
        if clean_code.len() < 4 || !clean_uid.ends_with(&clean_code) {
            return Err(Status::invalid_argument("Kode verifikasi fisik MAC Address tidak cocok dengan perangkat"));
        }

        let default_mappings = default_pin_mappings();
        let row = sqlx::query_as::<_, IotDeviceRow>(
            "UPDATE iot_devices SET is_approved = true, is_active = true, \
             corporation_id = COALESCE($3, corporation_id), \
             branch_id = COALESCE($4, branch_id), \
             created_by_user_id = COALESCE($5, created_by_user_id), \
             pin_mappings = CASE WHEN pin_mappings = '[]'::jsonb THEN $2 ELSE pin_mappings END, \
             updated_at = NOW() \
             WHERE id = $1 RETURNING id, device_uid, name, device_role, pin_mappings, is_active, \
             is_approved, ip_address, firmware_version, last_seen_at, last_action, created_at, updated_at",
        )
        .bind(id)
        .bind(default_mappings)
        .bind(corp_id)
        .bind(branch_id)
        .bind(user_id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?
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
        validate_mappings(&req.pin_mappings)?;
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
        .map_err(|error| {
            tracing::error!("Failed to serialize IoT pin mappings: {error}");
            Status::internal("Internal error")
        })?;

        let row = sqlx::query_as::<_, IotDeviceRow>(
            "UPDATE iot_devices SET name = $2, device_role = $3, pin_mappings = $4, \
             is_active = $5, updated_at = NOW() WHERE id = $1 RETURNING id, device_uid, name, \
             device_role, pin_mappings, is_active, is_approved, ip_address, firmware_version, \
             last_seen_at, last_action, created_at, updated_at",
        )
        .bind(id)
        .bind(req.name.trim())
        .bind(req.device_role)
        .bind(pin_mappings)
        .bind(req.is_active)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?
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
        let device_uid = sqlx::query_scalar::<_, String>(
            "SELECT device_uid FROM iot_devices WHERE id = $1",
        )
        .bind(id)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?
        .ok_or_else(|| Status::not_found("IoT device not found"))?;

        request_pairing_reset(&device_uid).await?;

        sqlx::query("DELETE FROM iot_devices WHERE id = $1")
            .bind(id)
            .execute(&self.pool)
            .await
            .map_err(db_error)?;

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

fn db_error(error: sqlx::Error) -> Status {
    tracing::error!("IoT device database operation failed: {error}");
    Status::internal("Internal error")
}

fn default_pin_mappings() -> serde_json::Value {
    serde_json::json!([
        { "pin": 13, "action": "CALL_NEXT", "enabled": true, "label": "Panggil berikutnya" },
        { "pin": 12, "action": "RECALL", "enabled": true, "label": "Panggil ulang" },
        { "pin": 14, "action": "TOGGLE_BREAK", "enabled": true, "label": "Istirahat loket" },
        { "pin": 27, "action": "TOGGLE_CLOSE", "enabled": true, "label": "Tutup loket" },
        { "pin": 26, "action": "CALL_PREV", "enabled": true, "label": "Panggilan sebelumnya" }
    ])
}

fn validate_mappings(mappings: &[IotPinMapping]) -> Result<(), Status> {
    let mut pins = HashSet::with_capacity(mappings.len());
    for mapping in mappings {
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
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::{default_pin_mappings, validate_mappings};
    use crate::grpc::proto::iot::v1::device::IotPinMapping;

    fn mapping(pin: i32, action: &str) -> IotPinMapping {
        IotPinMapping {
            pin,
            action: action.to_string(),
            enabled: true,
            label: String::new(),
        }
    }

    #[test]
    fn pin_mappings_require_supported_unique_nonnegative_pins() {
        assert!(validate_mappings(&[mapping(13, "CALL_NEXT"), mapping(14, "TOGGLE_BREAK")]).is_ok());
        assert!(validate_mappings(&[mapping(-1, "CALL_NEXT")]).is_err());
        assert!(validate_mappings(&[mapping(13, "CALL_NEXT"), mapping(13, "RECALL")]).is_err());
        assert!(validate_mappings(&[mapping(13, "UNKNOWN")]).is_err());
    }

    #[test]
    fn approval_defaults_match_firmware_button_pins() {
        let defaults = default_pin_mappings();
        let mappings = defaults.as_array().unwrap();
        let pins = mappings
            .iter()
            .map(|mapping| mapping["pin"].as_i64().unwrap() as i32)
            .collect::<Vec<_>>();
        let actions = mappings
            .iter()
            .map(|mapping| mapping["action"].as_str().unwrap())
            .collect::<Vec<_>>();

        assert_eq!(pins, [13, 12, 14, 27, 26]);
        assert_eq!(
            actions,
            ["CALL_NEXT", "RECALL", "TOGGLE_BREAK", "TOGGLE_CLOSE", "CALL_PREV"]
        );
        assert!(mappings.iter().all(|mapping| mapping["enabled"] == true));
    }
}
