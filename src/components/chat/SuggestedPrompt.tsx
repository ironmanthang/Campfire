import { useEffect, useState } from "react";
import { Sparkles, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatContext } from "../../views/chat/ChatContext";
import { pickWeightedSeriousOrHumor } from "../../lib/suggestedPrompts";

/**
 * A single-chip suggested-prompt action mounted directly above the chat input row.
 *
 * - Click the prompt chip → fills the chat input so the user can edit before sending.
 * - Click the reset (↻) button → picks a new random prompt, different from the current one.
 * - Auto re-rolls on (a) component mount (app reopen) and (b) when `chatResetCounter` increments
 *   (i.e. when the user clicks the header Reset button).
 * - Hidden while the AI is streaming, while journal context is loading, or when the
 *   context is over the model's token limit.
 */
export function SuggestedPrompt() {
  const { t } = useTranslation();
  const {
    chatResetCounter,
    isStreamingChat,
    tokenInfo,
    loadingChatContext,
    showSuggestedPrompt,
    setChatInput,
    chatInputRef,
  } = useChatContext();

  const [currentText, setCurrentText] = useState<string>(() => pickWeightedSeriousOrHumor());

  // Auto re-roll on chat reset (header Reset button).
  // Skip the very first effect run (mount) — that case is already covered by the
  // useState initializer above, which gives a fresh pick on every mount.
  useEffect(() => {
    setCurrentText((prev) => pickWeightedSeriousOrHumor(prev));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chatResetCounter]);

  // Hide while busy, over-limit, or disabled in settings.
  if (!showSuggestedPrompt || isStreamingChat || loadingChatContext || tokenInfo.status === "blocked") {
    return null;
  }

  // Defensive: if everything fails, render nothing.
  if (!currentText) return null;

  const fillPrompt = () => {
    setChatInput(currentText);
    chatInputRef.current?.focus();
  };

  const reroll = () => {
    setCurrentText((prev) => pickWeightedSeriousOrHumor(prev));
  };

  return (
    <div className="flex items-center gap-1.5 px-1 animate-fade-in">
      <button
        type="button"
        onClick={reroll}
        onMouseDown={(e) => e.preventDefault()}
        className="p-1 rounded-md text-text-secondary hover:text-accent-brand hover:bg-bg-surface/40 transition-all cursor-pointer shrink-0 flex items-center justify-center"
        title={t("chatView.suggestedPrompts.resetTooltip")}
      >
        <RefreshCw className="h-3.5 w-3.5" />
      </button>

      <button
        type="button"
        onClick={fillPrompt}
        onMouseDown={(e) => e.preventDefault()}
        className="px-2.5 py-1 rounded-lg border border-border-brand/60 bg-bg-surface/40 text-text-primary text-[11px] font-semibold hover:border-accent-brand hover:bg-accent-brand/10 hover:text-accent-brand transition-all cursor-pointer flex items-center gap-1.5 max-w-[55ch] truncate"
        title={currentText}
      >
        <Sparkles className="h-3 w-3 text-accent-brand/80 shrink-0" />
        <span className="truncate">{currentText}</span>
      </button>
    </div>
  );
}
