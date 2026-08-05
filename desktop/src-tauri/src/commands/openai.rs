use futures_util::StreamExt;
use serde_json::Value;
use std::time::Duration;
use tauri::ipc::Channel;

fn normalize_base_url(url: Option<String>) -> String {
    let raw = url.unwrap_or_default();
    let trimmed = raw.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        "http://127.0.0.1:8080/v1".to_string()
    } else {
        trimmed.replace("localhost", "127.0.0.1")
    }
}

fn get_chat_completions_url(base: &str) -> String {
    if base.ends_with("/chat/completions") {
        base.to_string()
    } else if base.ends_with("/v1") || base.ends_with("/openai") {
        format!("{}/chat/completions", base)
    } else {
        format!("{}/chat/completions", base)
    }
}

fn get_models_url(base: &str) -> String {
    if base.ends_with("/models") {
        base.to_string()
    } else {
        format!("{}/models", base)
    }
}

fn build_reqwest_client(timeout_secs: u64) -> Result<reqwest::Client, String> {
    reqwest::Client::builder()
        .timeout(Duration::from_secs(timeout_secs))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

#[tauri::command]
pub async fn check_openai_status(
    base_url: Option<String>,
    api_key: Option<String>,
) -> Result<bool, String> {
    let base = normalize_base_url(base_url);
    let models_url = get_models_url(&base);
    let client = build_reqwest_client(5)?;

    let mut req = client.get(&models_url);
    if let Some(key) = api_key {
        let trimmed_key = key.trim();
        if !trimmed_key.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", trimmed_key));
        }
    }

    match req.send().await {
        Ok(res) => {
            if res.status().is_success() {
                Ok(true)
            } else {
                // For local servers (llama-server), /models might return 404 if not implemented, check /health
                if base.contains("127.0.0.1") || base.contains("localhost") {
                    let health_url = format!("{}/health", base);
                    if let Ok(h_res) = client.get(&health_url).send().await {
                        if h_res.status().is_success() {
                            return Ok(true);
                        }
                    }
                }
                Ok(false)
            }
        }
        Err(_) => {
            // For local servers (llama-server), try /health if /models failed connection
            if base.contains("127.0.0.1") || base.contains("localhost") {
                let health_url = format!("{}/health", base);
                if let Ok(h_res) = client.get(&health_url).send().await {
                    if h_res.status().is_success() {
                        return Ok(true);
                    }
                }
            }
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn get_openai_models(
    base_url: Option<String>,
    api_key: Option<String>,
) -> Result<Value, String> {
    let base = normalize_base_url(base_url);
    let models_url = get_models_url(&base);
    let client = build_reqwest_client(10)?;

    let mut req = client.get(&models_url);
    if let Some(key) = api_key {
        let trimmed_key = key.trim();
        if !trimmed_key.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", trimmed_key));
        }
    }

    let res = req
        .send()
        .await
        .map_err(|e| format!("Failed to query OpenAI models at {}: {}", models_url, e))?;

    if !res.status().is_success() {
        return Err(format!("OpenAI models API returned status HTTP {}", res.status()));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse JSON response: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn proxy_openai_chat_stream(
    base_url: Option<String>,
    api_key: Option<String>,
    payload: Value,
    on_chunk: Channel<Value>,
) -> Result<(), String> {
    let base = normalize_base_url(base_url);
    let chat_url = get_chat_completions_url(&base);

    let client = reqwest::Client::new();
    let mut req = client.post(&chat_url).json(&payload);

    if let Some(key) = api_key {
        let trimmed_key = key.trim();
        if !trimmed_key.is_empty() {
            req = req.header("Authorization", format!("Bearer {}", trimmed_key));
        }
    }

    let res = req
        .send()
        .await
        .map_err(|e| format!("Failed to send chat request to {}: {}", chat_url, e))?;

    if !res.status().is_success() {
        let status = res.status();
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("OpenAI API returned HTTP {}: {}", status, err_text));
    }

    let mut stream = res.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let bytes = chunk_result.map_err(|e| format!("Error reading stream: {}", e))?;
        let text = String::from_utf8_lossy(&bytes);
        buffer.push_str(&text);

        while let Some(pos) = buffer.find('\n') {
            let line = buffer[..pos].trim().to_string();
            buffer.drain(..pos + 1);

            if line.is_empty() || line.starts_with(':') {
                continue;
            }

            if line.starts_with("data: ") {
                let data_str = line.trim_start_matches("data: ").trim();
                if data_str == "[DONE]" {
                    return Ok(());
                }

                if let Ok(parsed) = serde_json::from_str::<Value>(data_str) {
                    if on_chunk.send(parsed).is_err() {
                        return Ok(());
                    }
                }
            }
        }
    }

    if !buffer.trim().is_empty() {
        let line = buffer.trim();
        if line.starts_with("data: ") {
            let data_str = line.trim_start_matches("data: ").trim();
            if data_str != "[DONE]" {
                if let Ok(parsed) = serde_json::from_str::<Value>(data_str) {
                    let _ = on_chunk.send(parsed);
                }
            }
        }
    }

    Ok(())
}
