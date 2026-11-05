use std::path::Path;
use std::time::Duration;

pub async fn start(upload_dir: &str) -> std::io::Result<()> {
    tokio::fs::create_dir_all(upload_dir).await?;
    let cleanup_upload_dir = upload_dir.to_owned();

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(Duration::from_secs(3600));
        loop {
            interval.tick().await;
            cleanup_orphan_uploads(Path::new(&cleanup_upload_dir)).await;
        }
    });

    Ok(())
}

async fn cleanup_orphan_uploads(upload_dir: &Path) {
    let mut entries = match tokio::fs::read_dir(upload_dir).await {
        Ok(entries) => entries,
        Err(error) => {
            tracing::warn!(
                "Failed to read upload directory {}: {}",
                upload_dir.display(),
                error
            );
            return;
        }
    };

    loop {
        let entry = match entries.next_entry().await {
            Ok(Some(entry)) => entry,
            Ok(None) => break,
            Err(error) => {
                tracing::warn!(
                    "Failed to list upload directory {}: {}",
                    upload_dir.display(),
                    error
                );
                break;
            }
        };
        let file_name = entry.file_name().into_string().unwrap_or_default();
        if !file_name.starts_with(".part_") {
            continue;
        }

        let modified = match entry
            .metadata()
            .await
            .and_then(|metadata| metadata.modified())
        {
            Ok(modified) => modified,
            Err(error) => {
                tracing::warn!("Failed to inspect orphan upload {}: {}", file_name, error);
                continue;
            }
        };
        let is_stale = match modified.elapsed() {
            Ok(age) => age.as_secs() > 86400,
            Err(error) => {
                tracing::warn!(
                    "Failed to determine age of orphan upload {}: {}",
                    file_name,
                    error
                );
                continue;
            }
        };
        if !is_stale {
            continue;
        }

        match tokio::fs::remove_file(entry.path()).await {
            Ok(()) => tracing::info!("Garbage collected orphan upload: {}", file_name),
            Err(error) => tracing::warn!("Failed to remove orphan upload {}: {}", file_name, error),
        }
    }
}
