use std::fs;
use std::path::Path;
use super::journal::is_valid_date_file;

#[tauri::command]
pub fn create_journal_backup(dir_path: String) -> Result<(), String> {
    let base_path = Path::new(&dir_path);
    if !base_path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let backups_dir = base_path.join(".backups");
    fs::create_dir_all(&backups_dir).map_err(|e| e.to_string())?;

    // Use current system time unix timestamp as subfolder name
    let timestamp = std::time::SystemTime::now()
        .duration_since(std::time::SystemTime::UNIX_EPOCH)
        .map_err(|e| e.to_string())?
        .as_secs();

    let backup_subfolder = backups_dir.join(format!("backup_{}", timestamp));
    fs::create_dir_all(&backup_subfolder).map_err(|e| e.to_string())?;

    // Copy all valid YYYY-MM-DD.md files
    let entries = fs::read_dir(base_path).map_err(|e| e.to_string())?;
    for entry in entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|f| f.to_str()) {
                    if is_valid_date_file(file_name) {
                        let dest_path = backup_subfolder.join(file_name);
                        fs::copy(&path, &dest_path).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    // Pruning: Maintain only the 5 most recent backups
    let mut backup_folders = Vec::new();
    let backup_entries = fs::read_dir(&backups_dir).map_err(|e| e.to_string())?;
    for entry in backup_entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("backup_") {
                        // Extract timestamp for sorting
                        if let Ok(ts) = name.trim_start_matches("backup_").parse::<u64>() {
                            backup_folders.push((ts, path));
                        }
                    }
                }
            }
        }
    }

    // Sort ascending by timestamp (oldest first)
    backup_folders.sort_by_key(|item| item.0);

    // If more than 5, delete oldest
    if backup_folders.len() > 5 {
        let to_delete_count = backup_folders.len() - 5;
        for i in 0..to_delete_count {
            let (_, path_to_delete) = &backup_folders[i];
            fs::remove_dir_all(path_to_delete).map_err(|e| e.to_string())?;
        }
    }

    Ok(())
}

#[tauri::command]
pub fn list_journal_backups(dir_path: String) -> Result<Vec<u64>, String> {
    let base_path = Path::new(&dir_path);
    if !base_path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let backups_dir = base_path.join(".backups");
    if !backups_dir.exists() {
        return Ok(Vec::new());
    }

    let mut timestamps = Vec::new();
    let backup_entries = fs::read_dir(&backups_dir).map_err(|e| e.to_string())?;
    for entry in backup_entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_dir() {
                if let Some(name) = path.file_name().and_then(|n| n.to_str()) {
                    if name.starts_with("backup_") {
                        if let Ok(ts) = name.trim_start_matches("backup_").parse::<u64>() {
                            timestamps.push(ts);
                        }
                    }
                }
            }
        }
    }

    // Sort descending (newest first)
    timestamps.sort_by(|a, b| b.cmp(a));

    Ok(timestamps)
}

#[tauri::command]
pub fn restore_journal_backup(dir_path: String, timestamp: u64) -> Result<(), String> {
    let base_path = Path::new(&dir_path);
    if !base_path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let backups_dir = base_path.join(".backups");
    let backup_folder = backups_dir.join(format!("backup_{}", timestamp));
    if !backup_folder.exists() {
        return Err(format!("Backup folder backup_{} does not exist", timestamp));
    }

    // 1. Delete all current active journal md files in dir_path to avoid conflicts
    let active_entries = fs::read_dir(base_path).map_err(|e| e.to_string())?;
    for entry in active_entries {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name().and_then(|f| f.to_str()) {
                    if is_valid_date_file(file_name) {
                        fs::remove_file(&path).map_err(|e| e.to_string())?;
                    }
                }
            }
        }
    }

    // 2. Copy all files from backup_folder into dir_path
    let backup_files = fs::read_dir(&backup_folder).map_err(|e| e.to_string())?;
    for entry in backup_files {
        if let Ok(entry) = entry {
            let path = entry.path();
            if path.is_file() {
                if let Some(file_name) = path.file_name() {
                    let dest_path = base_path.join(file_name);
                    fs::copy(&path, &dest_path).map_err(|e| e.to_string())?;
                }
            }
        }
    }

    Ok(())
}
