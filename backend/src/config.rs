use std::env;

#[derive(Clone, Debug)]
pub struct Config {
    pub grpc_port: u16,
    pub host: String,
    pub database_url: String,
    pub jwt_secret: String,
    pub jwt_expiration_hours: i64,
    pub upload_dir: String,
    pub base_url: String,
}

impl Config {
    pub fn from_env() -> Self {
        dotenvy::dotenv().ok();

        Self {
            grpc_port: env::var("GRPC_PORT")
                .unwrap_or_else(|_| "50051".to_string())
                .parse()
                .expect("GRPC_PORT must be a number"),
            host: env::var("HOST").unwrap_or_else(|_| "0.0.0.0".to_string()),
            database_url: env::var("DATABASE_URL").unwrap_or_else(|_| {
                // Fallback sesuai compose.yml: user=sigma, password=bZ9qL4vX7kM2pT8w, db=sigma
                // Host "db" untuk container, "localhost:54321" untuk development lokal
                let host = env::var("DB_HOST").unwrap_or_else(|_| "db".to_string());
                let port = env::var("DB_PORT").unwrap_or_else(|_| "5432".to_string());
                let user = env::var("DB_USERNAME").unwrap_or_else(|_| "sigma".to_string());
                let pass = env::var("DB_PASSWORD").unwrap_or_else(|_| "bZ9qL4vX7kM2pT8w".to_string());
                let dbname = env::var("DB_DATABASE").unwrap_or_else(|_| "sigma".to_string());
                format!("postgres://{}:{}@{}:{}/{}", user, pass, host, port, dbname)
            }),
            jwt_secret: env::var("JWT_SECRET")
                .unwrap_or_else(|_| "default_super_secret_signage_key_123".to_string()),
            jwt_expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .unwrap_or_else(|_| "24".to_string())
                .parse()
                .unwrap_or(24),
            upload_dir: env::var("UPLOAD_DIR").unwrap_or_else(|_| "./uploads".to_string()),
            base_url: env::var("BASE_URL").unwrap_or_else(|_| "http://localhost:8080".to_string()),
        }
    }
}
