use std::fs;
use std::path::Path;

use super::helpers::{
    extract_preview, extract_tags, is_valid_date_file, ExportedEntry, ImportError, ImportReport,
    ImportSkippedEntry, JournalEntryMetadata,
};

fn append_imported_content(original: &str, imported: &str, source_name: &str) -> String {
    let mut combined = String::from(original.trim_end());
    combined.push_str("\n\n---\n");
    combined.push_str(&format!("*Imported from {}*\n\n", source_name));
    combined.push_str(imported.trim_start());
    combined
}

fn import_exported_entries(
    dir_path: &Path,
    source_name: &str,
    source_format: &str,
    entries: Vec<(String, String)>,
) -> Result<ImportReport, String> {
    let mut report = ImportReport {
        source_format: source_format.to_string(),
        new_entries: Vec::new(),
        appended_entries: Vec::new(),
        skipped: Vec::new(),
        errors: Vec::new(),
    };

    for (date, content) in entries {
        let file_name = format!("{}.md", date);
        if !is_valid_date_file(&file_name) {
            report.errors.push(ImportError {
                date: Some(date),
                message: "Invalid date format".to_string(),
            });
            continue;
        }

        if content.trim().is_empty() {
            report.skipped.push(ImportSkippedEntry {
                date,
                reason: "empty content".to_string(),
            });
            continue;
        }

        let file_path = dir_path.join(&file_name);
        if file_path.exists() {
            let original = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
            if original.trim() == content.trim() {
                report.skipped.push(ImportSkippedEntry {
                    date,
                    reason: "identical content".to_string(),
                });
                continue;
            }
            let merged = append_imported_content(&original, &content, source_name);
            fs::write(&file_path, merged).map_err(|e| e.to_string())?;
            report.appended_entries.push(date);
        } else {
            fs::write(&file_path, content).map_err(|e| e.to_string())?;
            report.new_entries.push(date);
        }
    }

    Ok(report)
}

fn parse_json_import(raw: &str) -> Result<Vec<(String, String)>, String> {
    let entries: Vec<ExportedEntry> = serde_json::from_str(raw).map_err(|e| e.to_string())?;
    Ok(entries.into_iter().map(|entry| (entry.date, entry.content)).collect())
}

fn parse_md_import(raw: &str) -> Result<Vec<(String, String)>, String> {
    let mut entries = Vec::new();
    let marker = "========================================";

    let chunks: Vec<&str> = raw
        .split(marker)
        .map(|chunk| chunk.trim())
        .filter(|chunk| !chunk.is_empty())
        .collect();

    let mut index = 0usize;
    while index < chunks.len() {
        let date_chunk = chunks[index];
        let mut date_lines = date_chunk.lines();
        let date_line = date_lines
            .next()
            .ok_or_else(|| "Invalid markdown export: missing date line".to_string())?
            .trim();
        let date = date_line
            .strip_prefix("DATE: ")
            .ok_or_else(|| "Invalid markdown export: missing DATE header".to_string())?
            .to_string();

        let content_chunk = chunks.get(index + 1).copied().unwrap_or("");
        let content = content_chunk.trim().to_string();
        entries.push((date, content));
        index += 2;
    }

    Ok(entries)
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
pub fn import_journal(dir_path: String, file_path: String) -> Result<ImportReport, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let source_name = Path::new(&file_path)
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or("import file")
        .to_string();

    let raw = fs::read_to_string(&file_path).map_err(|e| e.to_string())?;
    let trimmed = raw.trim_start();
    let entries = if trimmed.starts_with('[') {
        parse_json_import(&raw)?
    } else {
        parse_md_import(&raw)?
    };
    let source_format = if trimmed.starts_with('[') { "json" } else { "md" };

    import_exported_entries(path, &source_name, source_format, entries)
}
