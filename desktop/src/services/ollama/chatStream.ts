import { OLLAMA_BASE_URL, isTauri } from "../../lib/constants";
import { invoke, Channel } from "@tauri-apps/api/core";
import { saveDebugPayload } from "../debug";
import { OllamaMessage, OllamaTool, OllamaToolCall } from "./types";

// Stream chat response from local Ollama service
export async function streamAIResponse(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string, thinkingText?: string) => void,
  options?: { num_ctx?: number },
  signal?: AbortSignal,
  tools?: OllamaTool[],
  journalDir?: string
): Promise<OllamaToolCall[] | null> {
  const chatBody = { model, messages, stream: true, options, tools };

  if (journalDir) {
    try {
      await saveDebugPayload(journalDir, chatBody);
    } catch (e) {
      console.error("Failed to save debug payload in streamAIResponse:", e);
    }
  }

  if (isTauri()) {
    const channel = new Channel<any>();
    const collectedToolCalls: OllamaToolCall[] = [];

    channel.onmessage = (parsed) => {
      if (parsed.error) throw new Error(parsed.error);
      const content = parsed.message?.content || "";
      const thinking = parsed.message?.thinking || "";
      if (content || thinking) onChunk(content, thinking);
      if (parsed.message?.tool_calls) {
        collectedToolCalls.push(...parsed.message.tool_calls);
      }
    };

    await invoke("proxy_ollama_chat_stream", {
      baseUrl: OLLAMA_BASE_URL,
      payload: chatBody,
      onChunk: channel,
    });

    return collectedToolCalls.length > 0 ? collectedToolCalls : null;
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(chatBody),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error) throw new Error(errJson.error);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== errText) throw parseErr;
    }
    throw new Error(errText || "Failed to stream response from Ollama");
  }

  if (!response.body) throw new Error("ReadableStream not supported on Ollama response");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let collectedToolCalls: OllamaToolCall[] = [];

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.trim() !== "") {
          try {
            const parsed = JSON.parse(line);
            if (parsed.error) throw new Error(parsed.error);

            const content = parsed.message?.content || "";
            const thinking = parsed.message?.thinking || "";
            if (content || thinking) onChunk(content, thinking);
            if (parsed.message?.tool_calls) {
              collectedToolCalls.push(...parsed.message.tool_calls);
            }
          } catch (e) {
            if (e instanceof Error && !e.message.startsWith("Error parsing")) throw e;
            console.error("Error parsing streaming line JSON:", e);
          }
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        const content = parsed.message?.content || "";
        const thinking = parsed.message?.thinking || "";
        if (content || thinking) onChunk(content, thinking);
        if (parsed.message?.tool_calls) collectedToolCalls.push(...parsed.message.tool_calls);
      } catch (e) {
        // ignore incomplete JSON at EOF
      }
    }
  } finally {
    reader.releaseLock();
  }

  return collectedToolCalls.length > 0 ? collectedToolCalls : null;
}
