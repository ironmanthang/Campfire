import { useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { MessageSquare, Loader2, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DragHandles } from "../../components/common";
import { ChatMessageBubble } from "../../components/chat";
import { findToolCallInput } from "../../services/tools";
import { useChatContext } from "./ChatContext";

interface ChatMessageListProps {
  visible: boolean;
}

const SCROLL_BOTTOM_THRESHOLD_PX = 40;

export function ChatMessageList({ visible }: ChatMessageListProps) {
  const { t } = useTranslation();
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef<boolean>(true);
  const prevMessageCountRef = useRef<number>(0);
  const prevQueueCountRef = useRef<number>(0);

  const {
    chatMessages,
    isStreamingChat,
    activeToolName,
    messageQueue,
    cancelQueuedMessage,
    chatWidth,
    startDrag,
  } = useChatContext();

  const scrollToBottom = useCallback((behavior: ScrollBehavior = "auto") => {
    const container = chatContainerRef.current;
    if (container) {
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
  }, []);

  const handleChatScroll = () => {
    const container = chatContainerRef.current;
    if (container) {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      isAtBottomRef.current = distanceFromBottom <= SCROLL_BOTTOM_THRESHOLD_PX;
    }
  };

  // Reset to bottom when visibility changes (switching to chat tab)
  useEffect(() => {
    if (visible) {
      isAtBottomRef.current = true;
      scrollToBottom("auto");
    }
  }, [visible, scrollToBottom]);

  // When a new message is sent or added to queue, lock and snap to bottom
  useLayoutEffect(() => {
    const messageAdded = chatMessages.length > prevMessageCountRef.current;
    const queueAdded = messageQueue.length > prevQueueCountRef.current;

    if (messageAdded || queueAdded) {
      isAtBottomRef.current = true;
      scrollToBottom("auto");
    }

    prevMessageCountRef.current = chatMessages.length;
    prevQueueCountRef.current = messageQueue.length;
  }, [chatMessages.length, messageQueue.length, scrollToBottom]);

  // Keep pinned to bottom on any DOM resize (streaming tokens, markdown reflows, tool open/close)
  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const resizeObserver = new ResizeObserver(() => {
      if (isAtBottomRef.current) {
        scrollToBottom("auto");
      }
    });

    resizeObserver.observe(content);
    return () => resizeObserver.disconnect();
  }, [scrollToBottom]);

  // Also catch direct message streaming / state transitions if DOM resize hasn't fired yet
  useEffect(() => {
    if (isAtBottomRef.current && isStreamingChat) {
      scrollToBottom("auto");
    }
  }, [chatMessages, isStreamingChat, scrollToBottom]);

  return (
    <div
      className="flex-1 overflow-y-auto relative"
      ref={chatContainerRef}
      onScroll={handleChatScroll}
    >
      <div
        ref={contentRef}
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
                      <span>{t("chatView.queuedMessage", "Queued Message")}</span>
                    </div>
                    <button
                      onClick={() => cancelQueuedMessage(qIdx)}
                      className="p-1 rounded-lg border border-border-brand/60 bg-bg-surface hover:bg-red-500 hover:text-white text-text-secondary hover:border-red-500 transition-all cursor-pointer shadow-sm flex items-center justify-center shrink-0"
                      title={t("chatView.cancelQueuedMessage", "Cancel Queued Message")}
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
                          className="px-2 py-0.5 rounded bg-bg-app border border-border-brand/40 text-xs text-text-secondary flex items-center gap-1"
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
  );
}
