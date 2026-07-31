import { useState } from "react";
import {
  Wrench,
  ChevronDown,
  ChevronRight,
  Cpu,
  BookOpen,
  Compass,
  Trash2,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import { useChatContext } from "../../../views/chat/ChatContext";
import { useOllamaStore } from "../../../store/useOllamaStore";

export function ChatToolsSection() {
  const { t } = useTranslation();
  const { config, updateConfigField } = useAppStore();
  const {
    enabledTools,
    setEnabledTools,
    isStreamingChat,
  } = useChatContext();
  const { chatModels } = useOllamaStore();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("chat_settings_tools_collapsed") === "true";
  });
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [garbageScanModel, setGarbageScanModel] = useState(() => {
    return localStorage.getItem("chat_tool_garbage_model") || "default";
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("chat_settings_tools_collapsed", String(next));
  };

  const allToolsNames = [
    "get_system_resources",
    "read_journal_entries",
    "navigate_to_journal_date",
    "scan_for_garbage",
    "web_search",
    "web_fetch"
  ];

  return (
    <div className="space-y-3 bg-bg-app/25 rounded-xl border border-border-brand/40 p-4">
      <button
        type="button"
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between font-bold text-text-primary transition-colors select-none text-left"
      >
        <div className="flex items-center gap-2">
          <Wrench className="h-4.5 w-4.5 text-accent-brand" />
          <span className="text-sm">{t("chatView.toolsSettings", "Tools & Diagnostics")}</span>
        </div>
        {collapsed ? (
          <ChevronRight className="h-4.5 w-4.5 text-text-secondary" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />
        )}
      </button>

      {!collapsed && (
        <div className="space-y-2 pt-3 border-t border-border-brand/20 animate-fade-in">
          {/* Tick/Untick All */}
          <div className="flex items-center justify-between px-2 pb-1.5 border-b border-border-brand/10 text-xs">
            <span className="text-text-secondary font-medium">{t("chatView.quickActions", "Quick actions")}</span>
            <button
              type="button"
              disabled={isStreamingChat}
              onClick={() => {
                const allToolsChecked =
                  config.web_search_enabled && allToolsNames.every((name) => enabledTools.includes(name));
                const target = !allToolsChecked;

                updateConfigField("web_search_enabled", target);
                if (target) {
                  setEnabledTools(allToolsNames);
                } else {
                  setEnabledTools([]);
                }
              }}
              className="text-accent-brand hover:text-accent-brand-hover font-semibold transition-colors cursor-pointer disabled:opacity-50 text-sm"
            >
              {config.web_search_enabled && allToolsNames.every((name) => enabledTools.includes(name))
                ? t("chatView.untickAll", "Untick all")
                : t("chatView.tickAll", "Tick all")}
            </button>
          </div>
          {[
            {
              id: "web-search",
              name: "web-search",
              label: t("chatView.webAccessToggle", "Web Access"),
              desc: t("chatView.toolWebAccessDesc", "Master switch to enable web search engine queries and page content fetching."),
              icon: Globe,
              hasSubSettings: true
            },
            {
              id: "sys-resources",
              name: "get_system_resources",
              label: t("chatView.toolTelemetry"),
              desc: t("chatView.toolTelemetryDesc"),
              icon: Cpu,
              hasSubSettings: false
            },
            {
              id: "read-journal",
              name: "read_journal_entries",
              label: t("chatView.toolArchive"),
              desc: t("chatView.toolArchiveDesc"),
              icon: BookOpen,
              hasSubSettings: false
            },
            {
              id: "navigate-date",
              name: "navigate_to_journal_date",
              label: t("chatView.toolNavigate"),
              desc: t("chatView.toolNavigateDesc"),
              icon: Compass,
              hasSubSettings: false
            },
            {
              id: "scan-garbage",
              name: "scan_for_garbage",
              label: t("chatView.toolGarbage"),
              desc: t("chatView.toolGarbageDesc"),
              icon: Trash2,
              hasSubSettings: true
            }
          ].map((tool) => {
            const Icon = tool.icon;
            const isEnabled =
              tool.id === "web-search" ? !!config.web_search_enabled : enabledTools.includes(tool.name);
            const isExpanded = expandedToolId === tool.id;

            return (
              <div
                key={tool.id}
                className={`flex flex-col rounded-xl border border-transparent transition-all overflow-hidden ${
                  tool.hasSubSettings && isExpanded
                    ? "bg-bg-surface/50 border-border-brand/35"
                    : "hover:bg-bg-surface/30"
                }`}
              >
                <div
                  onClick={() => {
                    if (tool.hasSubSettings) {
                      setExpandedToolId(expandedToolId === tool.id ? null : tool.id);
                    }
                  }}
                  className={`flex items-start justify-between gap-3 p-3 select-none ${
                    tool.hasSubSettings ? "cursor-pointer" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div onClick={(e) => e.stopPropagation()} className="mt-0.5">
                      <input
                        id={`setting-${tool.id}`}
                        type="checkbox"
                        checked={isEnabled}
                        disabled={isStreamingChat}
                        onChange={(e) => {
                          const val = e.target.checked;
                          if (tool.id === "web-search") {
                            updateConfigField("web_search_enabled", val);
                            if (val) {
                              const set = new Set(enabledTools);
                              set.add("web_search");
                              set.add("web_fetch");
                              setEnabledTools(Array.from(set));
                            } else {
                              setEnabledTools(enabledTools.filter((t) => t !== "web_search" && t !== "web_fetch"));
                            }
                          } else {
                            setEnabledTools(
                              val ? [...enabledTools, tool.name] : enabledTools.filter((t) => t !== tool.name)
                            );
                          }
                        }}
                        className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer disabled:opacity-50 h-4 w-4"
                      />
                    </div>

                    <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                      <label
                        htmlFor={`setting-${tool.id}`}
                        onClick={(e) => {
                          if (tool.hasSubSettings) {
                            e.preventDefault();
                          }
                        }}
                        className={`font-semibold text-text-primary flex items-center gap-1.5 ${
                          tool.hasSubSettings ? "cursor-pointer" : "cursor-default"
                        }`}
                      >
                        <Icon className="h-4 w-4 text-accent-brand shrink-0" />
                        {tool.label}
                      </label>
                      <span className="text-xs text-text-secondary leading-relaxed">
                        {tool.desc}
                      </span>
                    </div>
                  </div>

                  {tool.hasSubSettings && (
                    <div className="text-text-secondary shrink-0 self-center p-1 rounded-md hover:bg-bg-app/40 transition-colors">
                      {isExpanded ? <ChevronDown className="h-4.5 w-4.5" /> : <ChevronRight className="h-4.5 w-4.5" />}
                    </div>
                  )}
                </div>

                {tool.id === "scan-garbage" && isExpanded && (
                  <div className="px-10 pb-4 pt-1 border-t border-border-brand/10 bg-bg-app/10 animate-fade-in flex flex-col gap-3">
                    <div className="flex flex-col gap-1.5 max-w-xs">
                      <label className="text-xs font-semibold text-text-primary">
                        {t("chatView.garbageSubmodelLabel", "Analysis AI Model")}
                      </label>
                      <select
                        value={garbageScanModel}
                        onChange={(e) => {
                          const val = e.target.value;
                          setGarbageScanModel(val);
                          localStorage.setItem("chat_tool_garbage_model", val);
                        }}
                        className="w-full bg-bg-input border border-border-brand/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand/50 focus:border-accent-brand text-text-primary cursor-pointer font-medium"
                      >
                        <option value="default">
                          {t("chatView.garbageDefaultModel", "Default (Active Chat Model)")}
                        </option>
                        {chatModels.map((model) => (
                          <option key={model.name} value={model.name}>
                            {model.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}

                {tool.id === "web-search" && isExpanded && (
                  <div className="px-10 pb-4 pt-2 border-t border-border-brand/10 bg-bg-app/10 animate-fade-in flex flex-col gap-4">
                    {/* Child web tools checkboxes */}
                    <div className="flex flex-col gap-2.5 pb-2 border-b border-border-brand/10">
                      <label className="text-xs font-semibold text-text-primary">
                        {t("chatView.webToolsCapabilities", "Web Capabilities")}
                      </label>

                      {/* Sub-tool 1: Web Search */}
                      <div className="flex items-start gap-2.5">
                        <input
                          id="child-tool-web-search"
                          type="checkbox"
                          checked={enabledTools.includes("web_search")}
                          disabled={isStreamingChat || !config.web_search_enabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            const next = val
                              ? [...enabledTools, "web_search"]
                              : enabledTools.filter((t) => t !== "web_search");
                            setEnabledTools(next);
                            if (val && !config.web_search_enabled) {
                              updateConfigField("web_search_enabled", true);
                            }
                          }}
                          className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer disabled:opacity-50 h-3.5 w-3.5 mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5">
                          <label htmlFor="child-tool-web-search" className="text-xs font-medium text-text-primary cursor-pointer">
                            {t("chatView.webSearchChild", "Web Search")}
                          </label>
                          <span className="text-[11px] text-text-secondary">
                            {t("chatView.webSearchChildDesc", "Allow search engine query execution.")}
                          </span>
                        </div>
                      </div>

                      {/* Sub-tool 2: Web Fetch */}
                      <div className="flex items-start gap-2.5">
                        <input
                          id="child-tool-read-web-page"
                          type="checkbox"
                          checked={enabledTools.includes("web_fetch")}
                          disabled={isStreamingChat || !config.web_search_enabled}
                          onChange={(e) => {
                            const val = e.target.checked;
                            const next = val
                              ? [...enabledTools, "web_fetch"]
                              : enabledTools.filter((t) => t !== "web_fetch");
                            setEnabledTools(next);
                            if (val && !config.web_search_enabled) {
                              updateConfigField("web_search_enabled", true);
                            }
                          }}
                          className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer disabled:opacity-50 h-3.5 w-3.5 mt-0.5"
                        />
                        <div className="flex flex-col gap-0.5">
                          <label htmlFor="child-tool-read-web-page" className="text-xs font-medium text-text-primary cursor-pointer">
                            {t("chatView.webPageReaderChild", "Web Fetch")}
                          </label>
                          <span className="text-[11px] text-text-secondary">
                            {t("chatView.webPageReaderChildDesc", "Allow fetching and reading full page content from URLs.")}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 max-w-sm">
                      <label className="text-xs font-semibold text-text-primary">
                        {t("settingsView.webSearchProvider")}
                      </label>
                      <select
                        value={config.web_search_provider || "brave_free"}
                        onChange={(e) => updateConfigField("web_search_provider", e.target.value as any)}
                        className="w-full bg-bg-input border border-border-brand/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand/50 focus:border-accent-brand text-text-primary cursor-pointer font-medium"
                      >
                        <option value="brave_free">{t("chatView.providerBrave")}</option>
                        <option value="tavily">{t("chatView.providerTavily")}</option>
                        <option value="google">{t("chatView.providerGoogle")}</option>
                      </select>
                    </div>

                    {config.web_search_provider !== "brave_free" && (
                      <div className="flex flex-col gap-1.5 max-w-sm animate-fade-in">
                        <label className="text-xs font-semibold text-text-primary">
                          {t("settingsView.webSearchApiKey")}
                        </label>
                        <input
                          type="password"
                          value={config.web_search_api_key || ""}
                          onChange={(e) => updateConfigField("web_search_api_key", e.target.value)}
                          placeholder={t("settingsView.webSearchApiKeyPlaceholder")}
                          className="w-full bg-bg-input border border-border-brand/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand/50 focus:border-accent-brand text-text-primary font-medium"
                        />
                      </div>
                    )}

                    {config.web_search_provider === "google" && (
                      <div className="flex flex-col gap-1.5 max-w-sm animate-fade-in">
                        <label className="text-xs font-semibold text-text-primary">
                          {t("settingsView.webSearchGoogleCx")}
                        </label>
                        <input
                          type="text"
                          value={config.web_search_google_cx || ""}
                          onChange={(e) => updateConfigField("web_search_google_cx", e.target.value)}
                          placeholder={t("settingsView.webSearchGoogleCxPlaceholder")}
                          className="w-full bg-bg-input border border-border-brand/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand/50 focus:border-accent-brand text-text-primary font-medium"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
