use sqlx::PgPool;
use tracing::{info, warn};
use uuid::Uuid;

use crate::modules::iam::permission::model::CreatePermissionDto;
use crate::modules::iam::permission::services::PermissionService;
use crate::modules::iam::role::model::CreateRoleDto;
use crate::modules::iam::role::services::RoleService;
use crate::modules::iam::user::model::CreateUserDto;
use crate::modules::iam::user::services::UserService;
use crate::modules::distribution::canary::model::CreateCanaryGroupDto;
use crate::modules::distribution::canary::services::CanaryService;
use crate::modules::studio::layout::model::CreateLayoutDto;
use crate::modules::studio::layout::services::LayoutService;
use crate::modules::studio::layer::layer::model::CreateLayerDto;
use crate::modules::studio::layer::layer::services::LayerService;
use crate::modules::hardware::device::model::{RegisterDeviceDto, PairDeviceDto, UpdateDeviceDto};
use crate::modules::hardware::device::services::DeviceService;

pub async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting database seeding via Domain Services...");

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

    // 4. Seed Canary Groups
    info!("Seeding canary rollout groups...");
    let _canary = CanaryService::create_canary_group(pool, CreateCanaryGroupDto {
        name: "Beta Fleet - 10%".to_string(),
        description: Some("Early preview group receiving newly approved layouts".to_string()),
        rollout_percentage: Some(10),
        is_active: Some(true),
        target_layout_id: None,
    }).await?;

    // Fetch Landscape orientation ID
    let landscape_id_row: (Uuid,) = sqlx::query_as("SELECT id FROM orientations WHERE value = 'landscape'")
        .fetch_one(pool)
        .await?;
    let portrait_id_row: (Uuid,) = sqlx::query_as("SELECT id FROM orientations WHERE value = 'portrait'")
        .fetch_one(pool)
        .await?;

    // 5. Seed Demonstration Layout & Layers
    info!("Seeding demonstration layout & layers...");
    let layout = LayoutService::create_layout(pool, CreateLayoutDto {
        name: "Corporate HQ Main Lobby".to_string(),
        description: Some("Default 1080p Landscape Layout with 2 display layers".to_string()),
        canvas_width: Some(1920),
        canvas_height: Some(1080),
        orientation_id: landscape_id_row.0,
        background_color: Some("#020617".to_string()),
        background_image_url: None,
    }).await?;

    let _layer1 = LayerService::create_layer(pool, CreateLayerDto {
        layout_id: layout.id,
        name: Some("Main Promo Stage".to_string()),
        x: 0,
        y: 0,
        width: 1344,
        height: 1080,
        z_index: Some(1),
        background_color: Some("#000000".to_string()),
    }).await?;

    let _layer2 = LayerService::create_layer(pool, CreateLayerDto {
        layout_id: layout.id,
        name: Some("Sidebar Widget Stream".to_string()),
        x: 1344,
        y: 0,
        width: 576,
        height: 1080,
        z_index: Some(2),
        background_color: Some("#0f172a".to_string()),
    }).await?;

    // 6. Seed Demonstration Displays
    info!("Seeding demo devices...");
    let dev1 = DeviceService::register_device(pool, RegisterDeviceDto {
        mac_address: Some("00:1A:2B:3C:4D:5E".to_string()),
        app_version: Some("v1.0.0".to_string()),
        android_version: Some("Android 11".to_string()),
        screen_width: Some(1920),
        screen_height: Some(1080),
        orientation: Some("landscape".to_string()),
    }).await?;

    // Pair and update dev1
    let dev1_paired = DeviceService::pair_device(pool, PairDeviceDto {
        pairing_code: dev1.pairing_code.clone(),
        device_name: "Lobby Main Totem".to_string(),
        store_location: None,
        default_layout_id: Some(layout.id),
        canary_group_id: None,
    }).await?;
    
    // Simulate it being online via direct update if needed, but pairing makes it essentially active.
    
    let _dev2 = DeviceService::register_device(pool, RegisterDeviceDto {
        mac_address: Some("AA:BB:CC:DD:EE:FF".to_string()),
        app_version: Some("v1.0.0".to_string()),
        android_version: Some("Android 10".to_string()),
        screen_width: Some(1080),
        screen_height: Some(1920),
        orientation: Some("portrait".to_string()),
    }).await?;

    info!("Database seeding via Services completed successfully!");
    Ok(())
}
