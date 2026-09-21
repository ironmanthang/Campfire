mod common;
mod tavily;
mod google;
mod brave_ddg;
mod scraper;

pub use common::WebSearchResult;

#[tauri::command]
pub async fn fetch_web_page(url: String) -> Result<String, String> {
    scraper::fetch_web_page(url).await
}

#[tauri::command]
pub async fn search_web(
    provider: String,
    query: String,
    api_key: String,
    google_cx: String,
) -> Result<Vec<WebSearchResult>, String> {
    let trimmed = query.trim();
    if trimmed.is_empty() {
        return Ok(Vec::new());
    }

    let clean_query = if trimmed.len() > 150 {
        let sliced = common::get_safe_slice(trimmed, 0, 150);
        if let Some(last_space) = sliced.rfind(' ') {
            if last_space > 30 {
                sliced[..last_space].trim().to_string()
            } else {
                sliced.trim().to_string()
            }
        } else {
            sliced.trim().to_string()
        }
    } else {
        trimmed.to_string()
    };

    match provider.as_str() {
        "tavily" => tavily::search(&api_key, &clean_query).await,
        "google" => google::search(&api_key, &google_cx, &clean_query).await,
        "brave_free" | "ddg_instant" | "duckduckgo" => brave_ddg::search(&clean_query).await,
        _ => Err(format!("Unsupported search provider: {}", provider)),
    }
}
