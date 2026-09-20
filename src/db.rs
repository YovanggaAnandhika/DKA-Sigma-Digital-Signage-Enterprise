use sqlx::postgres::PgPool;
use std::time::Duration;
use tracing::info;

pub type DbPool = PgPool;

pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    info!("Connecting to PostgreSQL database...");
    let pool = sqlx::postgres::PgPoolOptions::new()
        .max_connections(25)
        .acquire_timeout(Duration::from_secs(5))
        .connect(database_url)
        .await?;

    info!("Successfully connected to database");
    Ok(pool)
}

pub async fn run_migrations(pool: &DbPool) -> Result<(), sqlx::migrate::MigrateError> {
    info!("Running pending database migrations from ./migrations ...");
    sqlx::migrate!("./migrations").run(pool).await?;
    info!("All database migrations applied successfully");
    Ok(())
}

pub async fn drop_all_tables(pool: &DbPool) -> Result<(), sqlx::Error> {
    info!("Dropping public schema for fresh migration...");
    sqlx::query("DROP SCHEMA IF EXISTS public CASCADE;")
        .execute(pool)
        .await?;
    sqlx::query("CREATE SCHEMA public;")
        .execute(pool)
        .await?;
    sqlx::query("GRANT ALL ON SCHEMA public TO public;")
        .execute(pool)
        .await?;
    info!("Public schema recreated cleanly.");
    Ok(())
}
