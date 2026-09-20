use sqlx::PgPool;
use tracing::info;
use uuid::Uuid;

pub async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting database seeding...");

    // 1. Seed Permissions
    let permissions = vec![
        ("can_view_dashboard", "View Dashboard", "Access and view main telemetry dashboard", "system"),
        ("can_manage_devices", "Manage Devices", "Pair, rename, reboot, and delete display devices", "hardware"),
        ("can_view_devices", "View Devices", "View fleet status and telemetry", "hardware"),
        ("can_manage_layouts", "Manage Layouts", "Create, edit, and arrange display layouts & zones", "studio"),
        ("can_view_layouts", "View Layouts", "View existing layouts and preview canvases", "studio"),
        ("can_manage_playlists", "Manage Playlists", "Create playlists and order media items", "studio"),
        ("can_view_playlists", "View Playlists", "View playlists and duration timing", "studio"),
        ("can_manage_media", "Manage Media", "Upload, convert, and delete media files", "studio"),
        ("can_view_media", "View Media", "Browse media library", "studio"),
        ("can_manage_distribution", "Manage Distribution", "Deploy layouts to displays and manage canary rollouts", "distribution"),
        ("can_manage_iam", "Manage IAM", "Manage users, roles, and access control permissions", "iam"),
    ];

    info!("Seeding permissions...");
    for (code, name, desc, module) in &permissions {
        sqlx::query(
            r#"
            INSERT INTO permissions (code, name, description, module)
            VALUES ($1, $2, $3, $4)
            ON CONFLICT (code) DO UPDATE 
            SET name = EXCLUDED.name, description = EXCLUDED.description, module = EXCLUDED.module
            "#
        )
        .bind(code)
        .bind(name)
        .bind(desc)
        .bind(module)
        .execute(pool)
        .await?;
    }

    // 2. Seed System Roles
    info!("Seeding roles...");
    let superadmin_role_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001")?;
    let content_manager_role_id = Uuid::parse_str("00000000-0000-0000-0000-000000000002")?;
    let device_operator_role_id = Uuid::parse_str("00000000-0000-0000-0000-000000000003")?;

    sqlx::query(
        r#"
        INSERT INTO roles (id, name, slug, description, is_system)
        VALUES 
            ($1, 'Super Administrator', 'superadmin', 'Full platform access to all signage operations and settings', TRUE),
            ($2, 'Content Manager', 'content-manager', 'Can design layouts, manage media, and configure playlists', FALSE),
            ($3, 'Device Operator', 'device-operator', 'Can view device fleet telemetry and pair displays', FALSE)
        ON CONFLICT (slug) DO UPDATE 
        SET name = EXCLUDED.name, description = EXCLUDED.description
        "#
    )
    .bind(superadmin_role_id)
    .bind(content_manager_role_id)
    .bind(device_operator_role_id)
    .execute(pool)
    .await?;

    // Link Superadmin with all permissions
    info!("Assigning all permissions to Superadmin role...");
    sqlx::query(
        r#"
        INSERT INTO role_permissions (role_id, permission_id)
        SELECT $1, id FROM permissions
        ON CONFLICT (role_id, permission_id) DO NOTHING
        "#
    )
    .bind(superadmin_role_id)
    .execute(pool)
    .await?;

    // 3. Seed Default Superadmin User
    info!("Seeding default administrator user...");
    let admin_user_id = Uuid::parse_str("00000000-0000-0000-0000-000000000100")?;

    use argon2::{
        password_hash::{rand_core::OsRng, PasswordHasher, SaltString},
        Argon2,
    };
    let salt = SaltString::generate(&mut OsRng);
    let password_hash = Argon2::default()
        .hash_password(b"OmniSign123!", &salt)
        .map_err(|e| format!("Hashing failed: {}", e))?
        .to_string();

    sqlx::query(
        r#"
        INSERT INTO users (id, email, password_hash, full_name, is_active)
        VALUES ($1, 'admin@omnisign.io', $2, 'Master Signage Admin', TRUE)
        ON CONFLICT (email) DO UPDATE
        SET password_hash = EXCLUDED.password_hash, full_name = EXCLUDED.full_name, is_active = TRUE
        "#
    )
    .bind(admin_user_id)
    .bind(&password_hash)
    .execute(pool)
    .await?;

    // Assign Superadmin role to admin user
    sqlx::query(
        r#"
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
        "#
    )
    .bind(admin_user_id)
    .bind(superadmin_role_id)
    .execute(pool)
    .await?;

    // 4. Seed Canary Groups
    info!("Seeding canary rollout groups...");
    let canary_id = Uuid::parse_str("00000000-0000-0000-0000-000000000200")?;
    sqlx::query(
        r#"
        INSERT INTO canary_groups (id, name, description, rollout_percentage, is_active)
        VALUES ($1, 'Beta Fleet - 10%', 'Early preview group receiving newly approved layouts', 10, TRUE)
        ON CONFLICT (id) DO NOTHING
        "#
    )
    .bind(canary_id)
    .execute(pool)
    .await?;

    // 5. Seed Demonstration Layout & Zones
    info!("Seeding demonstration layout & zones...");
    let layout_id = Uuid::parse_str("00000000-0000-0000-0000-000000000300")?;
    sqlx::query(
        r#"
        INSERT INTO layouts (id, name, description, canvas_width, canvas_height, orientation, background_color)
        VALUES ($1, 'Corporate HQ Main Lobby', 'Default 1080p Landscape Layout with 2 display zones', 1920, 1080, 'landscape', '#020617')
        ON CONFLICT (id) DO NOTHING
        "#
    )
    .bind(layout_id)
    .execute(pool)
    .await?;

    let zone1_id = Uuid::parse_str("00000000-0000-0000-0000-000000000301")?;
    let zone2_id = Uuid::parse_str("00000000-0000-0000-0000-000000000302")?;
    sqlx::query(
        r#"
        INSERT INTO zones (id, layout_id, name, x, y, width, height, z_index, background_color)
        VALUES 
            ($1, $2, 'Main Promo Stage', 0, 0, 1344, 1080, 1, '#000000'),
            ($3, $2, 'Sidebar Widget Stream', 1344, 0, 576, 1080, 2, '#0f172a')
        ON CONFLICT (id) DO NOTHING
        "#
    )
    .bind(zone1_id)
    .bind(layout_id)
    .bind(zone2_id)
    .execute(pool)
    .await?;

    // 6. Seed Demonstration Displays
    info!("Seeding demo devices...");
    let device1_id = Uuid::parse_str("00000000-0000-0000-0000-000000000401")?;
    let device2_id = Uuid::parse_str("00000000-0000-0000-0000-000000000402")?;

    sqlx::query(
        r#"
        INSERT INTO devices (
            id, name, pairing_code, is_paired, screen_width, screen_height, 
            orientation, ip_address, is_online, current_layout_id
        )
        VALUES 
            ($1, 'Lobby Main Totem', 'XR8-992', TRUE, 1920, 1080, 'landscape', '172.29.0.50', TRUE, $3),
            ($2, 'Elevator Bank Display A', 'DKA-404', FALSE, 1080, 1920, 'portrait', '172.29.0.51', FALSE, NULL)
        ON CONFLICT (pairing_code) DO NOTHING
        "#
    )
    .bind(device1_id)
    .bind(device2_id)
    .bind(layout_id)
    .execute(pool)
    .await?;

    info!("Database seeding completed successfully!");
    Ok(())
}
