import { useEffect, useRef, useState } from "react";
import {
  Settings,
  X,
  Wrench,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Cpu,
  Laptop,
  BookOpen,
  Compass,
  Trash2,
  Globe
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../store/useAppStore";
import { useChatContext } from "../../views/ChatView";
import { useOllamaStore } from "../../store/useOllamaStore";

interface ChatSettingsModalProps {
  onClose: () => void;
}

export function ChatSettingsModal({ onClose }: ChatSettingsModalProps) {
  const { t } = useTranslation();
  const modalRef = useRef<HTMLDivElement>(null);

  const { config, updateConfigField } = useAppStore();
  const {
    enabledTools,
    setEnabledTools,
    isStreamingChat,
    showThinking,
    setShowThinking,
    collapseToolResponse,
    setCollapseToolResponse,
    chatSubmissionMode,
    setChatSubmissionMode,
  } = useChatContext();

  const { chatModels } = useOllamaStore();
  const [expandedToolId, setExpandedToolId] = useState<string | null>(null);
  const [garbageScanModel, setGarbageScanModel] = useState(() => localStorage.getItem("chat_tool_garbage_model") || "default");

  const [interfaceCollapsed, setInterfaceCollapsed] = useState(() => {
    return localStorage.getItem("chat_settings_interface_collapsed") === "true";
  });
  const [toolsCollapsed, setToolsCollapsed] = useState(() => {
    return localStorage.getItem("chat_settings_tools_collapsed") === "true";
  });
  const [systemInstructionsCollapsed, setSystemInstructionsCollapsed] = useState(() => {
    return localStorage.getItem("chat_settings_sys_instr_collapsed") === "true";
  });

  const toggleInterfaceCollapsed = () => {
    const next = !interfaceCollapsed;
    setInterfaceCollapsed(next);
    localStorage.setItem("chat_settings_interface_collapsed", String(next));
  };

  const toggleToolsCollapsed = () => {
    const next = !toolsCollapsed;
    setToolsCollapsed(next);
    localStorage.setItem("chat_settings_tools_collapsed", String(next));
  };

  const toggleSystemInstructionsCollapsed = () => {
    const next = !systemInstructionsCollapsed;
    setSystemInstructionsCollapsed(next);
    localStorage.setItem("chat_settings_sys_instr_collapsed", String(next));
  };

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
    >
      <div
        ref={modalRef}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xl bg-bg-surface border border-border-brand rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        {/* Header */}
        <div className="p-5 border-b border-border-brand/60 flex items-center justify-between bg-bg-surface">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-accent-brand/10 text-accent-brand">
              <Settings className="h-5 w-5 animate-spin-slow" />
            </div>
            <div>
              <h3 className="font-bold text-text-primary text-lg">
                {t("chatView.settingsTitle", "Chat Settings & Customization")}
              </h3>
              <p className="text-xs text-text-secondary">
                Configure interface behavior, visual thinking details, and active tools.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/80 transition-colors cursor-pointer"
            title={t("chatView.helpModal.closeTooltip", "Close settings")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-text-primary scrollbar-thin">
          {/* Section 1: Chat Interface Preferences */}
          <div className="space-y-3 bg-bg-app/25 rounded-xl border border-border-brand/40 p-4">
            <button
              type="button"
              onClick={toggleInterfaceCollapsed}
              className="w-full flex items-center justify-between font-bold text-text-primary transition-colors select-none text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-accent-brand" />
                <span className="text-sm">{t("chatView.interfaceSettings", "Chat Interface Settings")}</span>
              </div>
              {interfaceCollapsed ? (
                <ChevronRight className="h-4.5 w-4.5 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />
              )}
            </button>

            {!interfaceCollapsed && (
              <div className="space-y-4 pt-3 border-t border-border-brand/20 animate-fade-in">
                {/* Tick/Untick All */}
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-border-brand/10 text-xs">
                  <span className="text-text-secondary font-medium">{t("chatView.quickActions", "Quick actions")}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const target = !(showThinking && collapseToolResponse);
                      setShowThinking(target);
                      setCollapseToolResponse(target);
                    }}
                    className="text-accent-brand hover:text-accent-brand-hover font-semibold transition-colors cursor-pointer"
                  >
                    {showThinking && collapseToolResponse
                      ? t("chatView.untickAll", "Untick all")
                      : t("chatView.tickAll", "Tick all")}
                  </button>
                </div>

                {/* Show Thinking Process */}
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-surface border border-transparent hover:border-border-brand/30 transition-all">
                  <input
                    id="setting-show-thinking"
                    type="checkbox"
                    checked={showThinking}
                    onChange={(e) => setShowThinking(e.target.checked)}
                    className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer mt-0.5 shrink-0 h-4 w-4"
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <label
                      htmlFor="setting-show-thinking"
                      className="font-semibold text-text-primary cursor-pointer select-none"
                    >
                      {t("chatView.showThinkingLabel", "Show Thinking Process")}
                    </label>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      {t("chatView.showThinkingDesc", "Display the step-by-step reasoning of local models.")}
                    </span>
                  </div>
                </div>

                {/* Collapse Tool Responses */}
                <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-surface border border-transparent hover:border-border-brand/30 transition-all">
                  <input
                    id="setting-collapse-tools"
                    type="checkbox"
                    checked={collapseToolResponse}
                    onChange={(e) => setCollapseToolResponse(e.target.checked)}
                    className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer mt-0.5 shrink-0 h-4 w-4"
                  />
                  <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                    <label
                      htmlFor="setting-collapse-tools"
                      className="font-semibold text-text-primary cursor-pointer select-none"
                    >
                      {t("chatView.collapseToolsLabel", "Collapse Tool Responses")}
                    </label>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      {t("chatView.collapseToolsDesc", "Keep raw outputs of tool invocations collapsed by default.")}
                    </span>
                  </div>
                </div>

                {/* Mid-Generation Submission Mode */}
                <div className="flex flex-col gap-2 p-2 rounded-lg hover:bg-bg-surface border border-transparent hover:border-border-brand/30 transition-all">
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold text-text-primary">
                      Mid-Generation Submissions
                    </span>
                    <span className="text-xs text-text-secondary leading-relaxed">
                      Choose what happens when you send a message while the AI is busy.
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-1 select-none">
                    <button
                      type="button"
                      onClick={() => setChatSubmissionMode("queue")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        chatSubmissionMode === "queue"
                          ? "bg-accent-brand/10 border-accent-brand text-accent-brand font-bold"
                          : "bg-bg-input border-border-brand/60 text-text-secondary hover:border-border-brand hover:text-text-primary"
                      }`}
                    >
                      Queue (Send after AI finishes)
                    </button>
                    <button
                      type="button"
                      onClick={() => setChatSubmissionMode("interrupt")}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center ${
                        chatSubmissionMode === "interrupt"
                          ? "bg-accent-brand/10 border-accent-brand text-accent-brand font-bold"
                          : "bg-bg-input border-border-brand/60 text-text-secondary hover:border-border-brand hover:text-text-primary"
                      }`}
                    >
                      Steer (Interrupt & send)
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Tools & Diagnostics */}
          <div className="space-y-3 bg-bg-app/25 rounded-xl border border-border-brand/40 p-4">
            <button
              type="button"
              onClick={toggleToolsCollapsed}
              className="w-full flex items-center justify-between font-bold text-text-primary transition-colors select-none text-left"
            >
              <div className="flex items-center gap-2">
                <Wrench className="h-4.5 w-4.5 text-accent-brand" />
                <span className="text-sm">{t("chatView.toolsSettings", "Tools & Diagnostics")}</span>
              </div>
              {toolsCollapsed ? (
                <ChevronRight className="h-4.5 w-4.5 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />
              )}
            </button>

            {!toolsCollapsed && (
              <div className="space-y-2 pt-3 border-t border-border-brand/20 animate-fade-in">
                {/* Tick/Untick All */}
                <div className="flex items-center justify-between px-2 pb-1.5 border-b border-border-brand/10 text-xs">
                  <span className="text-text-secondary font-medium">{t("chatView.quickActions", "Quick actions")}</span>
                  <button
                    type="button"
                    disabled={isStreamingChat}
                    onClick={() => {
                      const allToolsNames = ["get_system_resources", "laptop_brightness", "read_journal_entries", "navigate_to_journal_date", "scan_for_garbage"];
                      const allToolsChecked = config.web_search_enabled && allToolsNames.every(name => enabledTools.includes(name));
                      const target = !allToolsChecked;
                      
                      updateConfigField("web_search_enabled", target);
                      if (target) {
                        setEnabledTools(allToolsNames);
                      } else {
                        setEnabledTools([]);
                      }
                    }}
                    className="text-accent-brand hover:text-accent-brand-hover font-semibold transition-colors cursor-pointer disabled:opacity-50 text-[11px]"
                  >
                    {config.web_search_enabled && ["get_system_resources", "laptop_brightness", "read_journal_entries", "navigate_to_journal_date", "scan_for_garbage"].every(name => enabledTools.includes(name))
                      ? t("chatView.untickAll", "Untick all")
                      : t("chatView.tickAll", "Tick all")}
                  </button>
                </div>
                {[
                  {
                    id: "web-search",
                    name: "web-search",
                    label: t("chatView.webSearchToggle", "Web Search"),
                    desc: t("chatView.toolWebSearchDesc", "Allow AI to search the web for real-time information."),
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
                    id: "brightness",
                    name: "laptop_brightness",
                    label: t("chatView.toolBrightness"),
                    desc: t("chatView.toolBrightnessDesc"),
                    icon: Laptop,
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
                  const isEnabled = tool.id === "web-search"
                    ? !!config.web_search_enabled
                    : enabledTools.includes(tool.name);
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
                                } else {
                                  setEnabledTools(
                                    val
                                      ? [...enabledTools, tool.name]
                                      : enabledTools.filter((t) => t !== tool.name)
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
                            {isExpanded ? (
                              <ChevronDown className="h-4.5 w-4.5" />
                            ) : (
                              <ChevronRight className="h-4.5 w-4.5" />
                            )}
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
                          <div className="flex flex-col gap-1.5 max-w-sm">
                            <label className="text-xs font-semibold text-text-primary">
                              {t("settingsView.webSearchProvider")}
                            </label>
                            <select
                              value={config.web_search_provider || "brave_free"}
                              onChange={(e) => updateConfigField("web_search_provider", e.target.value as any)}
                              className="w-full bg-bg-input border border-border-brand/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand/50 focus:border-accent-brand text-text-primary cursor-pointer font-medium"
                            >
                              <option value="brave_free">Brave Search (Free, Keyless)</option>
                              <option value="tavily">Tavily Search (LLM-optimized, Key Required)</option>
                              <option value="google">Google Custom Search (Key & CX Required)</option>
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

          {/* Section 3: System Instructions */}
          <div className="space-y-3 bg-bg-app/25 rounded-xl border border-border-brand/40 p-4">
            <button
              type="button"
              onClick={toggleSystemInstructionsCollapsed}
              className="w-full flex items-center justify-between font-bold text-text-primary transition-colors select-none text-left"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4.5 w-4.5 text-accent-brand" />
                <span className="text-sm">{t("chatView.systemPromptSettings", "System Prompt Behavior")}</span>
              </div>
              {systemInstructionsCollapsed ? (
                <ChevronRight className="h-4.5 w-4.5 text-text-secondary" />
              ) : (
                <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />
              )}
            </button>

            {!systemInstructionsCollapsed && (
              <div className="space-y-4 pt-3 border-t border-border-brand/20 animate-fade-in">
                {/* Instruction Mode Selection */}
                <div className="flex flex-col gap-1.5 p-1">
                  <span className="font-semibold text-text-primary">{t("chatView.instructionMode", "Prompt Mode")}</span>
                  <span className="text-xs text-text-secondary leading-relaxed mb-1">
                    {t("chatView.instructionModeDesc", "Configure how the AI system instructions are compiled.")}
                  </span>
                  <div className="grid grid-cols-3 gap-2 select-none">
                    {(["default", "append", "override"] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => updateConfigField("system_instruction_mode", mode)}
                        className={`px-2 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-center capitalize ${
                          (config.system_instruction_mode || "default") === mode
                            ? "bg-accent-brand/10 border-accent-brand text-accent-brand font-bold"
                            : "bg-bg-input border-border-brand/60 text-text-secondary hover:border-border-brand hover:text-text-primary"
                        }`}
                      >
                        {mode === "default" ? t("chatView.modeDefault", "Default") : mode === "append" ? t("chatView.modeAppend", "Append") : t("chatView.modeOverride", "Override")}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Textarea Input (only for append or override) */}
                {(config.system_instruction_mode === "append" || config.system_instruction_mode === "override") && (
                  <div className="flex flex-col gap-2 p-1 animate-fade-in">
                    <span className="font-semibold text-text-primary">
                      {config.system_instruction_mode === "append"
                        ? t("chatView.additionalDirectives", "Additional Directives")
                        : t("chatView.customSystemPrompt", "Custom System Prompt")}
                    </span>
                    <textarea
                      value={config.custom_system_instruction || ""}
                      onChange={(e) => updateConfigField("custom_system_instruction", e.target.value)}
                      placeholder={
                        config.system_instruction_mode === "append"
                          ? t("chatView.appendPlaceholder", "e.g., Speak more concisely. Ask questions about my studies.")
                          : t("chatView.overridePlaceholder", "Write your complete custom system instruction here...")
                      }
                      rows={6}
                      className="w-full bg-bg-input border border-border-brand/60 rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-1 focus:ring-accent-brand/50 focus:border-accent-brand text-text-primary placeholder:text-text-secondary/60 resize-none font-mono"
                    />
                    {/* Template variables helper */}
                    <div className="text-[10px] text-text-secondary leading-relaxed bg-bg-app/40 rounded-lg p-2.5 border border-border-brand/20">
                      <span className="font-semibold block mb-0.5 text-text-primary">{t("chatView.availableTags", "Available Template Tags:")}</span>
                      {t("chatView.availableTagsDesc", "You can use these tags to insert dynamic context into your instructions:")}
                      <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 font-mono text-[9px] text-accent-brand">
                        <span>{"{userName}"} - {t("chatView.tagUserName", "User's name")}</span>
                        <span>{"{currentDate}"} - {t("chatView.tagCurrentDate", "Today's date")}</span>
                        <span>{"{dayOfWeek}"} - {t("chatView.tagDayOfWeek", "Day of the week")}</span>
                        <span>{"{context}"} - {t("chatView.tagContext", "Journal entries")}</span>
                        <span>{"{startDate}"} - {t("chatView.tagStartDate", "Start date")}</span>
                        <span>{"{endDate}"} - {t("chatView.tagEndDate", "End date")}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
