use sqlx::PgPool;
use tracing::info;

use crate::modules::iam::permission::model::CreatePermissionDto;
use crate::modules::iam::permission::services::PermissionService;
use crate::modules::iam::role::model::CreateRoleDto;
use crate::modules::iam::role::services::RoleService;
use crate::modules::iam::user::model::CreateUserDto;
use crate::modules::iam::user::services::UserService;

pub async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting database seeding (Accounts & Roles only)...");

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
        ("can_manage_schedules", "Manage Schedules", "Create and edit playback schedules", "studio"),
        ("can_view_schedules", "View Schedules", "View playback schedules", "studio"),
        ("can_manage_iam", "Manage IAM", "Manage users, roles, and access control permissions", "iam"),
    ];

    info!("Seeding permissions...");
    let mut perm_ids = Vec::new();
    for (code, name, desc, module) in permissions {
        let perm = PermissionService::create_permission(pool, CreatePermissionDto {
            code: code.to_string(),
            name: name.to_string(),
            description: Some(desc.to_string()),
            module: module.to_string(),
        }).await?;
        perm_ids.push(perm.id);
    }

    // 2. Seed System Roles
    info!("Seeding roles...");
    let superadmin = RoleService::create_role(pool, CreateRoleDto {
        name: "Super Administrator".to_string(),
        slug: "superadmin".to_string(),
        description: Some("Full platform access to all signage operations and settings".to_string()),
        permission_ids: Some(perm_ids),
    }).await?;

    let _content_manager = RoleService::create_role(pool, CreateRoleDto {
        name: "Content Manager".to_string(),
        slug: "content-manager".to_string(),
        description: Some("Can design layouts, manage media, and configure playlists".to_string()),
        permission_ids: None,
    }).await?;

    let _device_operator = RoleService::create_role(pool, CreateRoleDto {
        name: "Device Operator".to_string(),
        slug: "device-operator".to_string(),
        description: Some("Can view device fleet telemetry and pair displays".to_string()),
        permission_ids: None,
    }).await?;

    // 3. Seed Default Superadmin User
    info!("Seeding default administrator user...");
    let _admin = UserService::create_user(pool, CreateUserDto {
        email: "superadmin@dkasigma.io".to_string(),
        password: "superadmin".to_string(),
        full_name: "Master Signage Admin".to_string(),
        role_ids: Some(vec![superadmin.id]),
        role_group_ids: None,
    }).await?;

    info!("Database account seeding completed successfully!");
    Ok(())
}
