use sqlx::PgPool;
use tracing::info;

use crate::modules::iam::permission::model::CreatePermissionDto;
use crate::modules::iam::permission::repositories::PermissionRepository;
use crate::modules::iam::permission::services::PermissionService;
use crate::modules::iam::role::model::CreateRoleDto;
use crate::modules::iam::role::repositories::RoleRepository;
use crate::modules::iam::role::services::RoleService;
use crate::modules::iam::user::model::CreateUserDto;
use crate::modules::iam::user::repositories::UserRepository;
use crate::modules::iam::user::services::UserService;

pub async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting database seeding (System Defaults, Lookups, Accounts & Roles)...");

    // 1. Seed System Lookups & Templates
    seed_lookups(pool).await?;

    // 2. Seed Permissions
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
        let perm_id = match PermissionRepository::find_by_code(pool, code).await? {
            Some(existing) => existing.id,
            None => {
                PermissionService::create_permission(pool, CreatePermissionDto {
                    code: code.to_string(),
                    name: name.to_string(),
                    description: Some(desc.to_string()),
                    module: module.to_string(),
                }).await?.id
            }
        };
        perm_ids.push(perm_id);
    }

    // 3. Seed System Roles
    info!("Seeding roles...");
    let superadmin_id = match RoleRepository::find_by_slug(pool, "superadmin").await? {
        Some(existing) => {
            RoleService::assign_permissions(pool, existing.id, perm_ids).await?;
            existing.id
        }
        None => {
            RoleService::create_role(pool, CreateRoleDto {
                name: "Super Administrator".to_string(),
                slug: "superadmin".to_string(),
                description: Some("Full platform access to all signage operations and settings".to_string()),
                permission_ids: Some(perm_ids),
            }).await?.id
        }
    };

    if RoleRepository::find_by_slug(pool, "content-manager").await?.is_none() {
        RoleService::create_role(pool, CreateRoleDto {
            name: "Content Manager".to_string(),
            slug: "content-manager".to_string(),
            description: Some("Can design layouts, manage media, and configure playlists".to_string()),
            permission_ids: None,
        }).await?;
    }

    if RoleRepository::find_by_slug(pool, "device-operator").await?.is_none() {
        RoleService::create_role(pool, CreateRoleDto {
            name: "Device Operator".to_string(),
            slug: "device-operator".to_string(),
            description: Some("Can view device fleet telemetry and pair displays".to_string()),
            permission_ids: None,
        }).await?;
    }

    // 4. Seed Default Superadmin User
    if UserRepository::find_by_email(pool, "superadmin@dkasigma.io").await?.is_none() {
        info!("Seeding default administrator user...");
        let _admin = UserService::create_user(pool, CreateUserDto {
            email: "superadmin@dkasigma.io".to_string(),
            password: "superadmin".to_string(),
            full_name: "Master Signage Admin".to_string(),
            role_ids: Some(vec![superadmin_id]),
            role_group_ids: None,
        }).await?;
    }

    info!("Database seeding completed successfully!");
    Ok(())
}

async fn seed_lookups(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Seeding system orientations...");
    sqlx::query(
        r#"
        INSERT INTO common_orientations (name, value) VALUES
            ('Landscape', 'landscape'),
            ('Portrait', 'portrait')
        ON CONFLICT (value) DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    info!("Seeding standard screen resolutions...");
    sqlx::query(
        r#"
        INSERT INTO common_resolutions (name, width, height, aspect_ratio) VALUES
            ('Full HD (1080p)', 1920, 1080, '16:9'),
            ('4K Ultra HD (2160p)', 3840, 2160, '16:9'),
            ('HD (720p)', 1280, 720, '16:9'),
            ('Portrait Full HD (1080x1920)', 1080, 1920, '9:16'),
            ('Portrait 4K (2160x3840)', 2160, 3840, '9:16')
        ON CONFLICT (width, height) DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    info!("Seeding transition effects...");
    sqlx::query(
        r#"
        INSERT INTO studio_transitions (name, css_class, duration_ms) VALUES
            ('Crossfade', 'transition-crossfade', 500),
            ('Slide Left', 'transition-slide-left', 800),
            ('Slide Right', 'transition-slide-right', 800),
            ('Slide Up', 'transition-slide-up', 800),
            ('Slide Down', 'transition-slide-down', 800),
            ('Wipe Left', 'transition-wipe-left', 600),
            ('Wipe Right', 'transition-wipe-right', 600)
        ON CONFLICT DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    info!("Seeding visual filter presets...");
    sqlx::query(
        r#"
        INSERT INTO studio_visual_filters (name, brightness, contrast, saturation, hue_rotate, blur_px) VALUES
            ('Normal', 100, 100, 100, 0, 0),
            ('Cinematic', 95, 120, 85, 0, 0),
            ('Vintage', 110, 90, 70, 30, 0),
            ('Black & White', 100, 110, 0, 0, 0),
            ('Vivid', 105, 115, 130, 0, 0),
            ('Cool Blue', 100, 105, 95, 210, 0),
            ('Warm Sunrise', 105, 105, 110, 20, 0),
            ('Blurred Background', 80, 100, 100, 0, 10)
        ON CONFLICT DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    info!("Seeding queue sectors...");
    sqlx::query(
        r#"
        INSERT INTO components_queue_sectors (id, name, description, default_prefix, ticket_label, counter_label, tts_template_call, tts_template_recall, tts_template_break, icon, sort_order)
        VALUES
            ('RETAIL_FB', 'Restoran, Kafe & F&B', 'Kedai kopi, kafe, resto cepat saji, dan pickup counter pesanan', 'B', 'Nomor Pesanan', 'Pickup Point', 'Pesanan {ticket_number}, silakan ambil di {counter_label} {counter_name}', 'Panggilan ulang, pesanan {ticket_number}, silakan ambil di {counter_label} {counter_name}', '{counter_label} {counter_name} sedang istirahat', 'coffee', 1),
            ('RETAIL', 'Retail, Swalayan & Toko', 'Kasir supermarket, toko ritel, dan layanan kasir antrian belanja', 'R', 'Nomor Antrian', 'Kasir', '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', '{counter_label} {counter_name} sedang istirahat', 'shopping-bag', 2),
            ('HOSPITAL', 'Rumah Sakit & Klinik', 'Antrian poli dokter, pendaftaran pasien, instalasi farmasi & kasir medis', 'A', 'Nomor Antrian', 'Poli', '{ticket_label} {ticket_number}, silakan masuk ke {counter_label} {counter_name}', 'Panggilan ulang pasien, {ticket_label} {ticket_number}, silakan masuk ke {counter_label} {counter_name}', '{counter_label} {counter_name} sedang istirahat pelayanan', 'activity', 3),
            ('BANK', 'Perbankan & Keuangan', 'Teller transaksi tunai, customer service pembukaan rekening & pembiayaan', 'A', 'Nomor Antrian', 'Teller', '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', 'Panggilan ulang nasabah, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', '{counter_label} {counter_name} sedang tutup sementara', 'landmark', 4),
            ('PUBLIC_SERVICE', 'Pelayanan Publik & Instansi', 'Dukcapil, Samsat, Imigrasi, Mal Pelayanan Publik (MPP)', 'C', 'Nomor Antrian', 'Loket', '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', '{counter_label} {counter_name} sedang istirahat', 'building', 5),
            ('CUSTOM', 'Kustom / Sektor Lainnya', 'Konfigurasi fleksibel dan penamaan label bebas sesuai kebutuhan spesifik Anda', 'A', 'Nomor Antrian', 'Loket', '{ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', 'Panggilan ulang, {ticket_label} {ticket_number}, silakan menuju {counter_label} {counter_name}', '{counter_label} {counter_name} sedang istirahat', 'settings', 6)
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            description = EXCLUDED.description,
            default_prefix = EXCLUDED.default_prefix,
            ticket_label = EXCLUDED.ticket_label,
            counter_label = EXCLUDED.counter_label,
            tts_template_call = EXCLUDED.tts_template_call,
            tts_template_recall = EXCLUDED.tts_template_recall,
            tts_template_break = EXCLUDED.tts_template_break,
            icon = EXCLUDED.icon,
            sort_order = EXCLUDED.sort_order,
            updated_at = NOW();
        "#,
    )
    .execute(pool)
    .await?;

    info!("Seeding default queue display and layout items...");
    sqlx::query(
        r#"
        INSERT INTO components_queue_displays (id, name, prefix, canvas_width, canvas_height, background_color, theme_preset)
        VALUES ('76a3e570-9807-40a5-ad74-e7bb28e382dc', 'Layar Antrian Baru', 'A', 1920, 1080, '#0f172a', 'medical-green')
        ON CONFLICT (id) DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    sqlx::query(
        r##"
        INSERT INTO components_queue_layout_items (
            id, queue_display_id, item_type, name, x, y, width, height, z_index,
            background_color, text_color, font_size, font_weight, text_align,
            template_content, config, is_visible
        )
        VALUES
            ('11111111-1111-1111-1111-111111111101', '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'text_label', 'Judul Antrian', 60, 60, 1800, 70, 1, 'transparent', '#10b981', 36, '800', 'center', '$queue_name$', '{}'::jsonb, true),
            ('11111111-1111-1111-1111-111111111102', '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'ticket_number', 'Nomor Antrian Panggilan', 360, 190, 1200, 440, 2, 'transparent', '#10b981', 150, '900', 'center', '$queue_number$', '{"pulseOnCall": true}'::jsonb, true),
            ('11111111-1111-1111-1111-111111111103', '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'counter_loket', 'Label Loket', 710, 680, 500, 90, 3, '#059669', '#ffffff', 32, '800', 'center', '$queue_counter$', '{"borderRadius": 14, "badge": "LOKET TUJUAN"}'::jsonb, true),
            ('11111111-1111-1111-1111-111111111104', '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'marquee', 'Running Text Footer', 0, 990, 1920, 90, 4, '#064e3b', '#ffffff', 24, 'bold', 'left', 'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil. Terima kasih.', '{"speed": "normal", "direction": "left", "badge": "INFORMASI", "badgeColor": "#10b981"}'::jsonb, true)
        ON CONFLICT (id) DO UPDATE SET
            x = EXCLUDED.x,
            y = EXCLUDED.y,
            width = EXCLUDED.width,
            height = EXCLUDED.height,
            background_color = EXCLUDED.background_color,
            text_color = EXCLUDED.text_color,
            font_size = EXCLUDED.font_size,
            template_content = EXCLUDED.template_content,
            config = EXCLUDED.config;
        "##,
    )
    .execute(pool)
    .await?;

    Ok(())
}
