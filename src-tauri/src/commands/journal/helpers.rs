use serde::{Deserialize, Serialize};

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

#[derive(Serialize, Deserialize, Debug)]
pub struct JournalEntryMetadata {
    pub date: String,
    pub tags: Vec<String>,
    pub preview: String,
    pub word_count: usize,
}

#[derive(Serialize)]
pub struct ExportedEntry {
    pub date: String,
    pub content: String,
    pub word_count: usize,
    pub tags: Vec<String>,
}
