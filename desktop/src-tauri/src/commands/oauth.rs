use std::fs;
use std::io::{Read, Write};
use std::net::TcpListener;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};
use tauri_plugin_opener::OpenerExt;


#[derive(Serialize, Deserialize, Clone, Debug)]
struct SavedCredentials {
    client_id: String,
    client_secret: String,
    refresh_token: String,
}

/// Google OAuth client secret, baked in at build time from `desktop/.env`
/// (`VITE_GOOGLE_CLIENT_SECRET` is also read by the Vite frontend).
/// For a self-published desktop app, this is the developer's own OAuth
/// client secret — not a user-supplied one. See docs/microsoft_store_publishing_guide_2026.md §3.1.
const GOOGLE_CLIENT_SECRET: &str = env!("VITE_GOOGLE_CLIENT_SECRET");

#[tauri::command]
pub async fn start_gdrive_auth(app: AppHandle, client_id: String) -> Result<String, String> {
    if client_id.trim().is_empty() {
        return Err("Client ID cannot be empty".to_string());
    }
    if GOOGLE_CLIENT_SECRET.trim().is_empty() {
        return Err("VITE_GOOGLE_CLIENT_SECRET is not set in the build environment. Add it to desktop/.env.".to_string());
    }

    // Bind to 127.0.0.1:0 for an ephemeral dynamic loopback port
    let listener = TcpListener::bind("127.0.0.1:0").map_err(|e| e.to_string())?;
    let port = listener.local_addr().map_err(|e| e.to_string())?.port();
    
    let redirect_uri = format!("http://127.0.0.1:{}", port);
    let redirect_uri_encoded = format!("http%3A%2F%2F127.0.0.1%3A{}", port);

    let auth_url = format!(
        "https://accounts.google.com/o/oauth2/v2/auth?client_id={}&redirect_uri={}&response_type=code&scope=https://www.googleapis.com/auth/drive.file&access_type=offline&prompt=consent",
        client_id,
        redirect_uri_encoded
    );

    // Open Google Sign-In URL in default web browser
    app.opener().open_url(&auth_url, None::<String>).map_err(|e| e.to_string())?;

    // Block and listen for redirect response (1 connection)
    let mut code = None;
    if let Ok((mut stream, _)) = listener.accept() {
        let mut buffer = [0; 1024];
        if let Ok(size) = stream.read(&mut buffer) {
            let request = String::from_utf8_lossy(&buffer[..size]);
            // Extract the OAuth code parameter from GET request URL
            if let Some(code_pos) = request.find("code=") {
                let start = code_pos + 5;
                let end = request[start..].find('&')
                    .map(|i| start + i)
                    .unwrap_or_else(|| {
                        request[start..].find(' ')
                            .map(|i| start + i)
                            .unwrap_or(request.len())
                    });
                code = Some(request[start..end].to_string());
            }
        }

        // Return a successful HTML confirmation page to user
        let html_response = "HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=UTF-8\r\n\r\n\
        <html>\
          <head>\
            <title>Campfire Auth Success</title>\
            <style>\
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; text-align: center; padding-top: 60px; background-color: #15141b; color: #e6e6e8; }\
              .container { max-width: 480px; margin: 0 auto; background: #1e1d24; border: 1px solid #2d2b38; padding: 40px; border-radius: 20px; box-shadow: 0 10px 30px rgba(0,0,0,0.3); }\
              h1 { color: #58a6ff; font-weight: 700; font-size: 24px; margin-bottom: 16px; }\
              p { color: #9b9a9e; font-size: 15px; line-height: 1.6; margin-bottom: 24px; }\
              .badge { display: inline-block; padding: 6px 12px; font-weight: bold; background: rgba(88,166,255,0.1); border: 1px solid rgba(88,166,255,0.2); color: #58a6ff; border-radius: 8px; font-size: 13px; }\
            </style>\
          </head>\
          <body>\
            <div class='container'>\
              <h1>Campfire Connected</h1>\
              <p>Google Drive authentication succeeded. You can safely close this browser window and return to Campfire.</p>\
              <div class='badge'>Authorized successfully</div>\
            </div>\
          </body>\
        </html>";
        let _ = stream.write_all(html_response.as_bytes());
        let _ = stream.flush();
    }

    let auth_code = code.ok_or_else(|| "Failed to capture Google auth code from browser redirect".to_string())?;

    // Exchange auth code for access & refresh tokens.
    // The client_secret belongs to the developer's own OAuth client (not a user
    // secret) and is baked into the binary at build time.
    let client = reqwest::Client::new();
    let response = client.post("https://oauth2.googleapis.com/token")
        .form(&[
            ("code", auth_code.as_str()),
            ("client_id", client_id.as_str()),
            ("client_secret", GOOGLE_CLIENT_SECRET),
            ("redirect_uri", redirect_uri.as_str()),
            ("grant_type", "authorization_code"),
        ])
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token exchange failed: {}", error_text));
    }

    #[derive(Deserialize)]
    struct TokenResponse {
        access_token: String,
        refresh_token: Option<String>,
    }

    let tokens: TokenResponse = response.json().await.map_err(|e| format!("JSON parsing failed: {}", e))?;
    let refresh_token = tokens.refresh_token.ok_or_else(|| {
        "Google did not return a refresh token. If you previously authorized Campfire, please go to your Google Account security settings, revoke access, and click Connect again."
            .to_string()
    })?;

    // Save refresh token to app config directory
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let cred_path = config_dir.join("gdrive_credentials.json");

    let saved = SavedCredentials {
        client_id: client_id.clone(),
        client_secret: GOOGLE_CLIENT_SECRET.to_string(),
        refresh_token,
    };

    let cred_content = serde_json::to_string_pretty(&saved).map_err(|e| e.to_string())?;
    fs::write(cred_path, cred_content).map_err(|e| e.to_string())?;

    Ok(tokens.access_token)
}

#[tauri::command]
pub async fn get_gdrive_token(app: AppHandle) -> Result<String, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let cred_path = config_dir.join("gdrive_credentials.json");
    if !cred_path.exists() {
        return Err("NOT_AUTHENTICATED".to_string());
    }

    let content = fs::read_to_string(cred_path).map_err(|e| e.to_string())?;
    let saved: SavedCredentials = serde_json::from_str(&content).map_err(|e| e.to_string())?;

    let client = reqwest::Client::new();
    let response = client.post("https://oauth2.googleapis.com/token")
        .form(&[
            ("client_id", saved.client_id.as_str()),
            ("client_secret", saved.client_secret.as_str()),
            ("refresh_token", saved.refresh_token.as_str()),
            ("grant_type", "refresh_token"),
        ])
        .send()
        .await
        .map_err(|e| format!("Network error: {}", e))?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        return Err(format!("Token refresh failed: {}", error_text));
    }

    #[derive(Deserialize)]
    struct RefreshResponse {
        access_token: String,
    }

    let token_resp: RefreshResponse = response.json().await.map_err(|e| format!("JSON parsing failed: {}", e))?;
    Ok(token_resp.access_token)
}

#[tauri::command]
pub fn check_gdrive_connected(app: AppHandle) -> Result<bool, String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let cred_path = config_dir.join("gdrive_credentials.json");
    Ok(cred_path.exists())
}

#[tauri::command]
pub fn disconnect_gdrive(app: AppHandle) -> Result<(), String> {
    let config_dir = app.path().app_config_dir().map_err(|e| e.to_string())?;
    let cred_path = config_dir.join("gdrive_credentials.json");
    if cred_path.exists() {
        fs::remove_file(cred_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
