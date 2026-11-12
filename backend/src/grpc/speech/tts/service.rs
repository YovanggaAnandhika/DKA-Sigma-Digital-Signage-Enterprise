use crate::db::DbPool;
use crate::grpc::proto::speech::v1::tts::{
    tts_service_server::TtsService as TtsServiceTrait, SynthesizeRequest, SynthesizeResponse,
};
use sha2::{Digest, Sha256};
use sqlx::Row;
use std::time::Duration;
use tonic::{Request, Response, Status};
use uuid::Uuid;

pub struct TtsServiceImpl {
    pool: DbPool,
    client: Result<reqwest::Client, String>,
}

impl TtsServiceImpl {
    pub fn new(pool: DbPool) -> Self {
        let client = reqwest::Client::builder()
            .timeout(Duration::from_secs(8))
            .user_agent("DKASigma-Signage-Backend")
            .build()
            .map_err(|error| error.to_string());
        Self { pool, client }
    }
}

#[tonic::async_trait]
impl TtsServiceTrait for TtsServiceImpl {
    async fn synthesize(
        &self,
        request: Request<SynthesizeRequest>,
    ) -> Result<Response<SynthesizeResponse>, Status> {
        let request = request.into_inner();
        let text = normalize_text(request.text)?;
        let device_id = Uuid::parse_str(&request.device_id)
            .map_err(|_| Status::invalid_argument("ID device tidak valid"))?;
        if request.device_token.is_empty() {
            return Err(Status::unauthenticated("Token device diperlukan"));
        }

        let row = sqlx::query("SELECT device_token_hash FROM hardware_devices WHERE id = $1")
            .bind(device_id)
            .fetch_optional(&self.pool)
            .await
            .map_err(|error| {
                tracing::error!("Failed to validate TTS device token: {error}");
                Status::internal("Internal error")
            })?
            .ok_or_else(|| Status::not_found("Device tidak ditemukan"))?;

        let expected_hash: Option<String> = row.try_get("device_token_hash").map_err(|error| {
            tracing::error!("Failed to read device token hash for TTS request: {error}");
            Status::internal("Internal error")
        })?;
        let mut hasher = Sha256::new();
        hasher.update(request.device_token.as_bytes());
        let token_hash = hex::encode(hasher.finalize());
        if expected_hash.as_deref() != Some(token_hash.as_str()) {
            return Err(Status::unauthenticated("Token device tidak valid"));
        }

        let client = self
            .client
            .as_ref()
            .map_err(|error| {
                tracing::error!("TTS HTTP client initialization failed: {error}");
                Status::unavailable("TTS upstream tidak tersedia")
            })?;
        let response = client
            .get("https://translate.google.com/translate_tts")
            .query(&[
                ("ie", "UTF-8"),
                ("q", text.as_str()),
                ("tl", "id"),
                ("client", "tw-ob"),
            ])
            .header("Referer", "https://translate.google.com/")
            .send()
            .await
            .map_err(|error| {
                tracing::warn!("TTS upstream request failed: {error}");
                Status::unavailable("TTS upstream tidak dapat dijangkau")
            })?;

        if !response.status().is_success() {
            tracing::warn!("TTS upstream returned status {}", response.status());
            return Err(Status::unavailable("TTS upstream gagal membuat audio"));
        }
        if response.content_length().is_some_and(|length| length > 2 * 1024 * 1024) {
            return Err(Status::resource_exhausted("Audio TTS terlalu besar"));
        }

        let audio = response.bytes().await.map_err(|error| {
            tracing::warn!("Failed to read TTS upstream audio: {error}");
            Status::unavailable("Audio TTS tidak dapat dibaca")
        })?;
        if audio.is_empty() {
            return Err(Status::unavailable("TTS upstream mengembalikan audio kosong"));
        }
        if audio.len() > 2 * 1024 * 1024 {
            return Err(Status::resource_exhausted("Audio TTS terlalu besar"));
        }

        Ok(Response::new(SynthesizeResponse {
            audio_mpeg: audio.to_vec(),
        }))
    }
}

fn normalize_text(text: String) -> Result<String, Status> {
    let text = text.trim();
    if text.is_empty() {
        return Err(Status::invalid_argument("Teks TTS tidak boleh kosong"));
    }
    if text.chars().count() > 300 {
        return Err(Status::invalid_argument("Teks TTS melebihi 300 karakter"));
    }
    Ok(text.to_owned())
}

#[cfg(test)]
mod tests {
    use super::normalize_text;

    #[test]
    fn trims_nonempty_text() {
        assert_eq!(normalize_text("  Halo  ".into()).unwrap(), "Halo");
    }

    #[test]
    fn rejects_empty_or_oversized_text() {
        assert!(normalize_text("  ".into()).is_err());
        assert!(normalize_text("a".repeat(301)).is_err());
    }
}
