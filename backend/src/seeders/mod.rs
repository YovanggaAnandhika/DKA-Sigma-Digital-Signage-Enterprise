use sqlx::PgPool;
use tracing::info;
use uuid::Uuid;

use crate::modules::iam::permission::model::CreatePermissionDto;
use crate::modules::iam::permission::repositories::PermissionRepository;
use crate::modules::iam::permission::services::PermissionService;
use crate::modules::iam::role::model::CreateRoleDto;
use crate::modules::iam::role::repositories::RoleRepository;
use crate::modules::iam::role::services::RoleService;
use crate::modules::iam::role_group::model::CreateRoleGroupDto;
use crate::modules::iam::role_group::repositories::RoleGroupRepository;
use crate::modules::iam::role_group::services::RoleGroupService;
use crate::modules::iam::user::model::CreateUserDto;
use crate::modules::iam::user::repositories::UserRepository;
use crate::modules::iam::user::services::UserService;

pub async fn seed_database(pool: &PgPool) -> Result<(), Box<dyn std::error::Error>> {
    info!("Starting database seeding (Corporations, Branches, Permissions, Roles, Groups & Lookups)...");

    // 1. Seed Default Corporation & Branch
    let default_corp_id = Uuid::parse_str("00000000-0000-0000-0000-000000000001").unwrap();
    let default_branch_id = Uuid::parse_str("00000000-0000-0000-0000-000000000002").unwrap();

    info!("Seeding default corporation...");
    sqlx::query(
        r#"
        INSERT INTO system_corporations (
            id, name, slug, description, active_until, max_screens, max_branches, subscription_tier, is_active
        )
        VALUES (
            $1, 'Default Corporation', 'default-corp', 'Main default corporate tenant',
            '2099-12-31 23:59:59+00'::timestamptz, 100, 50, 'enterprise', true
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            active_until = EXCLUDED.active_until,
            max_screens = EXCLUDED.max_screens,
            max_branches = EXCLUDED.max_branches,
            subscription_tier = EXCLUDED.subscription_tier,
            updated_at = NOW();
        "#,
    )
    .bind(default_corp_id)
    .execute(pool)
    .await?;

    info!("Seeding default branch...");
    sqlx::query(
        r#"
        INSERT INTO system_branches (
            id, corporation_id, name, code, address, is_active
        )
        VALUES (
            $1, $2, 'Kantor Pusat (HQ)', 'HQ', 'Headquarters Central Office', true
        )
        ON CONFLICT (id) DO UPDATE SET
            name = EXCLUDED.name,
            code = EXCLUDED.code,
            address = EXCLUDED.address,
            updated_at = NOW();
        "#,
    )
    .bind(default_branch_id)
    .bind(default_corp_id)
    .execute(pool)
    .await?;

    // 2. Seed System Lookups & Templates
    seed_lookups(pool, default_corp_id, default_branch_id).await?;

    // 3. Seed Comprehensive 45+ Permissions
    let permissions = vec![
        // System & Tenancy
        ("can_all_access", "Superadmin All Access", "Bypass all permission checks across the platform", "system"),
        ("can_impersonate_corporation", "Impersonate Corporation", "Switch tenant context and operate as another corporation", "system"),
        ("can_manage_corporations", "Manage Corporations", "Create, edit, suspend and configure corporate tenants", "system"),
        ("can_view_corporations", "View Corporations", "View list of corporate tenants and subscription statuses", "system"),
        ("can_manage_branches", "Manage Branches", "Create, edit, and organize branch locations", "system"),
        ("can_view_branches", "View Branches", "View branch locations and site details", "system"),
        ("can_view_dashboard", "View Dashboard", "Access and view operational metrics & telemetry dashboard", "system"),

        // IAM
        ("can_manage_users", "Manage Users", "Create, edit, invite, and deactivate user accounts", "iam"),
        ("can_view_users", "View Users", "View tenant user directories and profiles", "iam"),
        ("can_manage_roles", "Manage Roles", "Create and modify roles and permission policies", "iam"),
        ("can_view_roles", "View Roles", "View roles and access assignments", "iam"),
        ("can_manage_role_groups", "Manage Role Groups", "Create and manage flexible role groups", "iam"),
        ("can_view_role_groups", "View Role Groups", "View role groups", "iam"),
        ("can_manage_iam", "Manage IAM", "Manage users, roles, and access control permissions", "iam"),

        // Hardware & Displays
        ("can_manage_devices", "Manage Devices", "Pair, rename, reboot, capture screenshots, and configure displays", "hardware"),
        ("can_view_devices", "View Devices", "View fleet status, online indicators, and telemetry", "hardware"),
        ("can_pair_devices", "Pair Devices", "Approve and pair new Android signage hardware", "hardware"),
        ("can_manage_display_groups", "Manage Display Groups", "Create and assign displays to display groups", "hardware"),
        ("can_view_display_groups", "View Display Groups", "View display grouping structure", "hardware"),

        // Studio & Layout
        ("can_manage_layouts", "Manage Layouts", "Create, edit, duplicate, and publish visual layouts", "studio"),
        ("can_view_layouts", "View Layouts", "View layout designs and preview canvases", "studio"),
        ("can_manage_layers", "Manage Layers", "Add, arrange, and configure layout layers & zones", "studio"),
        ("can_view_layers", "View Layers", "Inspect layout layer compositions", "studio"),
        ("can_manage_playlists", "Manage Playlists", "Create playlists and order playlist items", "studio"),
        ("can_view_playlists", "View Playlists", "View playlists and duration timing", "studio"),
        ("can_manage_media", "Manage Media", "Upload, convert, tag, and delete media assets", "studio"),
        ("can_view_media", "View Media", "Browse media library and inspect asset details", "studio"),
        ("can_manage_schedules", "Manage Schedules", "Configure calendar schedules, recurring events & overrides", "studio"),
        ("can_view_schedules", "View Schedules", "View playback timetable and event schedules", "studio"),

        // Components & Dynamic Widgets
        ("can_manage_tickers", "Manage Tickers", "Create and update running text ticker feeds", "components"),
        ("can_view_tickers", "View Tickers", "View ticker items and news tickers", "components"),
        ("can_manage_clocks", "Manage Clocks", "Configure clock, date, and prayer time widgets", "components"),
        ("can_view_clocks", "View Clocks", "View clock widgets", "components"),
        ("can_manage_webviews", "Manage Webviews", "Configure embedded web content and URL integrations", "components"),
        ("can_view_webviews", "View Webviews", "View webview widgets", "components"),
        ("can_manage_albums", "Manage Albums", "Manage photo galleries and promotional photo albums", "components"),
        ("can_view_albums", "View Albums", "View photo albums", "components"),
        ("can_manage_live_streams", "Manage Live Streams", "Configure RTSP, HLS, RTMP, and server relay live streams", "components"),
        ("can_view_live_streams", "View Live Streams", "View live streaming sources and relay status", "components"),

        // Smart Queue System
        ("can_manage_queue", "Manage Queue", "Configure queue displays, sectors, counters, and call policies", "queue"),
        ("can_view_queue", "View Queue", "View queue monitor and live counter statuses", "queue"),
        ("can_operate_counter", "Operate Counter", "Call tickets, recall, advance, and transfer queue numbers", "queue"),
        ("can_view_counter", "View Counter", "View queue counter interface", "queue"),
        ("can_manage_queue_display", "Manage Queue Display", "Design and position queue display canvas widgets", "queue"),
        ("can_view_queue_display", "View Queue Display", "Preview queue display screens", "queue"),
        ("can_manage_queue_audio", "Manage Queue Audio", "Configure audio chimes, voice announcer & TTS presets", "queue"),
        ("can_view_queue_audio", "View Queue Audio", "Inspect audio announcements and TTS voice configuration", "queue"),

        // IoT & Hardware Buttons
        ("can_manage_iot", "Manage IoT", "Register ESP32/Arduino queue buttons and configure button bindings", "iot"),
        ("can_view_iot", "View IoT", "View IoT device health, ping telemetry, and button press events", "iot"),

        // Distribution & Rollout
        ("can_manage_distribution", "Manage Distribution", "Deploy layouts, dispatch sync signals, and manage canary stages", "distribution"),
        ("can_view_distribution", "View Distribution", "View deployment history, canary groups, and delivery logs", "distribution"),

        // Telemetry & Analytics
        ("can_view_analytics", "View Analytics", "Inspect playback audit logs, uptime statistics, and proof-of-play reports", "analytics"),
        ("can_export_analytics", "Export Analytics", "Export analytics data, playback reports, and telemetry to CSV/PDF", "analytics"),
    ];

    info!("Seeding permissions...");
    let mut perm_map = std::collections::HashMap::new();
    let mut all_perm_ids = Vec::new();

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
        perm_map.insert(code.to_string(), perm_id);
        all_perm_ids.push(perm_id);
    }

    // Helper closure to resolve list of codes to Vec<Uuid>
    let resolve_perms = |codes: &[&str]| -> Vec<Uuid> {
        codes.iter().filter_map(|c| perm_map.get(*c).copied()).collect()
    };

    // 4. Seed System Roles (Corporate Scoped)
    info!("Seeding system roles...");
    let superadmin_id = match RoleRepository::find_by_slug(pool, "superadmin").await? {
        Some(existing) => {
            RoleService::assign_permissions(pool, existing.id, all_perm_ids.clone()).await?;
            existing.id
        }
        None => {
            RoleService::create_role(pool, CreateRoleDto {
                corporation_id: Some(default_corp_id),
                branch_id: None,
                name: "Super Administrator".to_string(),
                slug: "superadmin".to_string(),
                description: Some("Full platform access to all signage operations, tenancies, and settings".to_string()),
                permission_ids: Some(all_perm_ids.clone()),
                created_by_user_id: None,
            }).await?.id
        }
    };

    if RoleRepository::find_by_slug(pool, "content-manager").await?.is_none() {
        let content_perms = resolve_perms(&[
            "can_view_dashboard", "can_view_layouts", "can_manage_layouts",
            "can_view_layers", "can_manage_layers", "can_view_playlists", "can_manage_playlists",
            "can_view_media", "can_manage_media", "can_view_schedules", "can_manage_schedules",
            "can_view_tickers", "can_manage_tickers", "can_view_clocks", "can_manage_clocks",
            "can_view_webviews", "can_manage_webviews", "can_view_albums", "can_manage_albums",
        ]);
        RoleService::create_role(pool, CreateRoleDto {
            corporation_id: Some(default_corp_id),
            branch_id: None,
            name: "Content Manager".to_string(),
            slug: "content-manager".to_string(),
            description: Some("Can design layouts, manage media, and configure playlists".to_string()),
            permission_ids: Some(content_perms),
            created_by_user_id: None,
        }).await?;
    }

    if RoleRepository::find_by_slug(pool, "device-operator").await?.is_none() {
        let device_perms = resolve_perms(&[
            "can_view_dashboard", "can_view_devices", "can_manage_devices", "can_pair_devices",
            "can_view_display_groups", "can_view_queue", "can_view_queue_display", "can_view_iot",
        ]);
        RoleService::create_role(pool, CreateRoleDto {
            corporation_id: Some(default_corp_id),
            branch_id: None,
            name: "Device Operator".to_string(),
            slug: "device-operator".to_string(),
            description: Some("Can view device fleet telemetry and pair displays".to_string()),
            permission_ids: Some(device_perms),
            created_by_user_id: None,
        }).await?;
    }

    // 5. Seed Flexible Role Groups (Directly bound to permission lists for flexible RBAC)
    info!("Seeding flexible role groups with direct permission mappings...");

    // Group 1: Retail & Branch Operations
    let retail_ops_perms = resolve_perms(&[
        "can_view_dashboard", "can_view_devices", "can_view_layouts", "can_view_playlists",
        "can_view_schedules", "can_view_queue", "can_operate_counter", "can_view_counter",
        "can_view_queue_display", "can_view_iot",
    ]);
    match RoleGroupRepository::find_by_slug(pool, "retail-ops").await? {
        Some(group) => {
            RoleGroupRepository::assign_permissions(pool, group.id, retail_ops_perms).await?;
        }
        None => {
            RoleGroupService::create_role_group(pool, CreateRoleGroupDto {
                corporation_id: Some(default_corp_id),
                branch_id: None,
                name: "Retail & Branch Operations".to_string(),
                slug: "retail-ops".to_string(),
                description: Some("Operational access for branch supervisors, queue managers, and store displays".to_string()),
                role_ids: None,
                permission_ids: Some(retail_ops_perms),
                created_by_user_id: None,
            }).await?;
        }
    }

    // Group 2: Studio & Content Creative
    let studio_creative_perms = resolve_perms(&[
        "can_view_dashboard", "can_view_layouts", "can_manage_layouts",
        "can_view_layers", "can_manage_layers", "can_view_playlists", "can_manage_playlists",
        "can_view_media", "can_manage_media", "can_view_schedules", "can_manage_schedules",
        "can_view_tickers", "can_manage_tickers", "can_view_clocks", "can_manage_clocks",
        "can_view_webviews", "can_manage_webviews", "can_view_albums", "can_manage_albums",
        "can_view_queue_display", "can_manage_queue_display",
    ]);
    match RoleGroupRepository::find_by_slug(pool, "studio-creative").await? {
        Some(group) => {
            RoleGroupRepository::assign_permissions(pool, group.id, studio_creative_perms).await?;
        }
        None => {
            RoleGroupService::create_role_group(pool, CreateRoleGroupDto {
                corporation_id: Some(default_corp_id),
                branch_id: None,
                name: "Studio & Content Creative".to_string(),
                slug: "studio-creative".to_string(),
                description: Some("Creative team access to layout designer, playlists, media studio, and widgets".to_string()),
                role_ids: None,
                permission_ids: Some(studio_creative_perms),
                created_by_user_id: None,
            }).await?;
        }
    }

    // Group 3: Field Display & IoT Technician
    let field_tech_perms = resolve_perms(&[
        "can_view_dashboard", "can_view_devices", "can_manage_devices", "can_pair_devices",
        "can_view_display_groups", "can_manage_display_groups", "can_view_iot", "can_manage_iot",
        "can_view_queue_audio", "can_manage_queue_audio",
    ]);
    match RoleGroupRepository::find_by_slug(pool, "field-tech").await? {
        Some(group) => {
            RoleGroupRepository::assign_permissions(pool, group.id, field_tech_perms).await?;
        }
        None => {
            RoleGroupService::create_role_group(pool, CreateRoleGroupDto {
                corporation_id: Some(default_corp_id),
                branch_id: None,
                name: "Field Display & IoT Technician".to_string(),
                slug: "field-tech".to_string(),
                description: Some("Hardware installers, Android display fleet administrators, and IoT queue button engineers".to_string()),
                role_ids: None,
                permission_ids: Some(field_tech_perms),
                created_by_user_id: None,
            }).await?;
        }
    }

    // Group 4: Cashier & Counter Operator
    let counter_operator_perms = resolve_perms(&[
        "can_view_queue", "can_operate_counter", "can_view_counter",
    ]);
    match RoleGroupRepository::find_by_slug(pool, "counter-operator").await? {
        Some(group) => {
            RoleGroupRepository::assign_permissions(pool, group.id, counter_operator_perms).await?;
        }
        None => {
            RoleGroupService::create_role_group(pool, CreateRoleGroupDto {
                corporation_id: Some(default_corp_id),
                branch_id: None,
                name: "Cashier & Counter Operator".to_string(),
                slug: "counter-operator".to_string(),
                description: Some("Dedicated access for counter staff, call buttons, and cashier service desks".to_string()),
                role_ids: None,
                permission_ids: Some(counter_operator_perms),
                created_by_user_id: None,
            }).await?;
        }
    }

    // 6. Seed Default Superadmin User
    if UserRepository::find_by_email(pool, "superadmin@example.com").await?.is_none() {
        info!("Seeding default administrator user...");
        let _admin = UserService::create_user(pool, CreateUserDto {
            corporation_id: Some(default_corp_id),
            branch_id: Some(default_branch_id),
            email: "superadmin@example.com".to_string(),
            password: "superadmin".to_string(),
            full_name: "Master Signage Admin".to_string(),
            role_ids: Some(vec![superadmin_id]),
            role_group_ids: None,
            created_by_user_id: None,
        }).await?;
    }

    info!("Database seeding completed successfully!");
    info!("Seeding default live streams...");
    sqlx::query(
        r#"
        INSERT INTO components_live_streams (id, name, description, stream_mode, source_type, source_url, server_hls_endpoint, is_relay_active, auto_reconnect, low_latency_mode, is_muted)
        VALUES
            ('f0000000-0000-0000-0000-000000000001', 'Kamera CCTV Area Kasir & Lobby Utama', 'Relay terpusat 1 feed RTSP kamera IP lokal menjadi HLS untuk seluruh layar cabang.', 'SERVER_HOSTED_HLS', 'RTSP', 'rtsp://192.168.1.50:554/Streaming/Channels/101', '/streams/f0000000-0000-0000-0000-000000000001/live.m3u8', false, true, true, true),
            ('f0000000-0000-0000-0000-000000000002', 'Siaran Langsung Promo & Event (HLS Direct)', 'Stream video HLS langsung dari CDN untuk penayangan acara peluncuran produk.', 'EXTERNAL_EMBED', 'HLS', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', '', false, true, true, false),
            ('f0000000-0000-0000-0000-000000000003', 'Townhall Korporat & Siaran Berita (YouTube Live)', 'Embed langsung siaran YouTube Live dengan pemutaran otomatis tanpa gangguan.', 'EXTERNAL_EMBED', 'YOUTUBE_EMBED', 'https://www.youtube.com/watch?v=jfKfPfyJRdk', '', false, true, false, true)
        ON CONFLICT (id) DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}

async fn seed_lookups(pool: &PgPool, default_corp_id: Uuid, default_branch_id: Uuid) -> Result<(), Box<dyn std::error::Error>> {
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
        INSERT INTO components_queue_displays (id, corporation_id, branch_id, name, prefix, canvas_width, canvas_height, background_color, theme_preset)
        VALUES ('76a3e570-9807-40a5-ad74-e7bb28e382dc', $1, $2, 'Layar Antrian Baru', 'A', 1920, 1080, '#0f172a', 'medical-green')
        ON CONFLICT (id) DO UPDATE SET
            corporation_id = EXCLUDED.corporation_id,
            branch_id = EXCLUDED.branch_id;
        "#,
    )
    .bind(default_corp_id)
    .bind(default_branch_id)
    .execute(pool)
    .await?;

    sqlx::query(
        r##"
        INSERT INTO components_queue_layout_items (
            id, corporation_id, queue_display_id, item_type, name, x, y, width, height, z_index,
            background_color, text_color, font_size, font_weight, text_align,
            template_content, config, is_visible
        )
        VALUES
            ('11111111-1111-1111-1111-111111111101', $1, '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'text_label', 'Judul Antrian', 60, 60, 1800, 70, 1, 'transparent', '#10b981', 36, '800', 'center', '$queue_name$', '{}'::jsonb, true),
            ('11111111-1111-1111-1111-111111111102', $1, '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'ticket_number', 'Nomor Antrian Panggilan', 360, 190, 1200, 440, 2, 'transparent', '#10b981', 150, '900', 'center', '$queue_number$', '{"pulseOnCall": true}'::jsonb, true),
            ('11111111-1111-1111-1111-111111111103', $1, '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'counter_loket', 'Label Loket', 710, 680, 500, 90, 3, '#059669', '#ffffff', 32, '800', 'center', '$queue_counter$', '{"borderRadius": 14, "badge": "LOKET TUJUAN"}'::jsonb, true),
            ('11111111-1111-1111-1111-111111111104', $1, '76a3e570-9807-40a5-ad74-e7bb28e382dc', 'marquee', 'Running Text Footer', 0, 990, 1920, 90, 4, '#064e3b', '#ffffff', 24, 'bold', 'left', 'PENGUMUMAN: Silakan menuju $queue_counter$ saat nomor $queue_number$ dipanggil. Terima kasih.', '{"speed": "normal", "direction": "left", "badge": "INFORMASI", "badgeColor": "#10b981"}'::jsonb, true)
        ON CONFLICT (id) DO UPDATE SET
            corporation_id = EXCLUDED.corporation_id,
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
    .bind(default_corp_id)
    .execute(pool)
    .await?;

    info!("Seeding default live streams...");
    sqlx::query(
        r#"
        INSERT INTO components_live_streams (id, name, description, stream_mode, source_type, source_url, server_hls_endpoint, is_relay_active, auto_reconnect, low_latency_mode, is_muted)
        VALUES
            ('f0000000-0000-0000-0000-000000000001', 'Kamera CCTV Area Kasir & Lobby Utama', 'Relay terpusat 1 feed RTSP kamera IP lokal menjadi HLS untuk seluruh layar cabang.', 'SERVER_HOSTED_HLS', 'RTSP', 'rtsp://192.168.1.50:554/Streaming/Channels/101', '/streams/f0000000-0000-0000-0000-000000000001/live.m3u8', false, true, true, true),
            ('f0000000-0000-0000-0000-000000000002', 'Siaran Langsung Promo & Event (HLS Direct)', 'Stream video HLS langsung dari CDN untuk penayangan acara peluncuran produk.', 'EXTERNAL_EMBED', 'HLS', 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', '', false, true, true, false),
            ('f0000000-0000-0000-0000-000000000003', 'Townhall Korporat & Siaran Berita (YouTube Live)', 'Embed langsung siaran YouTube Live dengan pemutaran otomatis tanpa gangguan.', 'EXTERNAL_EMBED', 'YOUTUBE_EMBED', 'https://www.youtube.com/watch?v=jfKfPfyJRdk', '', false, true, false, true)
        ON CONFLICT (id) DO NOTHING;
        "#,
    )
    .execute(pool)
    .await?;

    Ok(())
}
