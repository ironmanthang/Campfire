use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(default)]
pub struct AppConfig {
    pub version: u32,
    pub user_name: String,
    pub journal_dir: String,
    pub theme: String,
    pub autosave_interval: u32, // in seconds (e.g. 1, 10, 60, or 0 for off)
    pub config_section_order: Vec<String>,
    pub language: String,
    pub web_search_enabled: bool,
    pub web_search_provider: String,
    pub web_search_api_key: String,
    pub web_search_google_cx: String,
    pub google_drive_client_id: String,
    // Legacy field kept for forward-compatible deserialization of older config files.
    // Desktop-app OAuth clients do not use a client secret; we never read it.
    #[serde(default, rename = "google_drive_client_secret")]
    _google_drive_client_secret: String,
    pub google_drive_auto_sync: bool,
    pub custom_logo: String,
    pub custom_title: String,
    pub custom_subtitle: String,
    pub system_instruction_mode: String,
    pub custom_system_instruction: String,
    pub pwa_url: String,
}

fn default_section_order() -> Vec<String> {
    vec![
        "identity".to_string(),
        "ollama".to_string(),
        "pwa".to_string(),
        "web_search".to_string(),
        "legacy".to_string(),
    ]
}

fn default_language() -> String {
    "en".to_string()
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            version: 1,
            user_name: String::new(),
            journal_dir: String::new(),
            theme: "dark".to_string(), // Default to cozy dark theme
            autosave_interval: 1,      // Default to 1s
            config_section_order: default_section_order(),
            language: default_language(),
            web_search_enabled: false,
            web_search_provider: "brave_free".to_string(),
            web_search_api_key: String::new(),
            web_search_google_cx: String::new(),
            google_drive_client_id: String::new(),
            _google_drive_client_secret: String::new(),
            google_drive_auto_sync: false,
            custom_logo: String::new(),
            custom_title: String::new(),
            custom_subtitle: String::new(),
            system_instruction_mode: "default".to_string(),
            custom_system_instruction: String::new(),
            pwa_url: "https://app-campfire.pages.dev/".to_string(),
        }
    }
}

fn get_config_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?;
    // Ensure the config directory exists
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(path.join("config.json"))
}

#[tauri::command]
pub fn load_config(app: AppHandle) -> Result<AppConfig, String> {
    let path = get_config_path(&app)?;
    if !path.exists() {
        return Ok(AppConfig::default());
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let mut config: AppConfig = serde_json::from_str(&content).unwrap_or_else(|e| {
        eprintln!("Warning: Failed to parse config.json ({}). Falling back to defaults.", e);
        AppConfig::default()
    });
    if config.web_search_provider == "ddg_instant" {
        config.web_search_provider = "brave_free".to_string();
    }
    Ok(config)
}

#[tauri::command]
pub fn save_config(app: AppHandle, config: AppConfig) -> Result<(), String> {
    let path = get_config_path(&app)?;
    let content = serde_json::to_string_pretty(&config).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}

const CHARSET: &[u8; 64] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";

fn encode_base64(input: &[u8]) -> String {
    let mut result = String::new();
    let mut val = 0;
    let mut valb = -6;
    for &c in input {
        val = (val << 8) + c as u32;
        valb += 8;
        while valb >= 0 {
            result.push(CHARSET[((val >> valb) & 0x3F) as usize] as char);
            valb -= 6;
        }
    }
    if valb > -6 {
        result.push(CHARSET[((val << (8 - (valb + 8))) & 0x3F) as usize] as char);
    }
    while result.len() % 4 != 0 {
        result.push('=');
    }
    result
}

#[tauri::command]
pub fn read_image_as_base64(path: String) -> Result<String, String> {
    let bytes = std::fs::read(&path).map_err(|e| e.to_string())?;
    let ext = std::path::Path::new(&path)
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("png")
        .to_lowercase();
    let mime = match ext.as_str() {
        "jpg" | "jpeg" => "image/jpeg",
        "png" => "image/png",
        "gif" => "image/gif",
        "webp" => "image/webp",
        "svg" => "image/svg+xml",
        _ => "image/png",
    };
    let base64_str = encode_base64(&bytes);
    Ok(format!("data:{};base64,{}", mime, base64_str))
}
