pub mod proto {
    pub mod common {
        pub mod v1 {
            tonic::include_proto!("signage.common.v1");
            pub mod orientation {
                tonic::include_proto!("signage.common.v1.orientation");
            }
            pub mod resolution {
                tonic::include_proto!("signage.common.v1.resolution");
            }
        }
    }
    pub mod iam {
        pub mod v1 {
            pub mod permission {
                tonic::include_proto!("signage.iam.v1.permission");
            }
            pub mod role {
                tonic::include_proto!("signage.iam.v1.role");
            }
            pub mod role_group {
                tonic::include_proto!("signage.iam.v1.role_group");
            }
            pub mod user {
                tonic::include_proto!("signage.iam.v1.user");
            }
        }
    }
    pub mod hardware {
        pub mod v1 {
            pub mod device {
                tonic::include_proto!("signage.hardware.v1.device");
            }
            pub mod display_group {
                tonic::include_proto!("signage.hardware.v1.display_group");
            }
        }
    }
    pub mod studio {
        pub mod v1 {
            pub mod media {
                tonic::include_proto!("signage.studio.v1.media");
            }
            pub mod playlist {
                pub mod playlist {
                    tonic::include_proto!("signage.studio.v1.playlist.playlist");
                }
                pub mod item {
                    tonic::include_proto!("signage.studio.v1.playlist.item");
                }
            }
            pub mod layer {
                tonic::include_proto!("signage.studio.v1.layer");
            }
            pub mod layout {
                tonic::include_proto!("signage.studio.v1.layout");
            }
            pub mod schedule {
                pub mod schedule {
                    tonic::include_proto!("signage.studio.v1.schedule.schedule");
                }
                pub mod event {
                    tonic::include_proto!("signage.studio.v1.schedule.event");
                }
            }
            pub mod transition {
                tonic::include_proto!("signage.studio.v1.transition");
            }
            pub mod visual_filter {
                tonic::include_proto!("signage.studio.v1.visual_filter");
            }
        }
    }
    pub mod components {
        pub mod v1 {
            pub mod ticker {
                tonic::include_proto!("signage.components.v1.ticker");
            }
            pub mod clock {
                tonic::include_proto!("signage.components.v1.clock");
            }
            pub mod webview {
                tonic::include_proto!("signage.components.v1.webview");
            }
            pub mod album {
                pub mod album {
                    tonic::include_proto!("signage.components.v1.album.album");
                }
                pub mod photo {
                    tonic::include_proto!("signage.components.v1.album.photo");
                }
            }
            pub mod queue {
                pub mod display {
                    tonic::include_proto!("signage.components.v1.queue.display");
                }
                pub mod layout_item {
                    tonic::include_proto!("signage.components.v1.queue.layout_item");
                }
                pub mod counter {
                    tonic::include_proto!("signage.components.v1.queue.counter");
                }
                pub mod ticket {
                    tonic::include_proto!("signage.components.v1.queue.ticket");
                }
                pub mod audio {
                    tonic::include_proto!("signage.components.v1.queue.audio");
                }
                pub mod sector {
                    tonic::include_proto!("signage.components.v1.queue.sector");
                }
                pub mod device {
                    tonic::include_proto!("signage.components.v1.queue.device");
                }
            }
        }
    }
    pub mod distribution {
        pub mod v1 {
            pub mod manifest {
                tonic::include_proto!("signage.distribution.v1.manifest");
            }
            pub mod stream {
                tonic::include_proto!("signage.distribution.v1.stream");
            }
            pub mod canary {
                tonic::include_proto!("signage.distribution.v1.canary");
            }
        }
    }
}

// Subfolder domains mirroring proto & modules:
pub mod iam;
pub mod hardware;
pub mod studio;
pub mod components;
pub mod common;
pub mod distribution;
pub mod middleware;
