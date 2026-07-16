import { useState, useEffect, useRef, useMemo, createContext, useContext } from "react";
import { Paperclip, AlertCircle, MessageSquare, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useResizer } from "../hooks/useResizer";
import { useAutoFocus } from "../hooks/useAutoFocus";
import { useFileAttachments } from "../hooks/useFileAttachments";
import { useChatSession } from "../hooks/useChatSession";
import { DragHandles } from "../components/common";
import {
  ChatHeader,
  ChatMessageBubble,
  ChatInputFooter,
  ChatHelpModal,
  ChatSettingsModal,
  EditConfirmModal
} from "../components/chat";
import { findToolCallInput } from "../services/toolExecutor";
import { getSystemInstruction } from "../services/prompts";
import { useAppStore } from "../store/useAppStore";
import { useOllamaStore } from "../store/useOllamaStore";
import { OllamaMessage, parseMessageContent } from "../services/ollama";
import { DraftAttachment } from "../types";

interface ChatContextType {
  chatStartDate: string;
  setChatStartDate: (date: string) => void;
  chatEndDate: string;
  setChatEndDate: (date: string) => void;
  chatMessages: OllamaMessage[];
  isStreamingChat: boolean;
  tokenInfo: {
    count: number;
    limit: number;
    status: "safe" | "warning" | "blocked";
  };
  activeToolName: string | null;
  enabledTools: string[];
  setEnabledTools: (tools: string[]) => void;
  loadingChatContext: boolean;
  chatContextText: string;
  handleResetChat: () => Promise<void>;
  handleStopChat: () => void;
  handleSendChatMessage: (text: string, draftAttachments: DraftAttachment[], clearAttachments: () => void) => Promise<void>;
  checkTokenCapacity: (context: string) => Promise<boolean>;

  // Attachments
  draftAttachments: DraftAttachment[];
  isDragging: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDragLeave: (e: React.DragEvent<HTMLDivElement>) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  handlePaste: (e: React.ClipboardEvent<HTMLInputElement>) => void;
  handleRemoveAttachment: (id: string) => void;
  clearAttachments: () => void;

  // General layout/inputs
  chatWidth: number;
  startDrag: (e: React.MouseEvent) => void;
  showHelpModal: boolean;
  setShowHelpModal: (show: boolean) => void;
  chatInput: string;
  setChatInput: (input: string) => void;
  chatInputRef: React.RefObject<HTMLInputElement | null>;
  showThinking: boolean;
  setShowThinking: (val: boolean) => void;
  collapseToolResponse: boolean;
  setCollapseToolResponse: (val: boolean) => void;
  showChatSettings: boolean;
  setShowChatSettings: (show: boolean) => void;
  handleInitiateEditMessage: (index: number) => void;
  chatSubmissionMode: "queue" | "interrupt";
  setChatSubmissionMode: (mode: "queue" | "interrupt") => void;
  messageQueue: { text: string; attachments: DraftAttachment[] }[];
  cancelQueuedMessage: (index: number) => void;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChatContext = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within a ChatProvider");
  }
  return context;
};

export function ChatView({ visible }: { visible: boolean }) {
  const { t } = useTranslation();
  const chatInputRef = useRef<HTMLInputElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const shouldScrollToBottomRef = useRef(false);
  const userHasScrolledUpRef = useRef(false);

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
    truncateHistory,
    chatSubmissionMode,
    setChatSubmissionMode,
    messageQueue,
    cancelQueuedMessage,
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

  // Manage UI scrolling states
  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      userHasScrolledUpRef.current = !(container.scrollHeight - container.scrollTop - container.clientHeight < 15);
    }
  };

  useEffect(() => {
    shouldScrollToBottomRef.current = true;
    if (visible && chatContainerRef.current) {
      chatContainerRef.current.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: "auto" });
      userHasScrolledUpRef.current = false;
    }
  }, [visible]);

  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container) return;

    if (shouldScrollToBottomRef.current) {
      const scroll = () => {
        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth",
        });
      };
      scroll();
      setTimeout(scroll, 50);
      shouldScrollToBottomRef.current = false;
      userHasScrolledUpRef.current = false;
    } else if (!userHasScrolledUpRef.current && isStreamingChat) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior: "auto",
      });
    }
  }, [chatMessages, isStreamingChat]);

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
    showChatSettings,
    setShowChatSettings,
    handleInitiateEditMessage,
    chatSubmissionMode,
    setChatSubmissionMode,
    messageQueue,
    cancelQueuedMessage,
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
    showChatSettings,
    setShowChatSettings,
    handleInitiateEditMessage,
    chatSubmissionMode,
    setChatSubmissionMode,
    messageQueue,
    cancelQueuedMessage,
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
        {isDragging && (
          <div
            className="absolute inset-0 z-50 bg-bg-app/75 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-accent-brand m-4 rounded-2xl animate-fade-in text-center p-6 select-none"
            onDragLeave={handleDragLeave}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
          >
            <div className="p-4 rounded-2xl bg-accent-brand/10 text-accent-brand mb-4 scale-110">
              <Paperclip className="h-10 w-10 animate-bounce" />
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-1">
              {t("chatView.dragOverText")}
            </h3>
            <p className="text-xs text-text-secondary max-w-sm leading-relaxed">
              Supports images and any text/source code files. Binary formats are excluded.
            </p>
          </div>
        )}

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
        <div
          className="flex-1 overflow-y-auto relative"
          ref={chatContainerRef}
          onScroll={handleChatScroll}
        >
          <div
            className="relative mx-auto w-full px-6 py-6 min-h-full flex flex-col"
            style={{ maxWidth: `${chatWidth}px` }}
          >
            <DragHandles startDrag={startDrag} />

            {chatMessages.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-text-secondary select-none">
                <MessageSquare className="h-10 w-10 text-border-brand mb-2 animate-bounce" />
                <p className="text-sm font-semibold">{t("chatView.welcomeTitle")}</p>
                <p className="text-xs max-w-xs mt-1 leading-relaxed">
                  {t("chatView.welcomeDesc")}
                </p>
              </div>
            ) : (
              <div className="space-y-4 w-full">
                {chatMessages.map((msg, idx) => {
                  const isPlaceholder = msg.role === "assistant" && !msg.content && !msg.thinking;
                  const isCurrentlyStreaming = isStreamingChat && idx === chatMessages.length - 1;
                  if (isPlaceholder && !isCurrentlyStreaming) {
                    return null;
                  }

                  const toolCall = msg.role === "tool" ? findToolCallInput(chatMessages, idx) : null;

                  return (
                    <ChatMessageBubble
                      key={idx}
                      msg={msg}
                      index={idx}
                      isCurrentlyStreaming={isCurrentlyStreaming}
                      activeToolName={activeToolName}
                      toolCall={toolCall}
                    />
                  );
                })}
                {/* Render Queued Prompts */}
                {messageQueue.map((queued, qIdx) => (
                  <div
                    key={`queued-${qIdx}`}
                    className="flex flex-col items-end animate-fade-in"
                  >
                    <div className="p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed bg-bg-surface/50 border border-dashed border-border-brand/60 rounded-tr-none relative group/queued opacity-75 animate-fade-in">
                      <div className="flex items-center justify-between gap-6 text-xs font-semibold text-text-secondary mb-2.5 select-none">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand shrink-0" />
                          <span>Queued Message</span>
                        </div>
                        <button
                          onClick={() => cancelQueuedMessage(qIdx)}
                          className="p-1 rounded-lg border border-border-brand/60 bg-bg-surface hover:bg-red-500 hover:text-white text-text-secondary hover:border-red-500 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                          title="Cancel Queued Message"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="whitespace-pre-wrap text-text-secondary">{queued.text}</div>
                      {queued.attachments.length > 0 && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 select-none">
                          {queued.attachments.map((att) => (
                            <span
                              key={att.id}
                              className="px-2 py-0.5 rounded bg-bg-app border border-border-brand/40 text-[10px] text-text-secondary flex items-center gap-1"
                            >
                              {att.type === "image" ? "🖼️" : "📄"} {att.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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
