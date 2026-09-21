use serde::{Deserialize, Serialize};
use super::common::WebSearchResult;

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

pub async fn search(api_key: &str, clean_query: &str) -> Result<Vec<WebSearchResult>, String> {
    if api_key.trim().is_empty() {
        return Err("Tavily API key is empty. Please configure it in Settings.".to_string());
    }
    let payload = TavilyPayload {
        api_key: api_key.to_string(),
        query: clean_query.to_string(),
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
