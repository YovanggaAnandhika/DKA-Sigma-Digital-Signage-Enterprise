use super::model::ServerCommandMessage;
use crate::db::DbPool;

pub struct StreamRepository;

impl StreamRepository {
    pub async fn log_command(
        pool: &DbPool,
        command: &ServerCommandMessage,
        consumed: bool,
    ) -> Result<(), sqlx::Error> {
        let mut payload = serde_json::to_value(command).unwrap_or_default();
        if consumed {
            if let Some(obj) = payload.as_object_mut() {
                obj.insert("consumed".to_string(), serde_json::Value::Bool(true));
            }
        }

        sqlx::query(
            r#"
            INSERT INTO hardware_device_telemetry (device_id, payload_json)
            VALUES ($1, $2)
            "#,
        )
        .bind(command.device_id)
        .bind(payload)
        .execute(pool)
        .await?;

        Ok(())
    }
}
