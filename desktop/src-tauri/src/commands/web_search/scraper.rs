use std::time::Duration;
use reqwest::header::{HeaderMap, HeaderValue, ACCEPT, ACCEPT_LANGUAGE, REFERER, USER_AGENT};
use super::common::get_safe_slice;

fn strip_script_style_tags(html: &str) -> String {
    let mut text = html.to_string();
    while let Some(start) = text.find("<script") {
        if let Some(end_offset) = text[start..].find("</script>") {
            text.replace_range(start..start + end_offset + 9, "");
        } else {
            break;
        }
    }
    while let Some(start) = text.find("<style") {
        if let Some(end_offset) = text[start..].find("</style>") {
            text.replace_range(start..start + end_offset + 8, "");
        } else {
            break;
        }
    }
    while let Some(start) = text.find("<head") {
        if let Some(end_offset) = text[start..].find("</head>") {
            text.replace_range(start..start + end_offset + 7, "");
        } else {
            break;
        }
    }
    text
}

fn clean_html_preserve_newlines(input: &str) -> String {
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
        if c == '\n' || c == '\r' {
            cleaned.push('\n');
            last_was_space = false;
        } else if c.is_whitespace() {
            if !last_was_space {
                cleaned.push(' ');
                last_was_space = true;
            }
        } else {
            cleaned.push(c);
            last_was_space = false;
        }
    }
    cleaned
}

fn html_to_clean_text(html: &str) -> String {
    let stripped = strip_script_style_tags(html);
    
    let formatted = stripped
        .replace("<br>", "\n")
        .replace("<br/>", "\n")
        .replace("<br />", "\n")
        .replace("</p>", "\n\n")
        .replace("</div>", "\n")
        .replace("</h1>", "\n\n")
        .replace("</h2>", "\n\n")
        .replace("</h3>", "\n\n")
        .replace("</h4>", "\n\n")
        .replace("</h5>", "\n\n")
        .replace("</h6>", "\n\n")
        .replace("</li>", "\n")
        .replace("<tr>", "\n")
        .replace("</tr>", "\n");

    let clean = clean_html_preserve_newlines(&formatted);

    let lines: Vec<&str> = clean.lines().map(|l| l.trim()).collect();
    let mut result_lines = Vec::new();
    let mut prev_empty = false;
    for line in lines {
        if line.is_empty() {
            if !prev_empty {
                result_lines.push("");
                prev_empty = true;
            }
        } else {
            result_lines.push(line);
            prev_empty = false;
        }
    }
    let trimmed = result_lines.join("\n").trim().to_string();

    if trimmed.len() > 15000 {
        let safe_slice = get_safe_slice(&trimmed, 0, 15000);
        format!("{}...\n\n[Content truncated to 15,000 characters]", safe_slice)
    } else {
        trimmed
    }
}

fn create_browser_client(referer_str: Option<&str>) -> Result<reqwest::Client, String> {
    let mut headers = HeaderMap::new();
    headers.insert(
        USER_AGENT,
        HeaderValue::from_static("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"),
    );
    headers.insert(
        ACCEPT,
        HeaderValue::from_static("text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7"),
    );
    headers.insert(
        ACCEPT_LANGUAGE,
        HeaderValue::from_static("en-US,en;q=0.9"),
    );
    headers.insert(
        "sec-ch-ua",
        HeaderValue::from_static("\"Google Chrome\";v=\"125\", \"Chromium\";v=\"125\", \"Not.A/Brand\";v=\"24\""),
    );
    headers.insert("sec-ch-ua-mobile", HeaderValue::from_static("?0"));
    headers.insert("sec-ch-ua-platform", HeaderValue::from_static("\"Windows\""));
    headers.insert("sec-fetch-dest", HeaderValue::from_static("document"));
    headers.insert("sec-fetch-mode", HeaderValue::from_static("navigate"));
    headers.insert("sec-fetch-site", HeaderValue::from_static("none"));
    headers.insert("sec-fetch-user", HeaderValue::from_static("?1"));
    headers.insert("upgrade-insecure-requests", HeaderValue::from_static("1"));

    if let Some(r) = referer_str {
        if let Ok(v) = HeaderValue::from_str(r) {
            headers.insert(REFERER, v);
        }
    } else {
        headers.insert(REFERER, HeaderValue::from_static("https://www.google.com/"));
    }

    reqwest::Client::builder()
        .default_headers(headers)
        .redirect(reqwest::redirect::Policy::limited(10))
        .timeout(Duration::from_secs(15))
        .build()
        .map_err(|e| format!("Failed to build HTTP client: {}", e))
}

pub async fn fetch_web_page(url: String) -> Result<String, String> {
    let trimmed_url = url.trim();
    if !trimmed_url.starts_with("http://") && !trimmed_url.starts_with("https://") {
        return Err("Invalid URL format. URL must start with http:// or https://".to_string());
    }

    let client = create_browser_client(Some("https://www.google.com/"))?;

    // Attempt 1: Direct HTTP fetch with Chrome headers
    let direct_res = client.get(trimmed_url).send().await;

    match direct_res {
        Ok(res) => {
            let status = res.status();
            if status.is_success() {
                let body = res
                    .text()
                    .await
                    .map_err(|e| format!("Failed to read web page body: {}", e))?;
                let text_content = html_to_clean_text(&body);
                if !text_content.trim().is_empty() {
                    return Ok(text_content);
                }
            } else {
                // Attempt 2: Fallback to Jina Reader proxy if direct fetch received non-success status
                let jina_url = format!("https://r.jina.ai/{}", trimmed_url);
                if let Ok(jina_res) = client.get(&jina_url).send().await {
                    if jina_res.status().is_success() {
                        if let Ok(jina_body) = jina_res.text().await {
                            let text_content = html_to_clean_text(&jina_body);
                            if !text_content.trim().is_empty() {
                                return Ok(text_content);
                            }
                        }
                    }
                }
                return Err(format!("HTTP request failed with status code: {}", status));
            }
        }
        Err(err) => {
            // Fallback attempt on connection error
            let jina_url = format!("https://r.jina.ai/{}", trimmed_url);
            if let Ok(jina_res) = client.get(&jina_url).send().await {
                if jina_res.status().is_success() {
                    if let Ok(jina_body) = jina_res.text().await {
                        let text_content = html_to_clean_text(&jina_body);
                        if !text_content.trim().is_empty() {
                            return Ok(text_content);
                        }
                    }
                }
            }
            return Err(format!("HTTP request error: {}", err));
        }
    }

    Ok("The web page was fetched successfully but contained no extractable text content.".to_string())
}
