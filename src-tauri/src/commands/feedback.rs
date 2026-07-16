
#[tauri::command]
pub async fn submit_feedback(
    description: String,
    user_email: String,
    app_version: String,
    system_platform: Option<String>,
    user_agent: Option<String>,
    screen_resolution: Option<String>,
    app_language: Option<String>,
    time_zone: Option<String>,
    submission_time: Option<String>,
) -> Result<String, String> {
    use reqwest::multipart;

    let mut form = multipart::Form::new()
        .text("description", description)
        .text("user_email", user_email)
        .text("app_version", app_version);

    if let Some(val) = system_platform {
        form = form.text("System Platform", val);
    }
    if let Some(val) = user_agent {
        form = form.text("User Agent", val);
    }
    if let Some(val) = screen_resolution {
        form = form.text("Screen Resolution", val);
    }
    if let Some(val) = app_language {
        form = form.text("App Language", val);
    }
    if let Some(val) = time_zone {
        form = form.text("Time Zone", val);
    }
    if let Some(val) = submission_time {
        form = form.text("Submission Time (UTC)", val);
    }

    let client = reqwest::Client::new();
    let res = client.post("https://formsubmit.co/ajax/acfb49b85d5fa14ddcb3caf5622c9323")
        .header("Origin", "http://localhost:1420")
        .header("Referer", "http://localhost:1420/")
        .multipart(form)
        .send()
        .await
        .map_err(|e| format!("Feedback submission failed: {}", e))?;

    let status = res.status();
    let text = res.text().await.unwrap_or_default();

    if status.is_success() {
        Ok(text)
    } else {
        Err(format!("FormSubmit feedback request failed ({}): {}", status, text))
    }
}
