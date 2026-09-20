use serde::{Deserialize, Serialize};
use tonic::Status;

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
}
