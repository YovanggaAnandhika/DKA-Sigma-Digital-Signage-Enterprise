use sqlx::PgPool;
use tracing::info;

use crate::{db, seeders};

pub async fn run_if_requested(
    args: &[String],
    pool: &PgPool,
) -> Result<bool, Box<dyn std::error::Error>> {
    let has_migrate = args.iter().any(|arg| arg == "--migrate");
    let has_migrate_fresh = args.iter().any(|arg| arg == "--migrate:fresh");
    let has_migrate_revert = args.iter().any(|arg| arg == "--migrate:revert");
    let has_seed = args.iter().any(|arg| arg == "--seed");

    if !has_migrate && !has_migrate_fresh && !has_migrate_revert && !has_seed {
        return Ok(false);
    }

    if has_migrate_fresh {
        info!("--migrate:fresh flag detected. Resetting entire database schema...");
        if let Err(error) = db::drop_all_tables(pool).await {
            tracing::error!("Failed to drop database schema: {}", error);
            return Err(error.into());
        }
        info!("Running migrations on fresh schema...");
        if let Err(error) = db::run_migrations(pool).await {
            tracing::error!("Migration failed: {}", error);
            return Err(error.into());
        }
    } else if has_migrate_revert {
        info!("--migrate:revert flag detected. Reverting last migration...");
        if let Err(error) = db::revert_migration(pool).await {
            tracing::error!("Migration revert failed: {}", error);
            return Err(error);
        }
    } else if has_migrate {
        info!("--migrate flag detected. Running migrations...");
        if let Err(error) = db::run_migrations(pool).await {
            tracing::error!("Migration failed: {}", error);
            return Err(error.into());
        }
    }

    if has_seed {
        info!("--seed flag detected. Executing database seeders...");
        if let Err(error) = seeders::seed_database(pool).await {
            tracing::error!("Seeding failed: {}", error);
            return Err(error);
        }
    }

    info!("CLI tasks completed successfully. Exiting.");
    Ok(true)
}
