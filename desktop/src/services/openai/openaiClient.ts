import { isTauri } from "../../lib/constants";
import { invoke, Channel } from "@tauri-apps/api/core";
import { OllamaMessage, OllamaToolCall } from "../ollama/types";

export async function checkOpenAIStatus(baseUrl: string, apiKey?: string): Promise<boolean> {
  try {
    if (isTauri()) {
      return await invoke<boolean>("check_openai_status", { baseUrl, apiKey });
    }
    const cleanUrl = baseUrl.replace(/\/$/, "");
    const res = await fetch(`${cleanUrl}/models`, {
      headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
    });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export async function getOpenAIModels(baseUrl: string, apiKey?: string): Promise<string[]> {
  try {
    if (isTauri()) {
      const data = await invoke<any>("get_openai_models", { baseUrl, apiKey });
      if (Array.isArray(data?.data)) {
        return data.data.map((m: any) => m.id || m.name).filter(Boolean);
      }
    } else {
      const cleanUrl = baseUrl.replace(/\/$/, "");
      const res = await fetch(`${cleanUrl}/models`, {
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.data)) {
          return data.data.map((m: any) => m.id || m.name).filter(Boolean);
        }
      } else {
        const errBody = await res.text().catch(() => "");
        throw new Error(errBody || `HTTP ${res.status} ${res.statusText}`);
      }
    }
    return [];
  } catch (e: any) {
    console.error("Failed to fetch OpenAI models:", e);
    throw e;
  }
}

export async function streamOpenAIResponse(
  model: string,
  messages: OllamaMessage[],
  onChunk: (text: string, thinkingText?: string) => void,
  baseUrl: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<OllamaToolCall[] | null> {
  // Convert OllamaMessage array to standard OpenAI messages format
  const formattedMessages = messages.map((m, idx) => {
    const msg: any = { role: m.role, content: m.content || "" };
    if (m.name) msg.name = m.name;

    if (m.tool_call_id) {
      msg.tool_call_id = m.tool_call_id;
    }

    if (m.tool_calls && m.tool_calls.length > 0) {
      msg.tool_calls = m.tool_calls.map((tc, tcIdx) => ({
        id: tc.id || `call_tool_${tcIdx}_${Date.now()}`,
        type: "function",
        function: {
          name: tc.function.name,
          arguments: typeof tc.function.arguments === "string"
            ? tc.function.arguments
            : JSON.stringify(tc.function.arguments || {})
        }
      }));
    }

    // If role is tool and tool_call_id is missing, pair it with previous assistant tool_calls
    if (m.role === "tool" && !msg.tool_call_id) {
      for (let i = idx - 1; i >= 0; i--) {
        const prev = messages[i];
        if (prev.role === "assistant" && prev.tool_calls && prev.tool_calls.length > 0) {
          const match = prev.tool_calls.find(t => t.function.name === m.name) || prev.tool_calls[0];
          if (match?.id) {
            msg.tool_call_id = match.id;
            break;
          }
        }
      }
      if (!msg.tool_call_id) {
        msg.tool_call_id = `call_tool_fallback_${idx}`;
      }
    }

    return msg;
  });

  const payload = {
    model,
    messages: formattedMessages,
    stream: true,
  };

  const toolCallsMap: Record<number, { id: string; name: string; args: string }> = {};

  if (isTauri()) {
    const channel = new Channel<any>();

    channel.onmessage = (parsed) => {
      if (signal?.aborted) return;
      if (parsed.error) {
        const err = typeof parsed.error === "string" ? parsed.error : JSON.stringify(parsed.error);
        throw new Error(err);
      }

      const choice = parsed.choices?.[0];
      const delta = choice?.delta;
      if (delta) {
        const content = delta.content || "";
        const thinking = delta.reasoning_content || delta.reasoning || "";
        if (content || thinking) {
          onChunk(content, thinking);
        }

        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const index = tc.index ?? 0;
            if (!toolCallsMap[index]) {
              toolCallsMap[index] = { id: tc.id || `call_${Date.now()}_${index}`, name: "", args: "" };
            }
            if (tc.id) toolCallsMap[index].id = tc.id;
            if (tc.function?.name) toolCallsMap[index].name += tc.function.name;
            if (tc.function?.arguments) toolCallsMap[index].args += tc.function.arguments;
          }
        }
      }
    };

    const invokePromise = invoke("proxy_openai_chat_stream", {
      baseUrl,
      apiKey: apiKey || null,
      payload,
      onChunk: channel,
    });

    if (signal) {
      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }

      await new Promise<void>((resolve, reject) => {
        const onAbort = () => reject(new DOMException("Aborted", "AbortError"));
        signal.addEventListener("abort", onAbort, { once: true });

        invokePromise
          .then(() => resolve())
          .catch((err) => reject(err))
          .finally(() => {
            signal.removeEventListener("abort", onAbort);
          });
      });
    } else {
      await invokePromise;
    }

    const collectedToolCalls: OllamaToolCall[] = Object.values(toolCallsMap).map((tc) => {
      let parsedArgs: Record<string, any> = {};
      try {
        parsedArgs = JSON.parse(tc.args || "{}");
      } catch (e) {
        parsedArgs = {};
      }
      return {
        id: tc.id,
        function: {
          name: tc.name,
          arguments: parsedArgs,
        },
      };
    });

    return collectedToolCalls.length > 0 ? collectedToolCalls : null;
  }

  // Web Browser Fallback
  const cleanUrl = baseUrl.replace(/\/$/, "");
  const chatUrl = cleanUrl.endsWith("/chat/completions") ? cleanUrl : `${cleanUrl}/chat/completions`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (apiKey?.trim()) {
    headers["Authorization"] = `Bearer ${apiKey.trim()}`;
  }

  const response = await fetch(chatUrl, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to stream OpenAI response (HTTP ${response.status})`);
  }

  if (!response.body) {
    throw new Error("ReadableStream not supported on response");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith(":")) continue;

        if (trimmed.startsWith("data: ")) {
          const dataStr = trimmed.slice(6).trim();
          if (dataStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(dataStr);
            const choice = parsed.choices?.[0];
            const delta = choice?.delta;
            if (delta) {
              const content = delta.content || "";
              const thinking = delta.reasoning_content || delta.reasoning || "";
              if (content || thinking) {
                onChunk(content, thinking);
              }

              if (Array.isArray(delta.tool_calls)) {
                for (const tc of delta.tool_calls) {
                  const index = tc.index ?? 0;
                  if (!toolCallsMap[index]) {
                    toolCallsMap[index] = { id: tc.id || `call_${Date.now()}_${index}`, name: "", args: "" };
                  }
                  if (tc.id) toolCallsMap[index].id = tc.id;
                  if (tc.function?.name) toolCallsMap[index].name += tc.function.name;
                  if (tc.function?.arguments) toolCallsMap[index].args += tc.function.arguments;
                }
              }
            }
          } catch (e) {
            // ignore partial JSON parse error
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }

  const collectedToolCalls: OllamaToolCall[] = Object.values(toolCallsMap).map((tc) => {
    let parsedArgs: Record<string, any> = {};
    try {
      parsedArgs = JSON.parse(tc.args || "{}");
    } catch (e) {
      parsedArgs = {};
    }
    return {
      id: tc.id,
      function: {
        name: tc.name,
        arguments: parsedArgs,
      },
    };
  });

  return collectedToolCalls.length > 0 ? collectedToolCalls : null;
}
