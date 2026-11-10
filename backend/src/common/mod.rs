use serde::{Deserialize, Serialize};
use tonic::Status;

pub fn timezone_for_city(city: &str, fallback: &str) -> String {
    match city.trim() {
        "Makassar" | "Denpasar" => "Asia/Makassar".to_string(),
        "Jakarta" | "Surabaya" | "Bandung" | "Medan" => "Asia/Jakarta".to_string(),
        _ => fallback.to_string(),
    }
}

#[cfg(test)]
mod timezone_tests {
    use super::timezone_for_city;

    #[test]
    fn maps_supported_cities_to_their_indonesian_timezones() {
        assert_eq!(timezone_for_city("Makassar", "UTC"), "Asia/Makassar");
        assert_eq!(timezone_for_city("Denpasar", "UTC"), "Asia/Makassar");
        assert_eq!(timezone_for_city("Jakarta", "UTC"), "Asia/Jakarta");
    }

    #[test]
    fn preserves_timezone_for_unknown_cities() {
        assert_eq!(timezone_for_city("Unknown", "UTC"), "UTC");
    }
}

#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] sqlx::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Bad request: {0}")]
    BadRequest(String),

    #[error("Unauthorized: {0}")]
    Unauthorized(String),

    #[error("Forbidden: missing required permission: {0}")]
    Forbidden(String),

    #[error("Internal server error: {0}")]
    Internal(String),
}

impl From<AppError> for Status {
    fn from(err: AppError) -> Self {
        match err {
            AppError::NotFound(msg) => Status::not_found(msg),
            AppError::BadRequest(msg) => Status::invalid_argument(msg),
            AppError::Unauthorized(msg) => Status::unauthenticated(msg),
            AppError::Forbidden(perm) => {
                Status::permission_denied(format!("Required permission: {}", perm))
            }
            AppError::Database(err) => Status::internal(format!("Database error: {}", err)),
            AppError::Internal(msg) => Status::internal(msg),
        }
    }
}

pub fn db_err(err: impl std::fmt::Display) -> Status {
    Status::internal(format!("Database error: {}", err))
}


#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String, // user_id
    pub email: String,
    pub permissions: Vec<String>, // list of "can_*" codes
    pub exp: i64,
    #[serde(default)]
    pub corporation_id: Option<String>,
    #[serde(default)]
    pub branch_id: Option<String>,
    #[serde(default)]
    pub is_superadmin: bool,
    #[serde(default)]
    pub impersonated_corporation_id: Option<String>,
}

impl Claims {
    pub fn active_corporation_id(&self) -> Option<&str> {
        self.impersonated_corporation_id
            .as_deref()
            .or(self.corporation_id.as_deref())
    }
}
