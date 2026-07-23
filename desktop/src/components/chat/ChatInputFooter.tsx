import { Paperclip, FileText, X, Settings, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useChatContext } from "../../views/chat/ChatContext";
import { SuggestedPrompt } from "./SuggestedPrompt";

export function ChatInputFooter() {
  const { t } = useTranslation();

  const {
    chatInput,
    setChatInput,
    draftAttachments,
    handleRemoveAttachment,
    fileInputRef,
    isStreamingChat,
    handleSendChatMessage,
    handleStopChat,
    handlePaste,
    tokenInfo,
    clearAttachments,
    chatInputRef,
    showChatSettings,
    setShowChatSettings
  } = useChatContext();

  const isInputEmpty = !chatInput.trim() && draftAttachments.length === 0;
  const showStopIcon = isStreamingChat && isInputEmpty;

  const onTriggerFileSelect = () => fileInputRef.current?.click();
  const onSend = () => {
    if (isInputEmpty && !isStreamingChat) return;
    handleSendChatMessage(chatInput, draftAttachments, () => {
      clearAttachments();
      setChatInput("");
    });
  };

  return (
    <footer className="p-4 border-t border-border-brand bg-bg-surface/30 shrink-0">
      <div className="mx-auto w-full flex flex-col gap-2.5">
        <SuggestedPrompt />

        {/* Attachment Previews */}
        {draftAttachments.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1 px-1 pb-2 overflow-x-auto max-h-32 scrollbar-thin select-none animate-fade-in">
            {draftAttachments.map((att) => (
              <div
                key={att.id}
                className="relative flex items-center gap-1.5 p-1.5 pr-2.5 bg-bg-surface border border-border-brand/70 rounded-xl text-xs hover:border-accent-brand transition-colors shrink-0 group"
              >
                {att.type === "image" ? (
                  <div className="relative h-8 w-8 rounded-lg overflow-hidden border border-border-brand/40 bg-bg-app shrink-0">
                    <img src={att.previewUrl} alt={att.name} className="h-full w-full object-cover" />
                  </div>
                ) : (
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-brand/10 text-accent-brand shrink-0">
                    <FileText className="h-4.5 w-4.5" />
                  </div>
                )}
                <div className="flex flex-col min-w-0 max-w-[120px]">
                  <span className="font-semibold text-text-primary truncate text-sm" title={att.name}>
                    {att.name}
                  </span>
                  <span className="text-xs text-text-secondary/80">
                    {Math.round(att.size / 102.4) / 10} KB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(att.id)}
                  className="absolute -top-1 -right-1 h-4.5 w-4.5 bg-red-500 text-white rounded-full flex items-center justify-center cursor-pointer shadow opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 scale-90"
                  title="Remove attachment"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2 w-full relative items-center">
          {/* Text Input Box */}
          <div className="flex-1 min-w-0 rounded-xl border border-border-brand bg-bg-input px-3.5 py-2.5 flex items-center focus-within:border-accent-brand focus-within:ring-1 focus-within:ring-accent-brand/35 transition-colors">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (!isInputEmpty) {
                    onSend();
                  }
                }
              }}
              onPaste={handlePaste}
              placeholder={t("chatView.inputPlaceholder")}
              className="w-full bg-transparent border-none outline-none text-text-primary text-sm p-0"
              disabled={tokenInfo.status === "blocked"}
            />
          </div>

          {/* Send / Stop Action Button */}
          <button
            onClick={showStopIcon ? handleStopChat : onSend}
            onMouseDown={(e) => e.preventDefault()}
            disabled={
              (!showStopIcon && isInputEmpty) ||
              tokenInfo.status === "blocked"
            }
            className={`px-4 py-2.5 rounded-xl transition-colors flex items-center justify-center shrink-0 cursor-pointer ${
              showStopIcon
                ? "bg-red-500 hover:bg-rose-600 text-white"
                : "bg-accent-brand text-bg-app hover:bg-accent-brand-hover disabled:opacity-50"
            }`}
            title={showStopIcon ? t("chatView.stopTooltip") : t("chatView.sendTooltip")}
          >
            {showStopIcon ? (
              <div className="h-3.5 w-3.5 bg-current rounded-sm" />
            ) : (
              <Send className="h-4.5 w-4.5" />
            )}
          </button>

          {/* Attachment Button */}
          <button
            type="button"
            onClick={onTriggerFileSelect}
            className="p-2.5 rounded-xl border border-border-brand bg-bg-surface hover:bg-bg-app/40 text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center justify-center shrink-0"
            title={t("chatView.attachTooltip")}
          >
            <Paperclip className="h-4 w-4" />
          </button>

          {/* Chat Settings Trigger */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowChatSettings(true)}
              className={`p-2.5 rounded-xl border border-border-brand bg-bg-surface hover:bg-bg-app/40 text-text-secondary hover:text-text-primary transition-all cursor-pointer flex items-center justify-center shrink-0 ${
                showChatSettings ? "bg-bg-app/60 text-accent-brand border-accent-brand" : ""
              }`}
              title="Chat Settings & Tools"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
