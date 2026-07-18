import { useState, useEffect, useRef, useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResizer } from "../../hooks/useResizer";
import { useAutoFocus } from "../../hooks/useAutoFocus";
import { useFileAttachments } from "../../hooks/useFileAttachments";
import { useChatSession } from "../../hooks/chat/useChatSession";
import {
  ChatHeader,
  ChatHelpModal,
  ChatSettingsModal,
  EditConfirmModal,
  ChatInputFooter
} from "../../components/chat";
import { getSystemInstruction } from "../../services/prompts";
import { useAppStore } from "../../store/useAppStore";
import { useOllamaStore } from "../../store/useOllamaStore";
import { parseMessageContent } from "../../services/ollama";
import { ChatContext, ChatContextType } from "./ChatContext";
import { ChatDragOverlay } from "./ChatDragOverlay";
import { ChatMessageList } from "./ChatMessageList";

export function ChatView({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  const chatInputRef = useRef<HTMLInputElement>(null);

  const { config, showNotification } = useAppStore();
  const { activeModel } = useOllamaStore();

  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showChatSettings, setShowChatSettings] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [confirmEditIndex, setConfirmEditIndex] = useState<number | null>(null);

  // Hook 1: Layout resizing
  const [chatWidth, startDrag] = useResizer({
    key: "chat_width",
    defaultVal: 768,
    mode: "px",
  });

  // Hook 2: Chat Logic State & API Workflows
  const chatSession = useChatSession({ visible });
  const {
    chatStartDate,
    setChatStartDate,
    chatEndDate,
    setChatEndDate,
    chatMessages,
    isStreamingChat,
    tokenInfo,
    activeToolName,
    enabledTools,
    setEnabledTools,
    loadingChatContext,
    chatContextText,
    handleResetChat,
    handleStopChat,
    handleSendChatMessage,
    checkTokenCapacity,
    showThinking,
    setShowThinking,
    collapseToolResponse,
    setCollapseToolResponse,
    showSuggestedPrompt,
    setShowSuggestedPrompt,
    truncateHistory,
    chatSubmissionMode,
    setChatSubmissionMode,
    messageQueue,
    cancelQueuedMessage,
    chatResetCounter,
  } = chatSession;

  // Hook 3: Drag, Drop, Paste and Select File Attachments
  const {
    draftAttachments,
    setDraftAttachments,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleRemoveAttachment,
    handlePaste,
    clearAttachments,
  } = useFileAttachments({
    showNotification,
  });

  const handleLoadMessageToInput = (index: number) => {
    const targetMsg = truncateHistory(index);
    if (!targetMsg) return;

    const { cleanPrompt, draftAttachments: parsedAttachments } = parseMessageContent(targetMsg);

    setChatInput(cleanPrompt);
    setDraftAttachments(parsedAttachments);

    if (chatInputRef.current) {
      chatInputRef.current.focus();
    }
  };

  const handleInitiateEditMessage = (index: number) => {
    setConfirmEditIndex(index);
  };

  // Autofocus the chat input on load/view transition
  useAutoFocus(chatInputRef, visible && !isStreamingChat, [activeModel, chatStartDate, chatEndDate]);

  // Sync token volume dynamically whenever input, attachments, or session content changes
  useEffect(() => {
    if (loadingChatContext) return;

    const calculateTotalTokens = async () => {
      const systemInstruction = getSystemInstruction(config.user_name, chatStartDate, chatEndDate, chatContextText, config);
      const historyText = chatMessages.map((m) => `${m.role}: ${m.content}`).join("\n");

      let attachmentsText = "";
      draftAttachments.forEach((att) => {
        if (att.type === "text") {
          attachmentsText += `\n[Attached File: ${att.name}]\n\`\`\`\n${att.content}\n\`\`\`\n`;
        }
      });

      const fullPrompt = `${systemInstruction}\n${historyText}\n${chatInput}\n${attachmentsText}`;
      await checkTokenCapacity(fullPrompt);
    };

    if (!isStreamingChat) {
      calculateTotalTokens();
    }
  }, [
    chatContextText,
    chatMessages,
    activeModel,
    isStreamingChat,
    chatStartDate,
    chatEndDate,
    config.user_name,
    loadingChatContext,
    chatInput,
    draftAttachments,
  ]);

  const chatContextValue = useMemo<ChatContextType>(() => ({
    chatStartDate,
    setChatStartDate,
    chatEndDate,
    setChatEndDate,
    chatMessages,
    isStreamingChat,
    tokenInfo,
    activeToolName,
    enabledTools,
    setEnabledTools,
    loadingChatContext,
    chatContextText,
    handleResetChat,
    handleStopChat,
    handleSendChatMessage,
    checkTokenCapacity,

    draftAttachments,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    handleRemoveAttachment,
    clearAttachments,

    chatWidth,
    startDrag,
    showHelpModal,
    setShowHelpModal,
    chatInput,
    setChatInput,
    chatInputRef,
    showThinking,
    setShowThinking,
    collapseToolResponse,
    setCollapseToolResponse,
    showSuggestedPrompt,
    setShowSuggestedPrompt,
    showChatSettings,
    setShowChatSettings,
    handleInitiateEditMessage,
    chatSubmissionMode,
    setChatSubmissionMode,
    messageQueue,
    cancelQueuedMessage,
    chatResetCounter,
  }), [
    chatStartDate,
    setChatStartDate,
    chatEndDate,
    setChatEndDate,
    chatMessages,
    isStreamingChat,
    tokenInfo,
    activeToolName,
    enabledTools,
    setEnabledTools,
    loadingChatContext,
    chatContextText,
    handleResetChat,
    handleStopChat,
    handleSendChatMessage,
    checkTokenCapacity,

    draftAttachments,
    isDragging,
    fileInputRef,
    handleFileSelect,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handlePaste,
    handleRemoveAttachment,
    clearAttachments,

    chatWidth,
    startDrag,
    showHelpModal,
    setShowHelpModal,
    chatInput,
    setChatInput,
    showThinking,
    setShowThinking,
    collapseToolResponse,
    setCollapseToolResponse,
    showSuggestedPrompt,
    setShowSuggestedPrompt,
    showChatSettings,
    setShowChatSettings,
    handleInitiateEditMessage,
    chatSubmissionMode,
    setChatSubmissionMode,
    messageQueue,
    cancelQueuedMessage,
    chatResetCounter,
  ]);

  return (
    <ChatContext.Provider value={chatContextValue}>
      <div
        className="flex-1 flex flex-col overflow-hidden bg-bg-app relative"
        onDragOver={handleDragOver}
      >
        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          accept="image/*,.g4,.md,.tsx,.ts,.js,.jsx,.json,.txt,.py,.rs,.css,.html,.yaml,.yml,.toml,.sh,.bat,.ini,.cfg,.xml"
          className="hidden"
        />

        {/* Glassmorphic Drag Overlay */}
        <ChatDragOverlay />

        {/* Chat Config Header */}
        <ChatHeader />

        {/* Token Block Banner */}
        {tokenInfo.status === "blocked" && (
          <div className="bg-red-950/15 border-b border-red-500/30 p-3 text-xs text-red-200 flex items-center gap-2 shrink-0 select-none animate-fade-in">
            <AlertCircle className="h-4.5 w-4.5 text-red-400 shrink-0" />
            <span>
              <strong>{t("chatView.warningPrefix")}</strong>: {t("chatView.warningBanner")}
            </span>
          </div>
        )}

        {/* Chat Log Message area */}
        <ChatMessageList visible={visible} />

        {/* Chat Input Console */}
        <ChatInputFooter />

        {showChatSettings && <ChatSettingsModal onClose={() => setShowChatSettings(false)} />}
        {showHelpModal && <ChatHelpModal onClose={() => setShowHelpModal(false)} />}
        {confirmEditIndex !== null && (
          <EditConfirmModal
            onCancel={() => setConfirmEditIndex(null)}
            onConfirm={() => {
              handleLoadMessageToInput(confirmEditIndex);
              setConfirmEditIndex(null);
            }}
          />
        )}
      </div>
    </ChatContext.Provider>
  );
}
