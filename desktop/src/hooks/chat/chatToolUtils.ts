import { OllamaTool, OllamaMessage } from "../../services/ollama";
import { LOCAL_TOOLS, getWebSearchTool, getWebFetchTool } from "../../services/tools";
import { AppConfig, DraftAttachment } from "../../types";

export function buildUserChatMessage(
  trimmedText: string,
  draftAttachments: DraftAttachment[],
  attachedLabel: string
): OllamaMessage {
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
    displayContent += `\n\n📎 *${attachedLabel} ${listStr}*`;
  }

  return {
    role: "user",
    content: fullContent,
    displayContent: draftAttachments.length > 0 ? displayContent : undefined,
    images: attachedImages.length > 0 ? attachedImages : undefined,
    rawInput: trimmedText,
  };
}


export function getActiveChatTools(
  enabledTools: string[],
  config: AppConfig
): OllamaTool[] {
  const activeTools: OllamaTool[] = [];
  const toolMapping: Record<string, string[]> = {
    get_system_resources: ["get_system_resources"],
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
    const hasExplicitWebToolsConfig =
      enabledTools.includes("web_search") || enabledTools.includes("web_fetch");
    if (!hasExplicitWebToolsConfig || enabledTools.includes("web_search")) {
      activeTools.push(getWebSearchTool());
    }
    if (!hasExplicitWebToolsConfig || enabledTools.includes("web_fetch")) {
      activeTools.push(getWebFetchTool());
    }
  }

  return activeTools;
}

export function formatChatError(
  err: any,
  t: (key: any) => string
): { isAbort: boolean; friendlyMessage: string } {
  const isAbort =
    err?.name === "AbortError" ||
    err === "AbortError" ||
    err?.message === "Aborted";

  if (isAbort) {
    return { isAbort: true, friendlyMessage: "" };
  }

  const errMsg = typeof err === "string" ? err : err?.message || String(err || "");

  let extractedError = errMsg;
  if (errMsg.includes('{"error":')) {
    try {
      const jsonStr = errMsg.substring(errMsg.indexOf("{"));
      const parsed = JSON.parse(jsonStr);
      if (parsed.error) {
        extractedError = parsed.error;
      }
    } catch {
      // Keep errMsg
    }
  }

  const isContextTooLong = extractedError.includes("GGML_SCHED_MAX_SPLIT_INPUTS");
  const isProcessCrash =
    extractedError.includes("GGML_ASSERT") ||
    extractedError.includes("0xc0000409") ||
    extractedError.includes("0xc0000005") ||
    extractedError.includes("stack-based buffer") ||
    extractedError.includes("llama-server process has terminated");

  let friendlyMessage: string;
  if (isContextTooLong) {
    friendlyMessage = t("chatView.errorCrashed");
  } else if (isProcessCrash) {
    friendlyMessage = t("chatView.errorProcessCrashed");
  } else {
    friendlyMessage = extractedError || t("chatView.errorFailedResponse");
  }

  return { isAbort: false, friendlyMessage };
}
