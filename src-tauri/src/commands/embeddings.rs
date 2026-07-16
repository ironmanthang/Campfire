use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use crate::commands::journal::is_valid_date_file;

#[derive(Serialize, Deserialize, Debug)]
pub struct EntryHash {
    pub date: String,
    pub hash: String,
}

#[tauri::command]
pub fn get_entry_hashes(dir_path: String) -> Result<Vec<EntryHash>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let mut hashes = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if is_valid_date_file(&file_name) {
            let date = file_name.replace(".md", "");
            let file_path = entry.path();
            let content = fs::read_to_string(&file_path).unwrap_or_default();

            use std::collections::hash_map::DefaultHasher;
            use std::hash::Hasher;
            let mut hasher = DefaultHasher::new();
            hasher.write(content.as_bytes());
            let hash_val = hasher.finish();

            hashes.push(EntryHash {
                date,
                hash: format!("{:x}", hash_val),
            });
        }
    }

    Ok(hashes)
}

#[tauri::command]
pub fn load_embeddings_cache(dir_path: String) -> Result<String, String> {
    let path = Path::new(&dir_path).join(".embeddings_cache.json");
    if !path.exists() {
        return Ok("{}".to_string());
    }
    fs::read_to_string(path).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn save_embeddings_cache(dir_path: String, cache_json: String) -> Result<(), String> {
    let path = Path::new(&dir_path).join(".embeddings_cache.json");
    fs::write(path, cache_json).map_err(|e| e.to_string())
}
