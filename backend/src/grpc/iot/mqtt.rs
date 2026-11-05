use crate::modules::distribution::stream::services::StreamConnectionManager;
use sqlx::PgPool;
use uuid::Uuid;

pub fn spawn_mqtt_worker(pool: PgPool, stream_manager: StreamConnectionManager) {
    let mqtt_host =
        std::env::var("MQTT_HOST").unwrap_or_else(|_| "dka-product-sigma-mqtt".to_string());
    let mqtt_port: u16 = std::env::var("MQTT_PORT")
        .ok()
        .and_then(|port| port.parse().ok())
        .unwrap_or(1883);
    let mqtt_username = std::env::var("MQTT_USERNAME").ok();
    let mqtt_password = std::env::var("MQTT_PASSWORD").ok();
    tokio::spawn(async move {
        let mut mqttoptions =
            rumqttc::MqttOptions::new("dka-backend-worker", &mqtt_host, mqtt_port);
        mqttoptions.set_keep_alive(std::time::Duration::from_secs(15));
        mqttoptions.set_clean_session(true);
        match (&mqtt_username, &mqtt_password) {
            (Some(username), Some(password)) if !username.is_empty() && !password.is_empty() => {
                mqttoptions.set_credentials(username, password);
            }
            (Some(_), _) | (_, Some(_)) => {
                tracing::error!(
                    "MQTT_USERNAME and MQTT_PASSWORD must both be set or both be empty"
                );
            }
            _ => {}
        }

        loop {
            tracing::info!(
                "Connecting to MQTT Broker at {}:{}...",
                mqtt_host,
                mqtt_port
            );
            let (client, mut eventloop) = rumqttc::AsyncClient::new(mqttoptions.clone(), 100);

            if let Err(error) = client
                .subscribe("dka/iot/+/action", rumqttc::QoS::AtLeastOnce)
                .await
            {
                tracing::warn!(
                    "Failed to subscribe to dka/iot/+/action: {}. Retrying in 5s...",
                    error
                );
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }
            let _ = client
                .subscribe("dka/iot/+/telemetry", rumqttc::QoS::AtMostOnce)
                .await;
            if let Err(error) = client
                .subscribe("dka/iot/+/reset_request", rumqttc::QoS::AtLeastOnce)
                .await
            {
                tracing::error!("Failed to subscribe to IoT reset requests: {error}");
                tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                continue;
            }
            tracing::info!(
                "Successfully connected & subscribed to MQTT topics for IoT Queue Devices"
            );

            loop {
                match eventloop.poll().await {
                    Ok(rumqttc::Event::Incoming(rumqttc::Packet::Publish(publish))) => {
                        let topic = publish.topic;
                        let payload = match std::str::from_utf8(&publish.payload) {
                            Ok(payload) => payload,
                            Err(_) => continue,
                        };

                        if topic.ends_with("/reset_request") {
                            handle_reset_request(&client, &pool, &topic, payload).await;
                            continue;
                        }

                        if topic.ends_with("/action") {
                            handle_action(&client, &pool, &stream_manager, &topic, payload).await;
                        } else if topic.ends_with("/telemetry") {
                            handle_telemetry(&pool, &topic, payload).await;
                        }
                    }
                    Ok(_) => {}
                    Err(error) => {
                        tracing::warn!(
                            "MQTT event loop disconnected: {}. Reconnecting in 5s...",
                            error
                        );
                        tokio::time::sleep(std::time::Duration::from_secs(5)).await;
                        break;
                    }
                }
            }
        }
    });
}

async fn handle_reset_request(
    client: &rumqttc::AsyncClient,
    pool: &PgPool,
    topic: &str,
    payload: &str,
) {
    let parts: Vec<&str> = topic.split('/').collect();
    let device_uid =
        (parts.len() == 4 && parts[0] == "dka" && parts[1] == "iot" && parts[3] == "reset_request")
            .then_some(parts[2])
            .filter(|uid| {
                !uid.is_empty()
                    && uid.len() <= 64
                    && uid.chars().all(|character| {
                        character.is_ascii_alphanumeric() || character == '_' || character == '-'
                    })
            });
    let request_id = serde_json::from_str::<serde_json::Value>(payload)
        .ok()
        .and_then(|value| {
            value
                .get("request_id")
                .and_then(|id| id.as_str())
                .map(str::to_owned)
        })
        .filter(|id| {
            !id.is_empty()
                && id.len() <= 64
                && id
                    .chars()
                    .all(|character| character.is_ascii_alphanumeric() || character == '-')
        });
    let (Some(uid), Some(request_id)) = (device_uid, request_id) else {
        tracing::warn!("Ignoring malformed IoT reset request on {topic}");
        return;
    };

    let status = match sqlx::query("DELETE FROM iot_devices WHERE device_uid = $1")
        .bind(uid)
        .execute(pool)
        .await
    {
        Ok(_) => "OK",
        Err(error) => {
            tracing::error!("Failed to remove IoT device {uid} after reset confirmation: {error}");
            "ERROR"
        }
    };
    let ack_topic = format!("dka/iot/{uid}/reset_ack");
    let ack_payload = serde_json::json!({
        "request_id": request_id,
        "status": status,
    })
    .to_string();
    if let Err(error) = client
        .publish(&ack_topic, rumqttc::QoS::AtLeastOnce, false, ack_payload)
        .await
    {
        tracing::error!("Failed to publish IoT reset confirmation for {uid}: {error}");
    }
}

async fn handle_action(
    client: &rumqttc::AsyncClient,
    pool: &PgPool,
    stream_manager: &StreamConnectionManager,
    topic: &str,
    payload: &str,
) {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(payload) else {
        tracing::warn!("Ignoring malformed IoT action message on {topic}");
        return;
    };
    let parts: Vec<&str> = topic.split('/').collect();
    let device_uid =
        (parts.len() == 4 && parts[0] == "dka" && parts[1] == "iot" && parts[3] == "action")
            .then_some(parts[2])
            .filter(|uid| !uid.is_empty());
    let pin = value
        .get("pin")
        .and_then(|value| value.as_i64())
        .and_then(|value| i32::try_from(value).ok());

    let (Some(uid), Some(pin)) = (device_uid, pin) else {
        tracing::warn!("Ignoring malformed IoT action message on {topic}");
        return;
    };
    let event = value
        .get("event")
        .and_then(|value| value.as_str())
        .unwrap_or_default();
    let uptime_ms = value.get("uptime_ms").and_then(|value| value.as_i64());
    let device_id = match sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO iot_devices (device_uid, name, last_seen_at) \
         VALUES ($1, LEFT('IoT ' || $1, 100), NOW()) \
         ON CONFLICT (device_uid) DO UPDATE SET last_seen_at = NOW() \
         RETURNING id",
    )
    .bind(uid)
    .fetch_one(pool)
    .await
    {
        Ok(id) => id,
        Err(error) => {
            tracing::error!("Failed to register discovered IoT device {uid}: {error}");
            return;
        }
    };
    let history_id = match sqlx::query_scalar::<_, Uuid>(
        "INSERT INTO iot_device_telemetry \
         (iot_device_id, device_uid, record_type, uptime_ms, pin, button_event) \
         VALUES ($1, $2, 'BUTTON', $3, $4, $5) RETURNING id",
    )
    .bind(device_id)
    .bind(uid)
    .bind(uptime_ms)
    .bind(pin)
    .bind(event)
    .fetch_one(pool)
    .await
    {
        Ok(id) => id,
        Err(error) => {
            tracing::error!("Failed to save IoT button event for {uid}: {error}");
            return;
        }
    };
    let queue_service =
        crate::grpc::components::queue::service::QueueServiceImpl::with_stream_manager(
            pool.clone(),
            stream_manager.clone(),
        );
    let result = queue_service.trigger_iot_action(uid, pin).await;
    let ack_topic = format!("dka/iot/{uid}/ack");
    let (status, message, action) = match result {
        Ok(response) => (
            if response.success { "OK" } else { "IGNORED" },
            response.message,
            response.action,
        ),
        Err(error) => ("ERROR", error.message().to_string(), "NONE".to_string()),
    };

    if let Err(error) = sqlx::query(
        "UPDATE iot_device_telemetry \
         SET action = $2, status = $3, message = $4 WHERE id = $1",
    )
    .bind(history_id)
    .bind(&action)
    .bind(status)
    .bind(&message)
    .execute(pool)
    .await
    {
        tracing::error!("Failed to save IoT action result for {uid}: {error}");
    }

    let ack_payload = serde_json::json!({
        "status": status,
        "action": action,
        "pin": pin,
        "message": message,
        "ts": chrono::Utc::now().timestamp(),
    })
    .to_string();
    if let Err(error) = client
        .publish(
            &ack_topic,
            rumqttc::QoS::AtLeastOnce,
            false,
            ack_payload.into_bytes(),
        )
        .await
    {
        tracing::error!("Failed to publish IoT action acknowledgement for {uid}: {error}");
    }
}

async fn handle_telemetry(pool: &PgPool, topic: &str, payload: &str) {
    let Ok(value) = serde_json::from_str::<serde_json::Value>(payload) else {
        tracing::warn!("Ignoring malformed IoT telemetry message on {topic}");
        return;
    };
    let parts: Vec<&str> = topic.split('/').collect();
    if parts.len() != 4 || parts[0] != "dka" || parts[1] != "iot" || parts[3] != "telemetry" {
        tracing::warn!("Ignoring malformed IoT telemetry topic {topic}");
        return;
    }
    let uid = parts[2];
    let ip = value.get("ip").and_then(|value| value.as_str());
    let firmware = value.get("fw").and_then(|value| value.as_str());
    let rssi = value
        .get("rssi")
        .and_then(|value| value.as_i64())
        .and_then(|value| i32::try_from(value).ok());
    let uptime_ms = value.get("uptime_ms").and_then(|value| value.as_i64());

    let device_id = sqlx::query_scalar::<_, Uuid>(
        r#"
        INSERT INTO iot_devices (
            device_uid, name, ip_address, firmware_version, last_seen_at
        )
        VALUES ($1, LEFT('IoT ' || $1, 100), $2, $3, NOW())
        ON CONFLICT (device_uid) DO UPDATE
        SET ip_address = COALESCE(EXCLUDED.ip_address, iot_devices.ip_address),
            firmware_version = COALESCE(EXCLUDED.firmware_version, iot_devices.firmware_version),
            last_seen_at = NOW()
        RETURNING id
        "#,
    )
    .bind(uid)
    .bind(ip)
    .bind(firmware)
    .fetch_one(pool)
    .await;

    match device_id {
        Ok(device_id) => {
            if let Err(error) = sqlx::query(
                "INSERT INTO iot_device_telemetry \
                 (iot_device_id, device_uid, record_type, ip_address, rssi, firmware_version, uptime_ms) \
                 VALUES ($1, $2, 'TELEMETRY', $3, $4, $5, $6)",
            )
            .bind(device_id)
            .bind(uid)
            .bind(ip)
            .bind(rssi)
            .bind(firmware)
            .bind(uptime_ms)
            .execute(pool)
            .await
            {
                tracing::error!("Failed to save IoT telemetry for {uid}: {error}");
            }
        }
        Err(error) => {
            tracing::error!("Failed to update discovered IoT device {uid}: {error}");
        }
    }
}
