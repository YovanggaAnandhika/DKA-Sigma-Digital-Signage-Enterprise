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

        // Update primary active layout on hardware_devices table
        sqlx::query("UPDATE hardware_devices SET current_layout_id = $2, updated_at = NOW() WHERE id = $1")
            .bind(device_id)
            .bind(layout_id)
            .execute(&mut *tx)
            .await?;

        // Record in device_layouts
        sqlx::query(
            r#"
            INSERT INTO hardware_device_layouts (device_id, layout_id, is_active, corporation_id)
            VALUES ($1, $2, TRUE, (SELECT corporation_id FROM hardware_devices WHERE id = $1))
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
}
