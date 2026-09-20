use super::model::ServerCommandMessage;
use crate::db::DbPool;

pub struct StreamRepository;

impl StreamRepository {
    pub async fn log_command(
        pool: &DbPool,
        command: &ServerCommandMessage,
    ) -> Result<(), sqlx::Error> {
        sqlx::query(
            r#"
            INSERT INTO device_telemetry (device_id, payload_json)
            VALUES ($1, $2)
            "#,
        )
        .bind(command.device_id)
        .bind(serde_json::to_value(command).unwrap_or_default())
        .execute(pool)
        .await?;

        Ok(())
    }
}
