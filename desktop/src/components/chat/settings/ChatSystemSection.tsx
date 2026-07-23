import { useState } from "react";
import { Sparkles, ChevronDown, ChevronRight, Copy, Check } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppStore } from "../../../store/useAppStore";
import { getSystemInstruction } from "../../../services/prompts";
import { useChatContext } from "../../../views/chat/ChatContext";

export function ChatSystemSection() {
  const { t } = useTranslation();
  const { config, updateConfigField } = useAppStore();
  const { chatStartDate, chatEndDate, chatContextText } = useChatContext();

  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem("chat_settings_sys_instr_collapsed") === "true";
  });
  const [copied, setCopied] = useState(false);

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem("chat_settings_sys_instr_collapsed", String(next));
  };

  const systemInstructionPreview = (config.system_instruction_mode || "default") === "default"
    ? getSystemInstruction(config.user_name || "", chatStartDate, chatEndDate, chatContextText, config)
    : "";

  const handleCopyDefaultInstruction = async () => {
    const defaultRaw = t("chatView.systemInstruction", { returnObjects: true });
    const defaultStr = Array.isArray(defaultRaw)
      ? defaultRaw.join("\n")
      : (defaultRaw as string);

    try {
      await navigator.clipboard.writeText(defaultStr);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      console.error("Failed to copy system instruction", err);
    }
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
          <span className="text-sm">{t("chatView.systemPromptSettings", "System Prompt Behavior")}</span>
        </div>
        {collapsed ? (
          <ChevronRight className="h-4.5 w-4.5 text-text-secondary" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 text-text-secondary" />
        )}
      </button>

      {!collapsed && (
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
                  {mode === "default"
                    ? t("chatView.modeDefault", "Default")
                    : mode === "append"
                    ? t("chatView.modeAppend", "Append")
                    : t("chatView.modeOverride", "Override")}
                </button>
              ))}
            </div>
          </div>

          {/* Default preview or editable textarea */}
          {config.system_instruction_mode === "default" ? (
            <div className="flex flex-col gap-2 p-1 animate-fade-in">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-text-primary">
                  {t("chatView.currentSystemPrompt", "Current System Prompt")}
                </span>
                <button
                  type="button"
                  onClick={handleCopyDefaultInstruction}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-brand/60 bg-bg-input px-2.5 py-1.5 text-sm font-semibold text-text-secondary transition-colors hover:border-accent-brand hover:text-accent-brand"
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  {copied ? t("common.copied", "Copied") : t("common.copy", "Copy")}
                </button>
              </div>
              <pre className="w-full whitespace-pre-wrap rounded-xl border border-border-brand/60 bg-bg-input px-3 py-3 text-sm leading-5 text-text-primary font-mono overflow-auto max-h-72">
                {systemInstructionPreview}
              </pre>
            </div>
          ) : (
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
              <div className="text-xs text-text-secondary leading-relaxed bg-bg-app/40 rounded-lg p-2.5 border border-border-brand/20">
                <span className="font-semibold block mb-0.5 text-text-primary">
                  {t("chatView.availableTags", "Available Template Tags:")}
                </span>
                {t("chatView.availableTagsDesc", "You can use these tags to insert dynamic context into your instructions:")}
                <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 font-mono text-xs text-accent-brand">
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
  );
}
