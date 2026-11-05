use std::str::FromStr;

use sqlx::{FromRow, PgPool};
use tonic::{Request, Response, Status};
use uuid::Uuid;

use crate::grpc::proto::components::v1::queue::iot_binding::{
    queue_iot_binding_service_server::QueueIotBindingService as QueueIotBindingServiceTrait,
    BindIotDeviceRequest, ListQueueIotBindingsRequest, ListQueueIotBindingsResponse,
    QueueIotBinding, UnbindIotDeviceRequest, UnbindIotDeviceResponse,
};

pub struct QueueIotBindingServiceImpl {
    pool: PgPool,
}

impl QueueIotBindingServiceImpl {
    pub fn new(pool: PgPool) -> Self {
        Self { pool }
    }
}

#[derive(FromRow)]
struct BindingRow {
    id: Uuid,
    device_uid: String,
    name: String,
    device_role: String,
    is_active: bool,
    is_bound: bool,
    counter_id: Option<Uuid>,
    counter_name: Option<String>,
}

impl BindingRow {
    fn into_proto(self) -> QueueIotBinding {
        QueueIotBinding {
            iot_device_id: self.id.to_string(),
            device_uid: self.device_uid,
            device_name: self.name,
            device_role: self.device_role,
            counter_id: self.counter_id.map(|id| id.to_string()).unwrap_or_default(),
            counter_name: self.counter_name.unwrap_or_default(),
            is_active: self.is_active,
            is_bound: self.is_bound,
        }
    }
}

#[tonic::async_trait]
impl QueueIotBindingServiceTrait for QueueIotBindingServiceImpl {
    async fn list_bindings(
        &self,
        request: Request<ListQueueIotBindingsRequest>,
    ) -> Result<Response<ListQueueIotBindingsResponse>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let queue_id = Uuid::from_str(&request.into_inner().queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let rows = sqlx::query_as::<_, BindingRow>(
            r#"
            SELECT d.id, d.device_uid, d.name, d.device_role, d.is_active,
                   (b.iot_device_id IS NOT NULL) AS is_bound,
                   b.counter_id, c.counter_name
            FROM iot_devices d
            LEFT JOIN components_queue_iot_bindings b
                ON b.iot_device_id = d.id AND b.queue_display_id = $1
            LEFT JOIN components_queue_counters c ON c.id = b.counter_id
            WHERE d.is_approved = true
            ORDER BY d.name, d.device_uid
            "#,
        )
        .bind(queue_id)
        .fetch_all(&self.pool)
        .await
        .map_err(|error| Status::internal(error.to_string()))?;

        Ok(Response::new(ListQueueIotBindingsResponse {
            items: rows.into_iter().map(BindingRow::into_proto).collect(),
        }))
    }

    async fn bind_device(
        &self,
        request: Request<BindIotDeviceRequest>,
    ) -> Result<Response<QueueIotBinding>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let queue_id = Uuid::from_str(&req.queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let device_id = Uuid::from_str(&req.iot_device_id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;
        let counter_id = req
            .counter_id
            .filter(|value| !value.is_empty())
            .map(|value| Uuid::from_str(&value))
            .transpose()
            .map_err(|_| Status::invalid_argument("Invalid counter_id"))?;

        let mut transaction = self
            .pool
            .begin()
            .await
            .map_err(|error| Status::internal(error.to_string()))?;
        let queue_exists = sqlx::query_scalar::<_, bool>(
            "SELECT EXISTS(SELECT 1 FROM components_queue_displays WHERE id = $1)",
        )
        .bind(queue_id)
        .fetch_one(&mut *transaction)
        .await
        .map_err(|error| Status::internal(error.to_string()))?;
        if !queue_exists {
            return Err(Status::not_found("Queue not found"));
        }
        let approved = sqlx::query_scalar::<_, bool>(
            "SELECT is_approved FROM iot_devices WHERE id = $1 FOR UPDATE",
        )
        .bind(device_id)
        .fetch_optional(&mut *transaction)
        .await
        .map_err(|error| Status::internal(error.to_string()))?
        .ok_or_else(|| Status::not_found("IoT device not found"))?;
        if !approved {
            return Err(Status::failed_precondition("IoT device must be approved before binding"));
        }

        if let Some(counter_id) = counter_id {
            let belongs_to_queue = sqlx::query_scalar::<_, bool>(
                "SELECT EXISTS(SELECT 1 FROM components_queue_counters WHERE id = $1 AND queue_display_id = $2)",
            )
            .bind(counter_id)
            .bind(queue_id)
            .fetch_one(&mut *transaction)
            .await
            .map_err(|error| Status::internal(error.to_string()))?;
            if !belongs_to_queue {
                return Err(Status::invalid_argument("Counter does not belong to this queue"));
            }
        }

        sqlx::query(
            r#"
            INSERT INTO components_queue_iot_bindings (iot_device_id, queue_display_id, counter_id)
            VALUES ($1, $2, $3)
            ON CONFLICT (iot_device_id, queue_display_id)
            DO UPDATE SET counter_id = EXCLUDED.counter_id
            "#,
        )
        .bind(device_id)
        .bind(queue_id)
        .bind(counter_id)
        .execute(&mut *transaction)
        .await
        .map_err(|error| Status::internal(error.to_string()))?;
        transaction
            .commit()
            .await
            .map_err(|error| Status::internal(error.to_string()))?;

        let row = sqlx::query_as::<_, BindingRow>(
            r#"
            SELECT d.id, d.device_uid, d.name, d.device_role, d.is_active, true AS is_bound,
                   b.counter_id, c.counter_name
            FROM iot_devices d
            JOIN components_queue_iot_bindings b
                ON b.iot_device_id = d.id AND b.queue_display_id = $2
            LEFT JOIN components_queue_counters c ON c.id = b.counter_id
            WHERE d.id = $1
            "#,
        )
        .bind(device_id)
        .bind(queue_id)
        .fetch_one(&self.pool)
        .await
        .map_err(|error| Status::internal(error.to_string()))?;
        Ok(Response::new(row.into_proto()))
    }

    async fn unbind_device(
        &self,
        request: Request<UnbindIotDeviceRequest>,
    ) -> Result<Response<UnbindIotDeviceResponse>, Status> {
        crate::grpc::middleware::require_permission(&request, "can_manage_devices")?;
        let req = request.into_inner();
        let queue_id = Uuid::from_str(&req.queue_display_id)
            .map_err(|_| Status::invalid_argument("Invalid queue_display_id"))?;
        let device_id = Uuid::from_str(&req.iot_device_id)
            .map_err(|_| Status::invalid_argument("Invalid IoT device id"))?;
        let result = sqlx::query(
            "DELETE FROM components_queue_iot_bindings WHERE iot_device_id = $1 AND queue_display_id = $2",
        )
        .bind(device_id)
        .bind(queue_id)
        .execute(&self.pool)
        .await
        .map_err(|error| Status::internal(error.to_string()))?;

        Ok(Response::new(UnbindIotDeviceResponse {
            success: result.rows_affected() > 0,
        }))
    }
}
