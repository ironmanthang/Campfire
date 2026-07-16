import { RefreshCw, Info } from "lucide-react";
import { useTranslation } from "react-i18next";
import { SidebarToggleButton } from "../SidebarToggleButton";
import { DateRangePicker } from "../common/DateRangePicker";
import { ModelSelector } from "../ModelSelector";
import { TokenMeter } from "./TokenMeter";
import { useAppStore } from "../../store/useAppStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { useChatContext } from "../../views/ChatView";

export function ChatHeader() {
  const { t } = useTranslation();

  const { sidebarCollapsed, toggleSidebar } = useAppStore();
  const { activeModel, handleModelChange, chatModels, pinnedModels, togglePinModel } = useOllamaStore();
  
  const {
    chatStartDate,
    setChatStartDate,
    chatEndDate,
    setChatEndDate,
    chatMessages,
    handleResetChat,
    setShowHelpModal,
    tokenInfo,
    loadingChatContext
  } = useChatContext();

  const chatMessagesLength = chatMessages.length;

  return (
    <header className="relative z-20 p-4 border-b border-border-brand bg-bg-surface/50 flex flex-wrap gap-4 items-center justify-between shrink-0">
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-text-secondary">
        <SidebarToggleButton
          sidebarCollapsed={sidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          className="p-1.5"
        />
        <DateRangePicker
          startDate={chatStartDate}
          endDate={chatEndDate}
          onStartChange={setChatStartDate}
          onEndChange={setChatEndDate}
          disabled={chatMessagesLength > 0}
          disabledTooltip={t("chatView.rangeTooltip")}
          labelPrefix={t("chatView.cloneRange")}
        />

        {/* Model Dropdown Selector directly in Chat Header */}
        <div className="flex items-center gap-1.5 ml-2">
          <span>{t("chatView.modelLabel")}</span>
          <ModelSelector
            selectedModel={activeModel}
            onSelectModel={handleModelChange}
            models={chatModels}
            pinnedModels={pinnedModels}
            onTogglePin={togglePinModel}
          />
        </div>

        {/* Reset Chat Button */}
        <button
          onClick={handleResetChat}
          onMouseDown={(e) => e.preventDefault()}
          disabled={chatMessagesLength === 0}
          className="ml-2 px-2.5 py-1 border border-border-brand rounded-lg text-text-secondary hover:text-text-primary hover:bg-bg-app/40 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-text-secondary transition-all flex items-center gap-1.5 font-semibold text-xs cursor-pointer disabled:cursor-not-allowed"
          title={t("chatView.resetTooltip")}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {t("chatView.resetButton")}
        </button>

        {/* Guide Info Button */}
        <button
          type="button"
          onClick={() => setShowHelpModal(true)}
          onMouseDown={(e) => e.preventDefault()}
          className="text-text-secondary hover:text-accent-brand transition-colors p-1 rounded cursor-pointer flex items-center justify-center"
          title={t("chatView.helpTooltip")}
        >
          <Info className="h-4.5 w-4.5" />
        </button>
      </div>

      <TokenMeter
        loadingChatContext={loadingChatContext}
        tokenInfo={tokenInfo}
      />
    </header>
  );
}
