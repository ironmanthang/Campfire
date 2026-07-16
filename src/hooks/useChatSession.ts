import { useState, useEffect, useRef, useMemo } from "react";
import { invoke } from "@tauri-apps/api/core";
import { useTranslation } from "react-i18next";
import { ChatSession, DraftAttachment } from "../types";
import { usePersistedState } from "./usePersistedState";
import { getLocalYYYYMMDD } from "../lib/dateUtils";
import { getSystemInstruction } from "../services/prompts";
import {
  OllamaMessage,
  OllamaTool,
  calculateHeuristicTokens,
  fetchExactTokenCount,
  streamAIResponse,
} from "../services/ollama";
import { LOCAL_TOOLS, getWebSearchTool } from "../services/chatTools";
import { executeToolCall } from "../services/toolExecutor";
import { useAppStore } from "../store/useAppStore";
import { useOllamaStore } from "../store/useOllamaStore";

export function useChatSession({ visible }: { visible: boolean }) {
  const { t } = useTranslation();

  const { config, showNotification, setCurrentDate, navigateToView } = useAppStore();
  const { activeModel, handleModelChange, modelsList } = useOllamaStore();

  const [chatStartDate, setChatStartDate] = usePersistedState("chat_filter_start", "2010-01-01");
  const [chatEndDate, setChatEndDate] = usePersistedState("chat_filter_end", getLocalYYYYMMDD);
  const [chatMessages, setChatMessages] = useState<OllamaMessage[]>([]);
  const [isStreamingChat, setIsStreamingChat] = useState(false);
  const [tokenInfo, setTokenInfo] = useState<{ count: number; limit: number; status: "safe" | "warning" | "blocked" }>({
    count: 0,
    limit: 128000,
    status: "safe"
  });

  const chatAbortControllerRef = useRef<AbortController | null>(null);
  const [chatContextText, setChatContextText] = useState("");
  const [loadingChatContext, setLoadingChatContext] = useState(false);
  const [activeToolName, setActiveToolName] = useState<string | null>(null);
  const [enabledTools, setEnabledTools] = usePersistedState("chat_enabled_tools", [
    "get_system_resources",
    "laptop_brightness",
    "read_journal_entries",
    "navigate_to_journal_date",
    "scan_for_garbage"
  ]);
  const [showThinking, setShowThinking] = usePersistedState("chat_show_thinking", true);
  const [collapseToolResponse, setCollapseToolResponse] = usePersistedState("chat_collapse_tool_response", true);
  const [chatSubmissionMode, setChatSubmissionMode] = usePersistedState<"queue" | "interrupt">("chat_submission_mode", "queue");
  const [messageQueue, setMessageQueue] = useState<{ text: string; attachments: DraftAttachment[] }[]>([]);

  const [ollamaConfiguredContextLength, setOllamaConfiguredContextLength] = useState<number | null>(null);

  // Load chat session from Tauri on mount
  useEffect(() => {
    async function loadChatSession() {
      try {
        const savedSession: ChatSession = await invoke("load_chat_history");
        if (savedSession.start_date) setChatStartDate(savedSession.start_date);
        if (savedSession.end_date) setChatEndDate(savedSession.end_date);
        if (savedSession.model) handleModelChange(savedSession.model);
        if (savedSession.messages) {
          setChatMessages(savedSession.messages);
        }
      } catch (err) {
        console.error("Error loading chat history:", err);
      }
    }
    loadChatSession();
  }, []);

  // Load configured context length from local Ollama db.sqlite
  useEffect(() => {
    async function loadOllamaContextLength() {
      try {
        const len = await invoke<number>("get_ollama_context_length");
        if (len > 0) {
          setOllamaConfiguredContextLength(len);
        }
      } catch (err) {
        console.log("Could not read dynamic Ollama context length settings:", err);
      }
    }
    loadOllamaContextLength();
  }, []);

  // Compute capacity limit for the token meter display
  const capacityLimit = useMemo(() => {
    const currentModelInfo = modelsList.find((m) => m.name === activeModel);
    const isCloudModel = currentModelInfo ? currentModelInfo.size === 0 : activeModel.includes("cloud");
    return ollamaConfiguredContextLength || currentModelInfo?.contextLength || (isCloudModel ? 128000 : 8192);
  }, [modelsList, activeModel, ollamaConfiguredContextLength]);

  // Calculate Token volumes in selected ranges
  const checkTokenCapacity = async (context: string) => {
    const heuristicCount = calculateHeuristicTokens(context);
    let count = heuristicCount;
    if (heuristicCount > capacityLimit * 0.8) {
      count = await fetchExactTokenCount(activeModel, context);
    }

    let status: "safe" | "warning" | "blocked" = "safe";
    if (count > capacityLimit) {
      status = "blocked";
    } else if (count > capacityLimit * 0.8) {
      status = "warning";
    }

    setTokenInfo({ count, limit: capacityLimit, status });
    return status !== "blocked";
  };

  // Load context dates context
  useEffect(() => {
    if (!config.journal_dir || !visible || isStreamingChat) return;

    async function loadChatContext() {
      setLoadingChatContext(true);
      try {
        const context = await invoke<string>("get_journal_context", {
          dirPath: config.journal_dir,
          startDate: chatStartDate,
          endDate: chatEndDate
        });
        setChatContextText(context);
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingChatContext(false);
      }
    }
    loadChatContext();
  }, [chatStartDate, chatEndDate, config.journal_dir, visible, isStreamingChat]);

  // Auto-save Chat Session
  useEffect(() => {
    if (!config.journal_dir) return;

    const saveChat = async () => {
      try {
        await invoke("save_chat_history", {
          session: {
            version: 1,
            start_date: chatStartDate,
            end_date: chatEndDate,
            model: activeModel,
            messages: chatMessages
          }
        });
      } catch (err) {
        console.error("Failed to save chat history:", err);
      }
    };

    const timer = setTimeout(saveChat, 1000);
    return () => clearTimeout(timer);
  }, [chatStartDate, chatEndDate, activeModel, chatMessages, config.journal_dir]);

  // Reset chat history
  const handleResetChat = async () => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
    }
    setChatMessages([]);
    try {
      await invoke("save_chat_history", {
        session: {
          version: 1,
          start_date: chatStartDate,
          end_date: chatEndDate,
          model: activeModel,
          messages: []
        }
      });
    } catch (err) {
      console.error("Failed to reset chat history:", err);
      showNotification(t("chatView.errorResetFailed"), "error");
    }
  };

  // Stop current chat streaming
  const handleStopChat = () => {
    if (chatAbortControllerRef.current) {
      chatAbortControllerRef.current.abort();
      chatAbortControllerRef.current = null;
      setIsStreamingChat(false);
    }
  };

  // Send message
  const handleSendChatMessage = async (
    text: string,
    draftAttachments: DraftAttachment[],
    clearAttachments: () => void,
    overrideHistory?: OllamaMessage[]
  ) => {
    let history: OllamaMessage[];

    if (overrideHistory) {
      history = overrideHistory;
    } else {
      if (isStreamingChat) {
        if (chatSubmissionMode === "queue") {
          setMessageQueue((prev) => [...prev, { text, attachments: [...draftAttachments] }]);
          clearAttachments();
          return;
        } else if (chatSubmissionMode === "interrupt") {
          handleStopChat();
        }
      }

      const trimmedText = text.trim();
      if ((!trimmedText && draftAttachments.length === 0) || tokenInfo.status === "blocked") return;

      // Check vision capabilities
      const currentModelInfo = modelsList.find((m) => m.name === activeModel);
      const hasVision = currentModelInfo?.capabilities?.includes("vision");
      const isCloudModel = currentModelInfo ? currentModelInfo.size === 0 : activeModel.includes("cloud");
      const modelSupportsVision = hasVision || isCloudModel;
      const hasAttachedImages = draftAttachments.some((att) => att.type === "image");

      if (hasAttachedImages && !modelSupportsVision) {
        showNotification(t("chatView.warningNoVision"), "error");
      }

      // Process attachments content
      const attachedImages = draftAttachments
        .filter((att) => att.type === "image")
        .map((att) => att.content);

      const textAttachments = draftAttachments.filter((att) => att.type === "text");

      let fullContent = trimmedText;
      textAttachments.forEach((att) => {
        fullContent += `\n\n[Attached File: ${att.name}]\n\`\`\`\n${att.content}\n\`\`\``;
      });

      let displayContent = trimmedText;
      if (draftAttachments.length > 0) {
        const listStr = draftAttachments
          .map((att) => `${att.type === "image" ? "🖼️" : "📄"} ${att.name} (${Math.round(att.size / 102.4) / 10} KB)`)
          .join(", ");
        displayContent += `\n\n📎 *${t("chatView.attachedLabel")} ${listStr}*`;
      }

      const userMsg: OllamaMessage = {
        role: "user",
        content: fullContent,
        displayContent: draftAttachments.length > 0 ? displayContent : undefined,
        images: attachedImages.length > 0 ? attachedImages : undefined,
        rawInput: trimmedText
      };

      history = [...chatMessages, userMsg];
      clearAttachments();
    }

    setChatMessages(history);
    setIsStreamingChat(true);

    const systemInstruction = getSystemInstruction(config.user_name, chatStartDate, chatEndDate, chatContextText, config);

    const cleanHistory = history.filter((msg) => {
      if (msg.role === "assistant" && !msg.content && !msg.thinking && (!msg.tool_calls || msg.tool_calls.length === 0)) return false;
      return true;
    });

    let conversationMessages: OllamaMessage[] = [
      { role: "system", content: systemInstruction },
      ...cleanHistory
    ];

    const activeTools: OllamaTool[] = [];
    const toolMapping: Record<string, string[]> = {
      get_system_resources: ["get_system_resources"],
      laptop_brightness: ["get_laptop_brightness", "set_laptop_brightness"],
      read_journal_entries: ["read_journal_entries"],
      navigate_to_journal_date: ["navigate_to_journal_date"],
      scan_for_garbage: ["scan_for_garbage"],
    };

    for (const [key, toolNames] of Object.entries(toolMapping)) {
      if (enabledTools.includes(key)) {
        toolNames.forEach((name) => {
          const tool = LOCAL_TOOLS.find((t) => t.function.name === name);
          if (tool) activeTools.push(tool);
        });
      }
    }

    if (config.web_search_enabled) {
      activeTools.push(getWebSearchTool());
    }

    const controller = new AbortController();
    chatAbortControllerRef.current = controller;

    try {
      while (true) {
        let fullAnswer = "";
        let fullThinking = "";

        setChatMessages((prev) => [...prev, { role: "assistant" as const, content: "" }]);

        const toolCalls = await streamAIResponse(
          activeModel,
          conversationMessages,
          (chunk, thinkingChunk) => {
            if (chunk) fullAnswer += chunk;
            if (thinkingChunk) fullThinking += thinkingChunk;
            setChatMessages((prev) => {
              const next = [...prev];
              if (next.length > 0) {
                next[next.length - 1] = {
                  role: "assistant",
                  content: fullAnswer,
                  thinking: fullThinking || undefined
                };
              }
              return next;
            });
          },
          undefined,
          controller.signal,
          activeTools,
          config.journal_dir
        );

        if (controller.signal.aborted) {
          break;
        }

        if (!toolCalls || toolCalls.length === 0) {
          break;
        }

        const assistantToolMsg: OllamaMessage = {
          role: "assistant",
          content: fullAnswer,
          thinking: fullThinking || undefined,
          tool_calls: toolCalls
        };
        setChatMessages((prev) => {
          const next = [...prev];
          if (next.length > 0) {
            next[next.length - 1] = assistantToolMsg;
          }
          return next;
        });
        conversationMessages = [...conversationMessages, assistantToolMsg];

        // Execute tool calls sequentially
        for (const tc of toolCalls) {
          setActiveToolName(tc.function.name);
          try {
            const toolMsg = await executeToolCall(tc, {
              config,
              chatStartDate,
              chatEndDate,
              activeModel,
              onNavigateToDate: (date) => {
                setCurrentDate(date);
                navigateToView("journal");
              },
            });
            setChatMessages((prev) => [...prev, toolMsg]);
            conversationMessages = [...conversationMessages, toolMsg];
          } catch (err: any) {
            console.error(`Error running tool ${tc.function.name}:`, err);
          } finally {
            setActiveToolName(null);
          }
        }
      }
    } catch (err: any) {
      if (err.name === "AbortError") {
        console.log("Chat stream aborted by user");
      } else {
        console.error(err);
        const isGgmlCrash = (err.message || "").includes("GGML_SCHED_MAX_SPLIT_INPUTS");
        const friendlyMessage = isGgmlCrash
          ? t("chatView.errorCrashed")
          : err.message || t("chatView.errorFailedResponse");
        showNotification(friendlyMessage, "error");
      }
    } finally {
      setIsStreamingChat(false);
      chatAbortControllerRef.current = null;
      setActiveToolName(null);

      // Clean up empty placeholder if nothing generated
      setChatMessages((prev) => {
        if (prev.length > 0) {
          const lastMsg = prev[prev.length - 1];
          if (lastMsg.role === "assistant" && !lastMsg.content && !lastMsg.thinking) {
            return prev.slice(0, -1);
          }
        }
        return prev;
      });
    }
  };

  const truncateHistory = (index: number): OllamaMessage | null => {
    handleStopChat();
    const targetMsg = chatMessages[index];
    if (!targetMsg || targetMsg.role !== "user") return null;

    // Truncate history (delete everything from index onwards)
    setChatMessages(chatMessages.slice(0, index));
    return targetMsg;
  };

  const cancelQueuedMessage = (index: number) => {
    setMessageQueue((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Dequeue worker useEffect
  useEffect(() => {
    if (!isStreamingChat && messageQueue.length > 0) {
      const [nextMsg, ...remaining] = messageQueue;
      setMessageQueue(remaining);
      handleSendChatMessage(nextMsg.text, nextMsg.attachments, () => {});
    }
  }, [isStreamingChat, messageQueue]);

  return {
    chatStartDate,
    setChatStartDate,
    chatEndDate,
    setChatEndDate,
    chatMessages,
    setChatMessages,
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
  };
}
