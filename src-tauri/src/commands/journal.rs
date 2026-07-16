use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};


pub fn is_valid_date_file(file_name: &str) -> bool {
    if !file_name.ends_with(".md") || file_name.len() != 13 {
        return false;
    }
    let date_part = &file_name[0..10];
    let mut chars = date_part.chars();
    for (i, c) in chars.by_ref().enumerate() {
        if i == 4 || i == 7 {
            if c != '-' {
                return false;
            }
        } else if !c.is_ascii_digit() {
            return false;
        }
    }
    true
}

// NOTE: If you modify this tag extraction logic, also update extractTags in frontend src/lib/tagUtils.ts
pub fn extract_tags(content: &str) -> Vec<String> {
    let mut tags = Vec::new();
    let mut in_code_block = false;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("```") {
            in_code_block = !in_code_block;
            continue;
        }
        if in_code_block {
            continue;
        }

        for word in line.split_whitespace() {
            if word.starts_with('#') && word.len() > 1 {
                let tag_candidate = word.trim_start_matches('#');
                if tag_candidate.is_empty() {
                    continue;
                }

                let cleaned_tag: String = tag_candidate
                    .chars()
                    .take_while(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
                    .collect();

                if !cleaned_tag.is_empty() && !tags.contains(&cleaned_tag) {
                    tags.push(cleaned_tag);
                }
            }
        }
    }
    tags
}

pub fn extract_preview(content: &str, limit: usize) -> String {
    let mut preview = String::new();
    let mut in_code_block = false;

    for line in content.lines() {
        let trimmed = line.trim();
        if trimmed.starts_with("```") {
            in_code_block = !in_code_block;
            continue;
        }
        if in_code_block || trimmed.is_empty() {
            continue;
        }

        if trimmed.starts_with('#') {
            continue;
        }

        let clean_line = trimmed
            .replace("**", "")
            .replace("__", "")
            .replace("*", "")
            .replace("_", "")
            .replace("`", "");

        if !preview.is_empty() {
            preview.push(' ');
        }
        preview.push_str(&clean_line);

        if preview.len() >= limit {
            break;
        }
    }

    if preview.len() > limit {
        let mut truncated: String = preview.chars().take(limit).collect();
        truncated.push_str("...");
        truncated
    } else {
        preview
    }
}

#[derive(Serialize, Deserialize, Debug)]
pub struct JournalEntryMetadata {
    pub date: String,
    pub tags: Vec<String>,
    pub preview: String,
    pub word_count: usize,
}

#[tauri::command]
pub fn list_entries(dir_path: String) -> Result<Vec<JournalEntryMetadata>, String> {
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

            if content.trim().is_empty() {
                continue; // skip ghost entries
            }

            let tags = extract_tags(&content);
            let preview = extract_preview(&content, 120);
            let word_count = content.split_whitespace().count();

            list.push(JournalEntryMetadata {
                date,
                tags,
                preview,
                word_count,
            });
        }
    }

    list.sort_by(|a, b| b.date.cmp(&a.date));
    Ok(list)
}

#[tauri::command]
pub fn read_entry(dir_path: String, date: String) -> Result<String, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let file_path = path.join(format!("{}.md", date));
    if !file_path.exists() {
        return Ok(String::new());
    }

    let content = fs::read_to_string(file_path).map_err(|e| e.to_string())?;
    Ok(content)
}

#[tauri::command]
pub fn write_entry(dir_path: String, date: String, content: String) -> Result<(), String> {
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
    fs::write(file_path, content).map_err(|e| e.to_string())?;
    Ok(())
}

#[derive(Serialize)]
pub struct ExportedEntry {
    pub date: String,
    pub content: String,
    pub word_count: usize,
    pub tags: Vec<String>,
}

#[tauri::command]
pub fn export_journal(
    dir_path: String,
    export_type: String,
    save_path: String,
    dates: Option<Vec<String>>
) -> Result<(), String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let save_file_path = Path::new(&save_path);
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut valid_entries = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if is_valid_date_file(&file_name) {
            let date = file_name.replace(".md", "");
            if let Some(ref dates_list) = dates {
                if !dates_list.contains(&date) {
                    continue;
                }
            }
            let file_path = entry.path();
            let content = fs::read_to_string(&file_path).unwrap_or_default();
            valid_entries.push((date, content));
        }
    }

    valid_entries.sort_by(|a, b| a.0.cmp(&b.0));

    if export_type == "json" {
        let mut export_data = Vec::new();
        for (date, content) in valid_entries {
            let tags = extract_tags(&content);
            let word_count = content.split_whitespace().count();
            export_data.push(ExportedEntry {
                date,
                content,
                word_count,
                tags,
            });
        }
        let json_str = serde_json::to_string_pretty(&export_data).map_err(|e| e.to_string())?;
        fs::write(save_file_path, json_str).map_err(|e| e.to_string())?;
    } else if export_type == "text" {
        let mut text_compiled = String::new();
        for (date, content) in valid_entries {
            text_compiled.push_str(&format!("========================================\n"));
            text_compiled.push_str(&format!("DATE: {}\n", date));
            text_compiled.push_str(&format!("========================================\n\n"));
            text_compiled.push_str(&content);
            text_compiled.push_str("\n\n\n");
        }
        fs::write(save_file_path, text_compiled).map_err(|e| e.to_string())?;
    } else {
        return Err("Unsupported export type".to_string());
    }

    Ok(())
}

#[tauri::command]
pub fn get_journal_context(dir_path: String, start_date: String, end_date: String) -> Result<String, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut combined_entries = String::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut valid_entries = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if is_valid_date_file(&file_name) {
            let date_str = file_name.replace(".md", "");
            if date_str >= start_date && date_str <= end_date {
                let content = fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
                valid_entries.push((date_str, content));
            }
        }
    }

    // Sort chronologically (ascending for story continuity)
    valid_entries.sort_by(|a, b| a.0.cmp(&b.0));

    for (date_str, content) in valid_entries {
        combined_entries.push_str(&format!("--- Entry Date: {} ---\n{}\n\n", date_str, content));
    }

    Ok(combined_entries)
}

#[tauri::command]
pub fn get_journal_context_with_lines(dir_path: String, start_date: String, end_date: String) -> Result<String, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Directory does not exist".to_string());
    }

    let mut combined_entries = String::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;
    let mut valid_entries = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if is_valid_date_file(&file_name) {
            let date_str = file_name.replace(".md", "");
            if date_str >= start_date && date_str <= end_date {
                let content = fs::read_to_string(entry.path()).map_err(|e| e.to_string())?;
                valid_entries.push((date_str, content));
            }
        }
    }

    // Sort chronologically (ascending for story continuity)
    valid_entries.sort_by(|a, b| a.0.cmp(&b.0));

    for (date_str, content) in valid_entries {
        combined_entries.push_str(&format!("--- Entry Date: {} ---\n", date_str));
        for (idx, line) in content.lines().enumerate() {
            combined_entries.push_str(&format!("{}: {}\n", idx + 1, line));
        }
        combined_entries.push_str("\n");
    }

    Ok(combined_entries)
}


#[tauri::command]
pub fn delete_entry(dir_path: String, date: String) -> Result<(), String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }
    let file_path = path.join(format!("{}.md", date));
    if file_path.exists() {
        fs::remove_file(&file_path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
pub fn delete_entries(dir_path: String, dates: Vec<String>) -> Result<usize, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }
    let mut deleted = 0usize;
    for date in dates {
        let file_path = path.join(format!("{}.md", date));
        if file_path.exists() {
            if fs::remove_file(&file_path).is_ok() {
                deleted += 1;
            }
        }
    }
    Ok(deleted)
}

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

fn set_file_timestamp_internal(file_path: &Path, timestamp_ms: u64) -> Result<(), String> {
    let sec = (timestamp_ms / 1000) as i64;
    let nsec = ((timestamp_ms % 1000) * 1_000_000) as u32;
    let ft = filetime::FileTime::from_unix_time(sec, nsec);
    filetime::set_file_times(file_path, ft, ft).map_err(|e| e.to_string())?;
    Ok(())
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
