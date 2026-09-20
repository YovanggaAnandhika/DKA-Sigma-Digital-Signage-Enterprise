use super::model::{CreateUserDto, LoginDto, LoginResponseDto, UpdateUserDto, UserEntity};
use super::repositories::UserRepository;
use crate::common::{AppError, Claims};
use crate::config::Config;
use crate::db::DbPool;
use crate::modules::iam::permission::repositories::PermissionRepository;
use argon2::{
    password_hash::{rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString},
    Argon2,
};
use chrono::{Duration, Utc};
use jsonwebtoken::{encode, EncodingKey, Header};
use uuid::Uuid;

pub struct UserService;

impl UserService {
    pub async fn create_user(pool: &DbPool, dto: CreateUserDto) -> Result<UserEntity, AppError> {
        if let Some(_) = UserRepository::find_by_email(pool, &dto.email).await? {
            return Err(AppError::BadRequest(format!(
                "User with email '{}' already exists",
                dto.email
            )));
        }

        let salt = SaltString::generate(&mut OsRng);
        let argon2 = Argon2::default();
        let password_hash = argon2
            .hash_password(dto.password.as_bytes(), &salt)
            .map_err(|e| AppError::Internal(format!("Hashing failed: {}", e)))?
            .to_string();

        let user = UserRepository::create(pool, dto, password_hash).await?;
        Ok(user)
    }

    pub async fn login(
        pool: &DbPool,
        config: &Config,
        dto: LoginDto,
    ) -> Result<LoginResponseDto, AppError> {
        let user = UserRepository::find_by_email(pool, &dto.email)
            .await?
            .ok_or_else(|| AppError::Unauthorized("Invalid email or password".into()))?;

        if !user.is_active {
            return Err(AppError::Unauthorized("Account is disabled".into()));
        }

        let parsed_hash = PasswordHash::new(&user.password_hash)
            .map_err(|e| AppError::Internal(format!("Invalid password hash: {}", e)))?;

        Argon2::default()
            .verify_password(dto.password.as_bytes(), &parsed_hash)
            .map_err(|_| AppError::Unauthorized("Invalid email or password".into()))?;

        // Retrieve all effective permissions for user
        let permissions = PermissionRepository::get_user_permissions(pool, user.id).await?;

        let exp = (Utc::now() + Duration::hours(config.jwt_expiration_hours)).timestamp();
        let claims = Claims {
            sub: user.id.to_string(),
            email: user.email.clone(),
            permissions: permissions.clone(),
            exp,
        };

        let token = encode(
            &Header::default(),
            &claims,
            &EncodingKey::from_secret(config.jwt_secret.as_bytes()),
        )
        .map_err(|e| AppError::Internal(format!("Token generation failed: {}", e)))?;

        Ok(LoginResponseDto {
            token,
            user,
            permissions,
        })
    }

    pub async fn get_user_by_id(pool: &DbPool, id: Uuid) -> Result<UserEntity, AppError> {
        UserRepository::find_by_id(pool, id)
            .await?
            .ok_or_else(|| AppError::NotFound(format!("User {} not found", id)))
    }

    pub async fn list_users(pool: &DbPool) -> Result<Vec<UserEntity>, AppError> {
        let users = UserRepository::find_all(pool).await?;
        Ok(users)
    }

    pub async fn update_user(
        pool: &DbPool,
        id: Uuid,
        dto: UpdateUserDto,
    ) -> Result<UserEntity, AppError> {
        let user = UserRepository::update(pool, id, dto).await?;
        Ok(user)
    }

    pub async fn delete_user(pool: &DbPool, id: Uuid) -> Result<bool, AppError> {
        let deleted = UserRepository::delete(pool, id).await?;
        Ok(deleted)
    }
}
