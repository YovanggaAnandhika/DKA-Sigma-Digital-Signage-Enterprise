use crate::db::DbPool;
use uuid::Uuid;

pub struct ManifestRepository;

impl ManifestRepository {
    pub async fn assign_layout_to_device(
        pool: &DbPool,
        device_id: Uuid,
        layout_id: Uuid,
    ) -> Result<(), sqlx::Error> {
        let mut tx = pool.begin().await?;

        // Update primary active layout on devices table
        sqlx::query("UPDATE devices SET current_layout_id = $2, updated_at = NOW() WHERE id = $1")
            .bind(device_id)
            .bind(layout_id)
            .execute(&mut *tx)
            .await?;

        // Record in device_layouts
        sqlx::query(
            r#"
            INSERT INTO device_layouts (device_id, layout_id, is_active)
            VALUES ($1, $2, TRUE)
            ON CONFLICT DO NOTHING
            "#,
        )
        .bind(device_id)
        .bind(layout_id)
        .execute(&mut *tx)
        .await?;

        tx.commit().await?;
        Ok(())
    }

    pub async fn get_active_layout_id(
        pool: &DbPool,
        device_id: Uuid,
    ) -> Result<Option<Uuid>, sqlx::Error> {
        let row = sqlx::query_scalar::<_, Option<Uuid>>(
            "SELECT current_layout_id FROM devices WHERE id = $1",
        )
        .bind(device_id)
        .fetch_optional(pool)
        .await?
        .flatten();

        Ok(row)
    }
}
