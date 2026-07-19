use std::fs;
use std::path::PathBuf;
use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ToolCallFunction {
    pub name: String,
    pub arguments: serde_json::Value,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct OllamaToolCall {
    pub function: ToolCallFunction,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub thinking: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub images: Option<Vec<String>>,
    #[serde(rename = "displayContent", skip_serializing_if = "Option::is_none")]
    pub display_content: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_calls: Option<Vec<OllamaToolCall>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tool_call_id: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(default)]
pub struct ChatSession {
    pub version: u32,
    pub start_date: String,
    pub end_date: String,
    pub model: String,
    pub messages: Vec<ChatMessage>,
}

impl Default for ChatSession {
    fn default() -> Self {
        Self {
            version: 1,
            start_date: String::new(),
            end_date: String::new(),
            model: String::new(),
            messages: Vec::new(),
        }
    }
}

fn get_chat_history_path(app: &AppHandle) -> Result<PathBuf, String> {
    let path = app.path().app_config_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    Ok(path.join("chat_history.json"))
}

#[tauri::command]
pub fn load_chat_history(app: AppHandle) -> Result<ChatSession, String> {
    let path = get_chat_history_path(&app)?;
    if !path.exists() {
        return Ok(ChatSession::default());
    }
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let session: ChatSession = serde_json::from_str(&content).unwrap_or_else(|e| {
        eprintln!("Warning: Failed to parse chat_history.json ({}). Falling back to default session.", e);
        ChatSession::default()
    });
    Ok(session)
}

#[tauri::command]
pub fn save_chat_history(app: AppHandle, session: ChatSession) -> Result<(), String> {
    let path = get_chat_history_path(&app)?;
    let content = serde_json::to_string_pretty(&session).map_err(|e| e.to_string())?;
    fs::write(path, content).map_err(|e| e.to_string())?;
    Ok(())
}
