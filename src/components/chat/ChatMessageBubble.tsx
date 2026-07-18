import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Sparkles, Terminal, Wrench, Loader2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { OllamaMessage, OllamaToolCall } from "../../services/ollama";
import { useChatContext } from "../../views/chat/ChatContext";

interface ChatMessageBubbleProps {
  msg: OllamaMessage;
  index: number;
  isCurrentlyStreaming: boolean;
  activeToolName: string | null;
  toolCall?: OllamaToolCall | null;
}

export function ChatMessageBubble({
  msg,
  index,
  isCurrentlyStreaming,
  activeToolName,
  toolCall,
}: ChatMessageBubbleProps) {
  const { t } = useTranslation();
  const { showThinking, collapseToolResponse, isStreamingChat, handleInitiateEditMessage } = useChatContext();

  const [localThinkingOpen, setLocalThinkingOpen] = useState(showThinking);
  const [localToolOpen, setLocalToolOpen] = useState(!collapseToolResponse);

  // Sync with global settings when context defaults change
  useEffect(() => {
    setLocalThinkingOpen(showThinking);
  }, [showThinking]);

  useEffect(() => {
    setLocalToolOpen(!collapseToolResponse);
  }, [collapseToolResponse]);

  if (msg.role === "tool") {
    return (
      <div className="flex flex-col items-start w-full my-2 animate-fade-in">
        <div className="w-[85%] bg-bg-surface border border-border-brand/60 rounded-xl p-3 text-xs font-mono">
          <details className="group" open={localToolOpen}>
            <summary
              className="font-semibold text-text-secondary hover:text-text-primary transition-colors flex items-center gap-2 cursor-pointer select-none"
              onClick={(e) => {
                e.preventDefault();
                setLocalToolOpen(!localToolOpen);
              }}
            >
              <Wrench className="h-3.5 w-3.5 text-accent-brand shrink-0" />
              <span>
                Tool Called:{" "}
                <code className="text-accent-brand font-bold bg-bg-app/60 px-1.5 py-0.5 rounded">
                  {msg.name || "Telemetry"}
                </code>
              </span>
            </summary>
            <div className="mt-3 space-y-3">
              {toolCall && (
                <div>
                  <div className="text-[10px] text-text-secondary/60 font-bold uppercase tracking-wider mb-1">
                    Input Arguments:
                  </div>
                  <pre className="text-[11px] text-accent-brand bg-bg-app/60 rounded-lg p-2.5 border border-border-brand/30 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                    {JSON.stringify(toolCall.function.arguments, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <div className="text-[10px] text-text-secondary/60 font-bold uppercase tracking-wider mb-1">
                  Output Response:
                </div>
                <div className="text-[11px] text-text-primary bg-bg-app/40 rounded-lg p-2.5 whitespace-pre-wrap leading-relaxed border border-border-brand/40 overflow-x-auto">
                  {msg.content}
                  {msg.images &&
                    msg.images.map((imgBase64, imgIdx) => (
                      <div
                        key={imgIdx}
                        className="mt-2.5 max-w-sm rounded-xl overflow-hidden border border-border-brand/40 bg-bg-app/80"
                      >
                        <img
                          src={`data:image/jpeg;base64,${imgBase64}`}
                          alt="Image response"
                          className="w-full h-auto object-contain max-h-60"
                        />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </details>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}>
      <div
        className={`p-4 rounded-2xl max-w-[85%] text-sm leading-relaxed ${
          msg.role === "user"
            ? "bg-accent-brand text-bg-app rounded-tr-none font-medium"
            : "bg-bg-surface border border-border-brand rounded-tl-none prose"
        }`}
      >
        {msg.role === "user" ? (
          <div className="relative group/bubble">
            <div className="whitespace-pre-wrap pr-6">{msg.displayContent ?? msg.content}</div>
            {msg.images &&
              msg.images.map((imgBase64, imgIdx) => (
                <div
                  key={imgIdx}
                  className="mt-2 max-w-sm rounded-xl overflow-hidden border border-border-brand/40 bg-bg-app/80"
                >
                  <img
                    src={`data:image/jpeg;base64,${imgBase64}`}
                    alt="User attachment"
                    className="w-full h-auto object-contain max-h-60"
                  />
                </div>
              ))}
            {!isStreamingChat && (
              <button
                onClick={() => handleInitiateEditMessage(index)}
                className="absolute top-0 right-0 p-1.5 rounded-md bg-black/10 text-bg-app hover:bg-black/20 opacity-0 group-hover/bubble:opacity-100 transition-opacity cursor-pointer duration-150 shadow-sm"
                title="Edit Message"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        ) : (
          <>
            {msg.thinking && (
              <details
                open={localThinkingOpen}
                className="mb-3 text-xs bg-bg-app/40 border border-border-brand/40 rounded-lg p-2.5"
              >
                <summary
                  className="font-semibold text-text-secondary flex items-center gap-1.5 cursor-pointer hover:text-text-primary transition-colors select-none"
                  onClick={(e) => {
                    e.preventDefault();
                    setLocalThinkingOpen(!localThinkingOpen);
                  }}
                >
                  <Sparkles className="h-3 w-3 text-accent-brand animate-pulse" />
                  {t("chatView.thoughtProcess")}
                </summary>
                <div className="mt-2 text-[11px] text-text-secondary leading-relaxed font-mono whitespace-pre-wrap pl-2 border-l-2 border-accent-brand/45">
                  {msg.thinking}
                </div>
              </details>
            )}

            {msg.tool_calls && msg.tool_calls.length > 0 && (
              <div className="mb-3 flex flex-wrap gap-1.5 items-center">
                <span className="text-[10px] text-text-secondary font-mono">Invoking tools:</span>
                {msg.tool_calls.map((tc, tcIdx) => (
                  <span
                    key={tcIdx}
                    className="px-2 py-0.5 rounded-md bg-accent-brand/10 border border-accent-brand/20 text-accent-brand text-[10px] font-mono flex items-center gap-1"
                  >
                    <Terminal className="h-3 w-3" />
                    {tc.function.name}
                  </span>
                ))}
              </div>
            )}

            {msg.content ? (
              <ReactMarkdown>{msg.content}</ReactMarkdown>
            ) : !msg.thinking && isCurrentlyStreaming ? (
              <div className="flex items-center gap-2 text-text-secondary py-1 italic font-mono text-xs">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-accent-brand" />
                <span>
                  {(() => {
                    const statusText = activeToolName === "get_system_resources"
                      ? "Checking system hardware..."
                      : activeToolName === "get_laptop_brightness"
                      ? "Reading screen brightness..."
                      : activeToolName === "set_laptop_brightness"
                      ? "Adjusting screen brightness..."
                      : activeToolName === "read_journal_entries"
                      ? "Reading historical journals..."
                      : activeToolName === "navigate_to_journal_date"
                      ? "Navigating to date in Editor..."
                      : activeToolName === "web_search"
                      ? t("chatView.searchingWebStatus")
                      : t("chatView.waitingResponse");

                    if (statusText.endsWith("...")) {
                      return (
                        <>
                          {statusText.slice(0, -3)}
                          <span className="inline-flex gap-0.5 ml-0.5">
                            <span className="animate-dot1">.</span>
                            <span className="animate-dot2">.</span>
                            <span className="animate-dot3">.</span>
                          </span>
                        </>
                      );
                    }
                    return statusText;
                  })()}
                </span>
              </div>
            ) : null}
            {msg.images &&
              msg.images.map((imgBase64, imgIdx) => (
                <div
                  key={imgIdx}
                  className="mt-2 max-w-sm rounded-xl overflow-hidden border border-border-brand/40 bg-bg-app/80"
                >
                  <img
                    src={`data:image/jpeg;base64,${imgBase64}`}
                    alt="Assistant attachment"
                    className="w-full h-auto object-contain max-h-60"
                  />
                </div>
              ))}
          </>
        )}
      </div>
    </div>
  );
}
