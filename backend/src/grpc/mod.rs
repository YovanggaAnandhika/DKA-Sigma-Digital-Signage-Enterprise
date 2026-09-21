pub mod proto {
    pub mod common {
        pub mod v1 {
            tonic::include_proto!("signage.common.v1");
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
                tonic::include_proto!("signage.studio.v1.playlist");
            }
            pub mod layout {
                tonic::include_proto!("signage.studio.v1.layout");
            }
            pub mod schedule {
                tonic::include_proto!("signage.studio.v1.schedule");
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
pub mod distribution;
pub mod middleware;
