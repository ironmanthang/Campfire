use std::time::Duration;
use super::common::{clean_html, get_safe_slice, url_decode, WebSearchResult};

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

pub async fn search(clean_query: &str) -> Result<Vec<WebSearchResult>, String> {
    let client = reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36")
        .timeout(Duration::from_secs(12))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))?;

    // 1. Try DuckDuckGo HTML (Option A - No API key)
    let ddg_res = client.post("https://html.duckduckgo.com/html/")
        .form(&[("q", clean_query)])
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
        .query(&[("q", clean_query)])
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
        .query(&[("q", clean_query)])
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
            title: format!("Search: {}", clean_query),
            url: format!("https://duckduckgo.com/?q={}", clean_query.replace(" ", "+")),
            snippet: "No search results could be retrieved. Please check your internet connection.".to_string(),
        });
    }

    Ok(results)
}
