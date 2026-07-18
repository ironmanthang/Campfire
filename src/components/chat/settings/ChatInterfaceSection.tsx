import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatContext } from "../../../views/chat/ChatContext";

export function ChatInterfaceSection() {
  const { t } = useTranslation();
  const {
    showThinking,
    setShowThinking,
    collapseToolResponse,
    setCollapseToolResponse,
    showSuggestedPrompt,
    setShowSuggestedPrompt,
    chatSubmissionMode,
    setChatSubmissionMode,
  } = useChatContext();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("chat_settings_interface_collapsed") === "true";
  });

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("chat_settings_interface_collapsed", String(next));
  };

  return (
    <div className="space-y-3 bg-bg-app/25 rounded-xl border border-border-brand/40 p-4">
      <button
        type="button"
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between font-bold text-text-primary transition-colors select-none text-left"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-accent-brand" />
          <span className="text-sm">{t("chatView.interfaceSettings", "Chat Interface Settings")}</span>
        </div>
        {collapsed ? (
          <ChevronRight className="h-4.5 w-4.5 text-text-secondary" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />
        )}
      </button>

      {!collapsed && (
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

          {/* Suggested Prompt Toggle */}
          <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-bg-surface border border-transparent hover:border-border-brand/30 transition-all">
            <input
              id="setting-suggested-prompt"
              type="checkbox"
              checked={showSuggestedPrompt}
              onChange={(e) => setShowSuggestedPrompt(e.target.checked)}
              className="rounded border-border-brand text-accent-brand focus:ring-accent-brand bg-bg-input cursor-pointer mt-0.5 shrink-0 h-4 w-4"
            />
            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
              <label
                htmlFor="setting-suggested-prompt"
                className="font-semibold text-text-primary cursor-pointer select-none"
              >
                {t("chatView.showSuggestedPromptLabel", "Show Suggested Prompt")}
              </label>
              <span className="text-xs text-text-secondary leading-relaxed">
                {t("chatView.showSuggestedPromptDesc", "Show a quick prompt above the chat input so you can edit it before sending.")}
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
  );
}
