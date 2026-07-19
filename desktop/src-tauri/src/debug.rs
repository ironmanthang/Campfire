use std::fs;
use std::path::Path;

// DEBUG: Helper to write debug payload
#[tauri::command]
pub fn write_debug_payload(dir_path: String, filename: String, content: String) -> Result<(), String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }
    let file_path = path.join(filename);
    fs::write(file_path, content).map_err(|e| e.to_string())?;
    Ok(())
}
