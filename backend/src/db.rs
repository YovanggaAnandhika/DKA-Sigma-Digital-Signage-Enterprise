use sqlx::postgres::PgPool;
use std::time::Duration;
use tracing::{info, warn};

pub type DbPool = PgPool;

/// Create database pool with retry mechanism (max 10 attempts, exponential backoff)
pub async fn create_pool(database_url: &str) -> Result<DbPool, sqlx::Error> {
    const MAX_RETRIES: u32 = 10;
    const INITIAL_BACKOFF_MS: u64 = 500;

    info!("Connecting to PostgreSQL database...");
    
    for attempt in 1..=MAX_RETRIES {
        match sqlx::postgres::PgPoolOptions::new()
            .max_connections(25)
            .acquire_timeout(Duration::from_secs(5))
            .connect(database_url)
            .await
        {
            Ok(pool) => {
                info!("Successfully connected to database on attempt {}/{}", attempt, MAX_RETRIES);
                return Ok(pool);
            }
            Err(e) => {
                if attempt < MAX_RETRIES {
                    let backoff_ms = INITIAL_BACKOFF_MS * 2u64.pow(attempt - 1);
                    warn!(
                        "Failed to connect to database (attempt {}/{}): {}. Retrying in {}ms...",
                        attempt, MAX_RETRIES, e, backoff_ms
                    );
                    tokio::time::sleep(Duration::from_millis(backoff_ms)).await;
                } else {
                    warn!("Failed to connect to database after {} attempts: {}", MAX_RETRIES, e);
                    return Err(e);
                }
            }
        }
    }

    unreachable!()
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

pub async fn revert_migration(pool: &DbPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Checking applied migrations for revert...");
    let rows: Vec<(i64,)> = sqlx::query_as(
        "SELECT version FROM _sqlx_migrations WHERE success = true ORDER BY version ASC",
    )
    .fetch_all(pool)
    .await
    .unwrap_or_default();

    if rows.is_empty() {
        info!("No applied migrations found in _sqlx_migrations to revert.");
        return Ok(());
    }

    let last_version = rows.last().unwrap().0;
    let target = if rows.len() >= 2 {
        rows[rows.len() - 2].0
    } else {
        0
    };

    info!("Reverting migration version {} down to {}...", last_version, target);
    sqlx::migrate!("./migrations").undo(pool, target).await?;
    info!("Migration successfully reverted to version {}", target);
    Ok(())
}
