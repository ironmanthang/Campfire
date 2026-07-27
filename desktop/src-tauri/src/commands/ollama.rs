use futures_util::StreamExt;
use serde_json::Value;
use std::time::Duration;
use tauri::ipc::Channel;

fn get_base_url(base_url: Option<String>) -> String {
    let url = base_url.unwrap_or_default();
    let trimmed = url.trim().trim_end_matches('/');
    if trimmed.is_empty() {
        "http://127.0.0.1:11434".to_string()
    } else {
        trimmed.replace("localhost", "127.0.0.1")
    }
}

#[tauri::command]
pub async fn check_ollama_status(base_url: Option<String>) -> Result<bool, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(3))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    match client.get(&url).send().await {
        Ok(res) => Ok(res.status().is_success()),
        Err(_) => Ok(false),
    }
}

#[tauri::command]
pub async fn get_ollama_tags(base_url: Option<String>) -> Result<Value, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/tags", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to query Ollama tags: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama API returned status {}", res.status()));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn get_ollama_show(base_url: Option<String>, model: String) -> Result<Value, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/show", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .post(&url)
        .json(&serde_json::json!({ "name": model }))
        .send()
        .await
        .map_err(|e| format!("Failed to query Ollama show for {}: {}", model, e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama show returned status {}", res.status()));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn get_ollama_ps(base_url: Option<String>) -> Result<Value, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/ps", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(5))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to query Ollama ps: {}", e))?;

    if !res.status().is_success() {
        return Err(format!("Ollama ps returned status {}", res.status()));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn proxy_ollama_embed(
    base_url: Option<String>,
    payload: Value,
) -> Result<Value, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/embed", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(60))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to send Ollama embed request: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Ollama embed error: {}", err_text));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse Ollama embed response: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn proxy_ollama_tokenize(
    base_url: Option<String>,
    payload: Value,
) -> Result<Value, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/tokenize", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(10))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to send Ollama tokenize request: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Ollama tokenize error: {}", err_text));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse Ollama tokenize response: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn proxy_ollama_chat(
    base_url: Option<String>,
    payload: Value,
) -> Result<Value, String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/chat", base);

    let client = reqwest::Client::builder()
        .timeout(Duration::from_secs(180))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to send Ollama chat request: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Ollama chat error: {}", err_text));
    }

    let val = res
        .json::<Value>()
        .await
        .map_err(|e| format!("Failed to parse Ollama chat response: {}", e))?;

    Ok(val)
}

#[tauri::command]
pub async fn proxy_ollama_chat_stream(
    base_url: Option<String>,
    payload: Value,
    on_chunk: Channel<Value>,
) -> Result<(), String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/chat", base);

    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to connect to Ollama: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Ollama API error: {}", err_text));
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

            if !line.is_empty() {
                if let Ok(parsed) = serde_json::from_str::<Value>(&line) {
                    if on_chunk.send(parsed).is_err() {
                        return Ok(());
                    }
                }
            }
        }
    }

    if !buffer.trim().is_empty() {
        if let Ok(parsed) = serde_json::from_str::<Value>(buffer.trim()) {
            let _ = on_chunk.send(parsed);
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn proxy_ollama_pull_stream(
    base_url: Option<String>,
    model: String,
    on_chunk: Channel<Value>,
) -> Result<(), String> {
    let base = get_base_url(base_url);
    let url = format!("{}/api/pull", base);

    let client = reqwest::Client::new();
    let res = client
        .post(&url)
        .json(&serde_json::json!({ "name": model, "stream": true }))
        .send()
        .await
        .map_err(|e| format!("Failed to trigger download: {}", e))?;

    if !res.status().is_success() {
        let err_text = res.text().await.unwrap_or_default();
        return Err(format!("Download error: {}", err_text));
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

            if !line.is_empty() {
                if let Ok(parsed) = serde_json::from_str::<Value>(&line) {
                    let _ = on_chunk.send(parsed);
                }
            }
        }
    }

    if !buffer.trim().is_empty() {
        if let Ok(parsed) = serde_json::from_str::<Value>(buffer.trim()) {
            let _ = on_chunk.send(parsed);
        }
    }

    Ok(())
}
