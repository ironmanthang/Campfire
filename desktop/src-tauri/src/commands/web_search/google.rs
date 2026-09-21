use serde::Deserialize;
use super::common::WebSearchResult;

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

pub async fn search(
    api_key: &str,
    google_cx: &str,
    clean_query: &str,
) -> Result<Vec<WebSearchResult>, String> {
    if api_key.trim().is_empty() {
        return Err("Google Search API key is empty. Please configure it in Settings.".to_string());
    }
    if google_cx.trim().is_empty() {
        return Err("Google Custom Search Engine CX ID is empty. Please configure it in Settings.".to_string());
    }

    let client = reqwest::Client::new();
    let res = client.get("https://www.googleapis.com/customsearch/v1")
        .query(&[
            ("key", api_key),
            ("cx", google_cx),
            ("q", clean_query),
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
