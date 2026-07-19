use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};

use super::helpers::is_valid_date_file;
use super::sync_helpers::set_file_timestamp_internal;

#[derive(Serialize, Deserialize, Debug)]
pub struct LocalEntrySyncInfo {
    pub date: String,
    pub content: String,
    pub last_modified: u64, // ms since UNIX epoch
}

#[tauri::command]
pub fn list_local_entries_for_sync(dir_path: String) -> Result<Vec<LocalEntrySyncInfo>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let mut list = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if is_valid_date_file(&file_name) {
            let date = file_name.replace(".md", "");
            let file_path = entry.path();
            let content = fs::read_to_string(&file_path).unwrap_or_default();

            let metadata = fs::metadata(&file_path).map_err(|e| e.to_string())?;
            let modified = metadata.modified().map_err(|e| e.to_string())?;
            let last_modified = modified
                .duration_since(std::time::SystemTime::UNIX_EPOCH)
                .map_err(|e| e.to_string())?
                .as_millis() as u64;

            list.push(LocalEntrySyncInfo {
                date,
                content,
                last_modified,
            });
        }
    }

    Ok(list)
}

#[tauri::command]
pub fn write_entry_with_timestamp(
    dir_path: String,
    date: String,
    content: String,
    timestamp_ms: u64,
) -> Result<(), String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let file_path = path.join(format!("{}.md", date));
    if content.trim().is_empty() {
        if file_path.exists() {
            fs::remove_file(&file_path).map_err(|e| e.to_string())?;
        }
        return Ok(());
    }

    fs::write(&file_path, content).map_err(|e| e.to_string())?;

    // Set file timestamp
    set_file_timestamp_internal(&file_path, timestamp_ms)?;

    Ok(())
}

#[tauri::command]
pub fn set_file_timestamp(dir_path: String, date: String, timestamp_ms: u64) -> Result<(), String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let file_path = path.join(format!("{}.md", date));
    if !file_path.exists() {
        return Err("Journal entry file does not exist".to_string());
    }

    set_file_timestamp_internal(&file_path, timestamp_ms)
}

#[tauri::command]
pub fn read_sync_base(dir_path: String, date: String) -> Result<String, String> {
    let path = Path::new(&dir_path).join(".campfire_sync_base");
    let file_path = path.join(format!("{}.md", date));
    if !file_path.exists() {
        return Ok(String::new());
    }
    fs::read_to_string(file_path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn write_sync_base(dir_path: String, date: String, content: String) -> Result<(), String> {
    let path = Path::new(&dir_path).join(".campfire_sync_base");
    fs::create_dir_all(&path).map_err(|e| e.to_string())?;
    let file_path = path.join(format!("{}.md", date));
    fs::write(file_path, content).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_sync_base(dir_path: String, date: String) -> Result<(), String> {
    let path = Path::new(&dir_path).join(".campfire_sync_base");
    let file_path = path.join(format!("{}.md", date));
    if file_path.exists() {
        fs::remove_file(file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}
