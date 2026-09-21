use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WebSearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
}

pub fn get_safe_slice(s: &str, start: usize, mut end: usize) -> &str {
    if start >= s.len() {
        return "";
    }
    let mut start_idx = start;
    while start_idx > 0 && !s.is_char_boundary(start_idx) {
        start_idx -= 1;
    }
    if end > s.len() {
        end = s.len();
    }
    while end > start_idx && !s.is_char_boundary(end) {
        end -= 1;
    }
    &s[start_idx..end]
}

pub fn clean_html(input: &str) -> String {
    let mut result = String::new();
    let mut in_tag = false;
    let mut chars = input.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '<' {
            in_tag = true;
        } else if c == '>' {
            in_tag = false;
        } else if !in_tag {
            result.push(c);
        }
    }
    result = result
        .replace("&amp;", "&")
        .replace("&quot;", "\"")
        .replace("&#x27;", "'")
        .replace("&apos;", "'")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
        .replace("&nbsp;", " ")
        .replace("&#39;", "'")
        .replace("&#x3D;", "=")
        .replace("&middot;", "·")
        .replace("&bull;", "•");
        
    let mut cleaned = String::new();
    let mut last_was_space = false;
    for c in result.chars() {
        if c.is_whitespace() {
            if !last_was_space {
                cleaned.push(' ');
                last_was_space = true;
            }
        } else {
            cleaned.push(c);
            last_was_space = false;
        }
    }
    cleaned.trim().to_string()
}

pub fn url_decode(input: &str) -> String {
    let mut result = String::new();
    let bytes = input.as_bytes();
    let mut i = 0;
    while i < bytes.len() {
        if bytes[i] == b'%' && i + 2 < bytes.len() {
            if let Ok(val) = u8::from_str_radix(std::str::from_utf8(&bytes[i + 1..i + 3]).unwrap_or(""), 16) {
                result.push(val as char);
                i += 3;
                continue;
            }
        } else if bytes[i] == b'+' {
            result.push(' ');
            i += 1;
            continue;
        }
        result.push(bytes[i] as char);
        i += 1;
    }
    result
}
