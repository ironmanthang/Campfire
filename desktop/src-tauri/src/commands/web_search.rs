use serde::{Deserialize, Serialize};
use std::time::Duration;

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct WebSearchResult {
    pub title: String,
    pub url: String,
    pub snippet: String,
}

// Tavily API structs
#[derive(Serialize, Deserialize, Debug)]
struct TavilyPayload {
    api_key: String,
    query: String,
    search_depth: String,
    include_answer: bool,
    max_results: u32,
}

#[derive(Deserialize, Debug)]
struct TavilyResultItem {
    title: Option<String>,
    url: Option<String>,
    content: Option<String>,
}

#[derive(Deserialize, Debug)]
struct TavilyResponse {
    results: Option<Vec<TavilyResultItem>>,
}

// Google Search API structs
#[derive(Deserialize, Debug)]
struct GoogleSearchItem {
    title: Option<String>,
    link: Option<String>,
    snippet: Option<String>,
}

#[derive(Deserialize, Debug)]
struct GoogleSearchResponse {
    items: Option<Vec<GoogleSearchItem>>,
}

fn get_safe_slice(s: &str, start: usize, mut end: usize) -> &str {
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

fn clean_html(input: &str) -> String {
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

fn url_decode(input: &str) -> String {
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

fn parse_ddg_html(html: &str) -> Vec<WebSearchResult> {
    let mut results = Vec::new();
    let mut cursor = 0;

    while let Some(pos) = html[cursor..].find("class=\"result__a\"") {
        let abs_pos = cursor + pos;

        let a_tag_start = match html[..abs_pos].rfind("<a ") {
            Some(idx) => idx,
            None => {
                cursor = abs_pos + 17;
                continue;
            }
        };

        let tag_close = match html[abs_pos..].find(">") {
            Some(idx) => abs_pos + idx,
            None => {
                cursor = abs_pos + 17;
                continue;
            }
        };

        let a_tag = &html[a_tag_start..tag_close];

        let mut raw_href = String::new();
        if let Some(href_idx) = a_tag.find("href=\"") {
            let start = href_idx + 6;
            if let Some(end) = a_tag[start..].find("\"") {
                raw_href = a_tag[start..start + end].to_string();
            }
        }

        let mut final_url = raw_href.clone();
        if let Some(uddg_idx) = raw_href.find("uddg=") {
            let encoded_part = &raw_href[uddg_idx + 5..];
            let end_arg = encoded_part.find('&').unwrap_or(encoded_part.len());
            final_url = url_decode(&encoded_part[..end_arg]);
        } else if final_url.starts_with("//") {
            final_url = format!("https:{}", final_url);
        }

        let a_end = match html[tag_close + 1..].find("</a>") {
            Some(idx) => tag_close + 1 + idx,
            None => {
                cursor = tag_close + 1;
                continue;
            }
        };

        let raw_title = clean_html(&html[tag_close + 1..a_end]);

        let snippet_search_chunk = get_safe_slice(html, a_end, std::cmp::min(a_end + 3000, html.len()));
        let mut snippet = String::new();

        if let Some(snip_pos) = snippet_search_chunk.find("class=\"result__snippet\"") {
            let abs_snip = snip_pos;
            if let Some(tag_gt) = snippet_search_chunk[abs_snip..].find(">") {
                let text_start = abs_snip + tag_gt + 1;
                let end_tag = snippet_search_chunk[text_start..].find("</a>")
                    .or_else(|| snippet_search_chunk[text_start..].find("</div>"))
                    .unwrap_or(0);
                if end_tag > 0 {
                    snippet = clean_html(&snippet_search_chunk[text_start..text_start + end_tag]);
                }
            }
        }

        if !final_url.is_empty() && !final_url.contains("duckduckgo.com") {
            results.push(WebSearchResult {
                title: if raw_title.is_empty() { final_url.clone() } else { raw_title },
                url: final_url,
                snippet,
            });
        }

        cursor = a_end + 4;
        if results.len() >= 5 {
            break;
        }
    }

    results
}

fn parse_brave_html(html: &str) -> Vec<WebSearchResult> {
    let mut results = Vec::new();
    let mut cursor = 0;
    
    while let Some(start_a) = html[cursor..].find("<a ") {
        let abs_start_a = cursor + start_a;
        let search_limit = 2000;
        let end_of_a_search = std::cmp::min(abs_start_a + search_limit, html.len());
        let a_tag_chunk = get_safe_slice(html, abs_start_a, end_of_a_search);
        
        let is_result_link = if let Some(class_idx) = a_tag_chunk.find("class=\"") {
            let class_val_start = class_idx + 7;
            if let Some(class_val_end) = a_tag_chunk[class_val_start..].find("\"") {
                let class_val = &a_tag_chunk[class_val_start..class_val_start + class_val_end];
                class_val.split_whitespace().any(|w| w == "l1")
            } else {
                false
            }
        } else {
            false
        };
        
        if !is_result_link {
            cursor = abs_start_a + 3;
            continue;
        }
        
        let href = if let Some(href_idx) = a_tag_chunk.find("href=\"") {
            let href_val_start = href_idx + 6;
            if let Some(href_val_end) = a_tag_chunk[href_val_start..].find("\"") {
                a_tag_chunk[href_val_start..href_val_start + href_val_end].to_string()
            } else {
                String::new()
            }
        } else {
            String::new()
        };
        
        if href.is_empty() || href.contains("brave.com") {
            cursor = abs_start_a + 3;
            continue;
        }
        
        let title = if let Some(title_idx) = a_tag_chunk.find("search-snippet-title") {
            let abs_title_idx = abs_start_a + title_idx;
            if let Some(tag_close) = html[abs_title_idx..].find(">") {
                let title_text_start = abs_title_idx + tag_close + 1;
                if let Some(tag_open) = html[title_text_start..].find("</div>") {
                    clean_html(get_safe_slice(html, title_text_start, title_text_start + tag_open))
                } else {
                    String::new()
                }
            } else {
                String::new()
            }
        } else {
            String::new()
        };
        
        let next_search_start = abs_start_a + 10;
        let snippet_search_limit = std::cmp::min(next_search_start + 4000, html.len());
        let snippet_search_chunk = get_safe_slice(html, next_search_start, snippet_search_limit);
        
        let mut snippet = String::new();
        let mut check_idx = 0;
        while let Some(div_idx) = snippet_search_chunk[check_idx..].find("<div ") {
            let abs_div_idx = next_search_start + check_idx + div_idx;
            let div_limit = std::cmp::min(abs_div_idx + 250, html.len());
            let div_tag = get_safe_slice(html, abs_div_idx, div_limit);
            if let Some(tag_end) = div_tag.find(">") {
                let div_tag_attrs = &div_tag[..tag_end];
                if let Some(class_attr_idx) = div_tag_attrs.find("class=\"") {
                    let class_start = class_attr_idx + 7;
                    if let Some(class_end) = div_tag_attrs[class_start..].find("\"") {
                        let class_val = &div_tag_attrs[class_start..class_start + class_end];
                        let classes: Vec<&str> = class_val.split_whitespace().collect();
                        if classes.contains(&"content") && classes.contains(&"t-primary") {
                            let snippet_start = abs_div_idx + tag_end + 1;
                            if let Some(closing_div) = html[snippet_start..].find("</div>") {
                                snippet = clean_html(get_safe_slice(html, snippet_start, snippet_start + closing_div));
                                break;
                            }
                        }
                    }
                }
            }
            check_idx += div_idx + 5;
        }
        
        results.push(WebSearchResult {
            title,
            url: href,
            snippet,
        });
        
        cursor = next_search_start;
        if results.len() >= 5 {
            break;
        }
    }
    
    results
}

#[tauri::command]
pub async fn search_web(
    provider: String,
    query: String,
    api_key: String,
    google_cx: String,
) -> Result<Vec<WebSearchResult>, String> {
    if query.trim().is_empty() {
        return Ok(Vec::new());
    }

    match provider.as_str() {
        "tavily" => {
            if api_key.trim().is_empty() {
                return Err("Tavily API key is empty. Please configure it in Settings.".to_string());
            }
            let payload = TavilyPayload {
                api_key,
                query: query.clone(),
                search_depth: "basic".to_string(),
                include_answer: false,
                max_results: 5,
            };
            
            let client = reqwest::Client::new();
            let res = client.post("https://api.tavily.com/search")
                .json(&payload)
                .send()
                .await
                .map_err(|e| format!("Tavily API request failed: {}", e))?;

            if !res.status().is_success() {
                return Err(format!("Tavily API request failed with status: {}", res.status()));
            }

            let parsed: TavilyResponse = res.json()
                .await
                .map_err(|e| format!("Failed to parse Tavily response JSON: {}", e))?;

            let mut results = Vec::new();
            if let Some(items) = parsed.results {
                for item in items {
                    results.push(WebSearchResult {
                        title: item.title.unwrap_or_else(|| "No Title".to_string()),
                        url: item.url.unwrap_or_else(|| "".to_string()),
                        snippet: item.content.unwrap_or_else(|| "".to_string()),
                    });
                }
            }
            Ok(results)
        }
        "google" => {
            if api_key.trim().is_empty() {
                return Err("Google Search API key is empty. Please configure it in Settings.".to_string());
            }
            if google_cx.trim().is_empty() {
                return Err("Google Custom Search Engine CX ID is empty. Please configure it in Settings.".to_string());
            }

            let client = reqwest::Client::new();
            let res = client.get("https://www.googleapis.com/customsearch/v1")
                .query(&[
                    ("key", api_key.as_str()),
                    ("cx", google_cx.as_str()),
                    ("q", query.as_str()),
                ])
                .send()
                .await
                .map_err(|e| format!("Google API request failed: {}", e))?;

            if !res.status().is_success() {
                return Err(format!("Google API request failed with status: {}", res.status()));
            }

            let parsed: GoogleSearchResponse = res.json()
                .await
                .map_err(|e| format!("Failed to parse Google Search response JSON: {}", e))?;

            let mut results = Vec::new();
            if let Some(items) = parsed.items {
                for item in items {
                    results.push(WebSearchResult {
                        title: item.title.unwrap_or_else(|| "No Title".to_string()),
                        url: item.link.unwrap_or_else(|| "".to_string()),
                        snippet: item.snippet.unwrap_or_else(|| "".to_string()),
                    });
                }
            }
            Ok(results)
        }
        "brave_free" | "ddg_instant" | "duckduckgo" => {
            let client = reqwest::Client::builder()
                .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
                .timeout(Duration::from_secs(12))
                .build()
                .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

            // 1. Try DuckDuckGo HTML (Option A - No API key)
            let ddg_res = client.post("https://html.duckduckgo.com/html/")
                .form(&[("q", query.as_str())])
                .send()
                .await;

            if let Ok(res) = ddg_res {
                if res.status().is_success() {
                    if let Ok(html) = res.text().await {
                        let results = parse_ddg_html(&html);
                        if !results.is_empty() {
                            return Ok(results);
                        }
                    }
                }
            }

            // 2. Try DuckDuckGo HTML GET fallback
            let ddg_get_res = client.get("https://html.duckduckgo.com/html/")
                .query(&[("q", query.as_str())])
                .send()
                .await;

            if let Ok(res) = ddg_get_res {
                if res.status().is_success() {
                    if let Ok(html) = res.text().await {
                        let results = parse_ddg_html(&html);
                        if !results.is_empty() {
                            return Ok(results);
                        }
                    }
                }
            }

            // 3. Fallback to Brave Search if DDG returns empty
            let res = client.get("https://search.brave.com/search")
                .query(&[("q", query.as_str())])
                .send()
                .await
                .map_err(|e| format!("Search request failed: {}", e))?;

            if !res.status().is_success() {
                return Err(format!("Search failed (DuckDuckGo HTML yielded no results, Brave status: {})", res.status()));
            }

            let html = res.text()
                .await
                .map_err(|e| format!("Failed to retrieve Brave HTML response: {}", e))?;

            let mut results = parse_brave_html(&html);

            if results.is_empty() {
                results.push(WebSearchResult {
                    title: format!("Search: {}", query),
                    url: format!("https://duckduckgo.com/?q={}", query.replace(" ", "+")),
                    snippet: "No search results could be retrieved. Please check your internet connection.".to_string(),
                });
            }

            Ok(results)
        }
        _ => Err(format!("Unsupported search provider: {}", provider)),
    }
}
