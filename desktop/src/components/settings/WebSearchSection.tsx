import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";

export function WebSearchSection() {
  const { t } = useTranslation();
  const { config, updateConfigField } = useAppStore();

  return (
    <div className="space-y-6">
      {/* Enable Web Search Checkbox */}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 text-sm font-semibold cursor-pointer select-none">
          <input
            type="checkbox"
            checked={config.web_search_enabled}
            onChange={(e) => updateConfigField("web_search_enabled", e.target.checked)}
            className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer"
          />
          {t("settingsView.webSearchEnabled")}
        </label>
      </div>

      {config.web_search_enabled && (
        <>
          {/* Search Provider Dropdown */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold">{t("settingsView.webSearchProvider")}</label>
            <select
              value={config.web_search_provider || "brave_free"}
              onChange={(e) => updateConfigField("web_search_provider", e.target.value as any)}
              className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
            >
              <option value="brave_free">Brave Search (Free, Keyless)</option>
              <option value="tavily">Tavily Search (LLM-optimized, Key Required)</option>
              <option value="google">Google Custom Search (Key & CX Required)</option>
            </select>
          </div>

          {/* API Key field (for Tavily/Google) */}
          {config.web_search_provider !== "brave_free" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold">{t("settingsView.webSearchApiKey")}</label>
              <input
                type="password"
                value={config.web_search_api_key || ""}
                onChange={(e) => updateConfigField("web_search_api_key", e.target.value)}
                placeholder={t("settingsView.webSearchApiKeyPlaceholder")}
                className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
              />
            </div>
          )}

          {/* Google CX field (Google only) */}
          {config.web_search_provider === "google" && (
            <div className="space-y-2">
              <label className="block text-sm font-semibold">{t("settingsView.webSearchGoogleCx")}</label>
              <input
                type="text"
                value={config.web_search_google_cx || ""}
                onChange={(e) => updateConfigField("web_search_google_cx", e.target.value)}
                placeholder={t("settingsView.webSearchGoogleCxPlaceholder")}
                className="w-full px-3.5 py-2 rounded-lg border border-border-brand bg-bg-input text-text-primary text-sm focus:outline-none focus:border-accent-brand transition-colors"
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}
