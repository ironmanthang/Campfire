use std::path::Path;

/// Internal helper used by sync commands to apply a millisecond-precision
/// timestamp to a file. Lives outside the sync commands module to keep
/// `#[tauri::command]`-decorated functions together, but is not part of
/// the public API (only reachable via `super::sync_helpers`).
pub fn set_file_timestamp_internal(file_path: &Path, timestamp_ms: u64) -> Result<(), String> {
    let sec = (timestamp_ms / 1000) as i64;
    let nsec = ((timestamp_ms % 1000) * 1_000_000) as u32;
    let ft = filetime::FileTime::from_unix_time(sec, nsec);
    filetime::set_file_times(file_path, ft, ft).map_err(|e| e.to_string())?;
    Ok(())
}
