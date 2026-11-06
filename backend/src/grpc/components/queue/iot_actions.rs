use sqlx::FromRow;
use tonic::{Request, Status};
use uuid::Uuid;

use super::service::QueueServiceImpl;
use crate::grpc::proto::components::v1::queue::{
    counter::SetCounterStatusRequest,
    ticket::{CallNextTicketRequest, CallPreviousTicketRequest, IssueTicketRequest},
};
use crate::grpc::proto::iot::v1::device::TriggerIotActionResponse;

fn db_error(error: sqlx::Error) -> Status {
    tracing::error!("IoT action database operation failed: {error}");
    Status::internal("Internal error")
}

#[derive(FromRow)]
struct IotQueueTarget {
    queue_display_id: Uuid,
    queue_name: String,
    queue_prefix: String,
    ticket_prefix: Option<String>,
    counter_id: Option<Uuid>,
    counter_name: Option<String>,
}

impl QueueServiceImpl {
    pub async fn trigger_iot_action(
        &self,
        device_uid: &str,
        pin: i32,
    ) -> Result<TriggerIotActionResponse, Status> {
        let device = sqlx::query_as::<_, (Uuid, bool, bool, serde_json::Value)>(
            "SELECT id, is_approved, is_active, pin_mappings FROM iot_devices WHERE device_uid = $1",
        )
        .bind(device_uid)
        .fetch_optional(&self.pool)
        .await
        .map_err(db_error)?;

        let Some((device_id, is_approved, is_active, pin_mappings)) = device else {
            return Ok(TriggerIotActionResponse {
                success: false,
                action: "PENDING_APPROVAL".to_string(),
                message: format!("IoT device {device_uid} is awaiting approval"),
            });
        };
        if !is_approved {
            return Ok(TriggerIotActionResponse {
                success: false,
                action: "PENDING_APPROVAL".to_string(),
                message: "Perangkat IoT belum disetujui".to_string(),
            });
        }
        if !is_active {
            return Ok(TriggerIotActionResponse {
                success: false,
                action: "DISABLED".to_string(),
                message: "Perangkat IoT sedang dinonaktifkan".to_string(),
            });
        }

        let mapping = pin_mappings
            .as_array()
            .into_iter()
            .flatten()
            .find(|mapping| mapping.get("pin").and_then(serde_json::Value::as_i64) == Some(pin as i64));
        let Some(mapping) = mapping else {
            return Ok(TriggerIotActionResponse {
                success: false,
                action: "UNMAPPED".to_string(),
                message: format!("Pin {pin} belum memiliki mapping aksi"),
            });
        };
        if !mapping
            .get("enabled")
            .and_then(serde_json::Value::as_bool)
            .unwrap_or(true)
        {
            return Ok(TriggerIotActionResponse {
                success: false,
                action: mapping_action(mapping),
                message: format!("Pin {pin} dinonaktifkan"),
            });
        }
        let action = mapping_action(mapping);
        let targets = sqlx::query_as::<_, IotQueueTarget>(
            r#"
            SELECT q.id AS queue_display_id, q.name AS queue_name, q.prefix AS queue_prefix,
                   b.ticket_prefix, b.counter_id, c.counter_name
            FROM components_queue_iot_bindings b
            JOIN components_queue_displays q ON q.id = b.queue_display_id
            LEFT JOIN components_queue_counters c ON c.id = b.counter_id
            WHERE b.iot_device_id = $1
            ORDER BY q.name
            "#,
        )
        .bind(device_id)
        .fetch_all(&self.pool)
        .await
        .map_err(db_error)?;

        if targets.is_empty() {
            return Ok(TriggerIotActionResponse {
                success: false,
                action,
                message: "Perangkat IoT belum di-bind ke queue mana pun".to_string(),
            });
        }

        let mut completed = Vec::new();
        let mut failed = Vec::new();
        for target in targets {
            match self.execute_bound_action(&action, pin, &target).await {
                Ok(message) => completed.push(format!("{}: {message}", target.queue_name)),
                Err(error) => failed.push(format!("{}: {}", target.queue_name, error.message())),
            }
        }

        let message = if failed.is_empty() {
            completed.join("; ")
        } else if completed.is_empty() {
            failed.join("; ")
        } else {
            format!("Berhasil: {}. Gagal: {}", completed.join("; "), failed.join("; "))
        };

        sqlx::query(
            "UPDATE iot_devices SET last_seen_at = NOW(), last_action = $2, updated_at = NOW() WHERE id = $1",
        )
        .bind(device_id)
        .bind(&action)
        .execute(&self.pool)
        .await
        .map_err(db_error)?;

        Ok(TriggerIotActionResponse {
            success: failed.is_empty(),
            action,
            message,
        })
    }

    async fn execute_bound_action(
        &self,
        action: &str,
        pin: i32,
        target: &IotQueueTarget,
    ) -> Result<String, Status> {
        let counter_id = target.counter_id.ok_or_else(|| {
            Status::failed_precondition("Pilih loket untuk binding queue ini")
        });
        match action {
            "CALL_NEXT" | "NEXT" => {
                let counter_id = counter_id?;
                let response = crate::grpc::proto::components::v1::queue::ticket::queue_ticket_service_server::QueueTicketService::call_next_ticket(
                    self,
                    Request::new(CallNextTicketRequest {
                        queue_display_id: target.queue_display_id.to_string(),
                        counter_id: counter_id.to_string(),
                    }),
                )
                .await?
                .into_inner();
                let number = response.ticket.map(|ticket| ticket.ticket_number).unwrap_or_default();
                let counter_name = response
                    .counter
                    .map(|counter| counter.counter_name)
                    .or_else(|| target.counter_name.clone())
                    .unwrap_or_default();
                if !number.is_empty() {
                    self.broadcast_queue_call(target.queue_display_id, &number, &counter_name, "next")
                        .await;
                }
                Ok(format!("Panggilan berikutnya: {number}"))
            }
            "CALL_PREV" | "PREV" => {
                let counter_id = counter_id?;
                let response = crate::grpc::proto::components::v1::queue::ticket::queue_ticket_service_server::QueueTicketService::call_previous_ticket(
                    self,
                    Request::new(CallPreviousTicketRequest {
                        queue_display_id: target.queue_display_id.to_string(),
                        counter_id: counter_id.to_string(),
                    }),
                )
                .await?
                .into_inner();
                let number = response.ticket.map(|ticket| ticket.ticket_number).unwrap_or_default();
                let counter_name = response
                    .counter
                    .map(|counter| counter.counter_name)
                    .or_else(|| target.counter_name.clone())
                    .unwrap_or_default();
                if !number.is_empty() {
                    self.broadcast_queue_call(target.queue_display_id, &number, &counter_name, "back")
                        .await;
                }
                Ok(format!("Panggilan sebelumnya: {number}"))
            }
            "RECALL" => {
                let counter_id = counter_id?;
                let row = sqlx::query_as::<_, (Option<String>, String)>(
                    "SELECT current_ticket_number, counter_name FROM components_queue_counters WHERE id = $1",
                )
                .bind(counter_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(db_error)?
                .ok_or_else(|| Status::not_found("Counter not found"))?;
                let number = row.0.unwrap_or_default();
                if number.is_empty() {
                    return Err(Status::failed_precondition("Loket belum memiliki tiket aktif"));
                }
                sqlx::query(
                    "UPDATE components_queue_counters SET last_called_at = NOW(), updated_at = NOW() WHERE id = $1",
                )
                .bind(counter_id)
                .execute(&self.pool)
                .await
                .map_err(db_error)?;
                self.broadcast_queue_call(target.queue_display_id, &number, &row.1, "recall")
                    .await;
                Ok(format!("Panggilan ulang: {number}"))
            }
            "TOGGLE_BREAK" | "TOGGLE_CLOSE" | "CLOSE" | "LOCKED" => {
                let counter_id = counter_id?;
                let (status, counter_name): (String, String) = sqlx::query_as(
                    "SELECT status, counter_name FROM components_queue_counters WHERE id = $1",
                )
                .bind(counter_id)
                .fetch_optional(&self.pool)
                .await
                .map_err(db_error)?
                .ok_or_else(|| Status::not_found("Counter not found"))?;
                let is_break = matches!(action, "TOGGLE_BREAK");
                let next_status = if is_break {
                    if status == "BREAK" { "ACTIVE" } else { "BREAK" }
                } else if status == "LOCKED" {
                    "ACTIVE"
                } else {
                    "LOCKED"
                };
                crate::grpc::proto::components::v1::queue::counter::queue_counter_service_server::QueueCounterService::set_counter_status(
                    self,
                    Request::new(SetCounterStatusRequest {
                        counter_id: counter_id.to_string(),
                        status: next_status.to_string(),
                        status_note: Some(format!("Diubah via IoT (Pin {pin})")),
                    }),
                )
                .await?;
                self.broadcast_counter_status(target.queue_display_id, &counter_name, next_status)
                    .await;
                Ok(format!("Status {counter_name}: {next_status}"))
            }
            "ISSUE_TICKET" | "TICKET" => {
                let ticket = crate::grpc::proto::components::v1::queue::ticket::queue_ticket_service_server::QueueTicketService::issue_ticket(
                    self,
                    Request::new(IssueTicketRequest {
                        queue_display_id: target.queue_display_id.to_string(),
                        prefix: target
                            .ticket_prefix
                            .clone()
                            .unwrap_or_else(|| target.queue_prefix.clone()),
                    }),
                )
                .await?
                .into_inner();
                Ok(format!("Tiket diterbitkan: {}", ticket.ticket_number))
            }
            _ => Err(Status::invalid_argument(format!("Unknown IoT action: {action}"))),
        }
    }
}

fn mapping_action(mapping: &serde_json::Value) -> String {
    mapping
        .get("action")
        .and_then(serde_json::Value::as_str)
        .unwrap_or_default()
        .to_uppercase()
}
