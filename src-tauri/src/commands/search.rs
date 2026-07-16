use std::fs;
use std::path::Path;
use serde::{Deserialize, Serialize};
use crate::commands::journal::{is_valid_date_file, extract_tags, extract_preview};

#[derive(Serialize, Deserialize, Debug)]
pub struct SearchResult {
    pub date: String,
    pub line_number: usize,
    pub snippet: String,
}

#[tauri::command]
pub fn search_entries(
    dir_path: String,
    query: String,
    tag_mode: String,
) -> Result<Vec<SearchResult>, String> {
    let path = Path::new(&dir_path);
    if !path.exists() {
        return Err("Journal directory does not exist".to_string());
    }

    let query_lower = query.to_lowercase();
    let words: Vec<&str> = query_lower.split_whitespace().collect();
    let mut search_tags = Vec::new();
    let mut keyword_parts = Vec::new();

    for word in words {
        if word.starts_with('#') && word.len() > 1 {
            let tag_candidate = word.trim_start_matches('#');
            let cleaned_tag: String = tag_candidate
                .chars()
                .take_while(|c| c.is_alphanumeric() || *c == '_' || *c == '-')
                .collect();
            if !cleaned_tag.is_empty() {
                search_tags.push(cleaned_tag);
            }
        } else {
            keyword_parts.push(word);
        }
    }

    let keyword_query = keyword_parts.join(" ");
    let mut results = Vec::new();
    let entries = fs::read_dir(path).map_err(|e| e.to_string())?;

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let file_name = entry.file_name().into_string().map_err(|_| "Invalid filename")?;

        if is_valid_date_file(&file_name) {
            let date = file_name.replace(".md", "");
            let file_path = entry.path();
            let content = fs::read_to_string(&file_path).unwrap_or_default();

            if content.trim().is_empty() {
                continue;
            }

            // Tag check
            if !search_tags.is_empty() {
                let entry_tags = extract_tags(&content);
                let entry_tags_lower: Vec<String> = entry_tags.iter().map(|t| t.to_lowercase()).collect();

                let matches_tags = if tag_mode.to_lowercase() == "or" {
                    search_tags.iter().any(|t| entry_tags_lower.contains(t))
                } else {
                    search_tags.iter().all(|t| entry_tags_lower.contains(t))
                };

                if !matches_tags {
                    continue;
                }
            }

            // Keyword check
            if keyword_query.is_empty() {
                let preview = extract_preview(&content, 120);
                results.push(SearchResult {
                    date,
                    line_number: 1,
                    snippet: preview,
                });
            } else {
                for (idx, line) in content.lines().enumerate() {
                    if line.to_lowercase().contains(&keyword_query) {
                        results.push(SearchResult {
                            date: date.clone(),
                            line_number: idx + 1,
                            snippet: line.trim().to_string(),
                        });
                    }
                }
            }
        }
    }

    results.sort_by(|a, b| {
        let cmp_date = b.date.cmp(&a.date);
        if cmp_date == std::cmp::Ordering::Equal {
            a.line_number.cmp(&b.line_number)
        } else {
            cmp_date
        }
    });

    Ok(results)
}
