import { saveDebugPayload } from "./debug";
import { OLLAMA_BASE_URL } from "../lib/constants";
import { DraftAttachment } from "../types";


export interface OllamaToolFunction {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface OllamaTool {
  type: 'function';
  function: OllamaToolFunction;
}

export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string;
  images?: string[]; // Array of base64-encoded image strings
  thinking?: string;
  displayContent?: string; // shown in the chat bubble; if set, content is only sent to the model
  tool_calls?: OllamaToolCall[];
  tool_call_id?: string;
  name?: string;
  rawInput?: string; // Stored raw text typed by user (for editing messages)
}

export interface PullProgress {
  status: string;
  percentage: number;
}
// Check if Ollama service is running
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/`, { method: 'HEAD' });
    return res.ok;
  } catch (err) {
    return false;
  }
}

export interface OllamaModelInfo {
  name: string;
  size: number;
  contextLength?: number;
  capabilities?: string[];
  family?: string;
  parentModel?: string;
}

// Get list of downloaded models
export async function getDownloadedModels(): Promise<OllamaModelInfo[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    const models: OllamaModelInfo[] = [];

    for (const m of (data.models || [])) {
      let contextLength: number | undefined = undefined;
      let capabilities: string[] | undefined = undefined;
      let family: string | undefined = undefined;
      let parentModel: string | undefined = undefined;

      try {
        const showRes = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: m.name })
        });
        if (showRes.ok) {
          const showData = await showRes.json();
          capabilities = showData.capabilities;
          
          if (showData.details) {
            family = showData.details.family;
            parentModel = showData.details.parent_model;
          }
          
          // 1. Try to find a custom num_ctx parameter set in the model's Modelfile/parameters
          if (showData.parameters) {
            const match = showData.parameters.match(/num_ctx\s+(\d+)/);
            if (match) {
              contextLength = parseInt(match[1], 10);
            }
          }
          
          // 2. If not found in custom parameters, check general model_info
          if (contextLength === undefined && showData.model_info) {
            const keys = Object.keys(showData.model_info);
            const ctxKey = keys.find(k => k.endsWith('.context_length'));
            if (ctxKey) {
              const val = showData.model_info[ctxKey];
              if (typeof val === 'number') {
                contextLength = val;
              }
            }
          }
        }
      } catch (err) {
        console.error(`Failed to show model details for ${m.name}:`, err);
      }

      models.push({
        name: m.name,
        size: m.size || 0,
        contextLength,
        capabilities,
        family,
        parentModel
      });
    }
    return models;
  } catch (err) {
    console.error('Error fetching Ollama models:', err);
    return [];
  }
}

export interface OllamaActiveModelInfo {
  name: string;
  size: number;
  size_vram: number;
  expires_at: string;
}

// Get list of active/loaded models in memory
export async function getActiveModels(): Promise<OllamaActiveModelInfo[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/ps`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.error('Error fetching active Ollama models:', err);
    return [];
  }
}


// Fast heuristic token estimation (1.3 tokens per word for English/code, character scaling for unicode)
export function calculateHeuristicTokens(text: string): number {
  const blocks = text.trim().split(/\s+/);
  if (blocks.length === 1 && blocks[0] === "") return 0;

  let count = 0;
  for (const block of blocks) {
    if (/[^\x00-\x7F]/.test(block)) {
      // Non-ASCII character sets (Unicode blocks like CJK/Emojis usually expand tokens to char count * 1.1)
      count += block.length * 1.1;
    } else {
      // Standard English averages ~1.3 tokens per whitespace-separated word block
      count += 1.35;
    }
  }
  return Math.ceil(count);
}

// Query exact token count from Ollama's tokenizer API
export async function fetchExactTokenCount(model: string, text: string): Promise<number> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tokenize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, content: text }),
    });
    if (!response.ok) return 0;
    const data = await response.json();
    return data.tokens?.length || 0;
  } catch (err) {
    console.error('Tokenizer API failed, falling back to heuristic:', err);
    return calculateHeuristicTokens(text);
  }
}

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
  const chatBody = {
    model,
    messages,
    stream: true,
    options,
    tools
  };

  if (journalDir) {
    // DEBUG: Intercept and save payload to last_sent_payload.json
    try {
      await saveDebugPayload(journalDir, chatBody);
    } catch (e) {
      console.error("Failed to save debug payload in streamAIResponse:", e);
    }
  }

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(chatBody),
    signal
  });

  if (!response.ok) {
    const errText = await response.text();
    // Try to extract just the error field from Ollama's JSON error body
    try {
      const errJson = JSON.parse(errText);
      if (errJson.error) throw new Error(errJson.error);
    } catch (parseErr) {
      if (parseErr instanceof Error && parseErr.message !== errText) throw parseErr;
    }
    throw new Error(errText || 'Failed to stream response from Ollama');
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported on Ollama response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let collectedToolCalls: OllamaToolCall[] = [];

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() !== '') {
          try {
            const parsed = JSON.parse(line);
            // Detect mid-stream server crash (Ollama pushes {"error":"..."} on crash)
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            const content = parsed.message?.content || "";
            const thinking = parsed.message?.thinking || "";
            if (content || thinking) {
              onChunk(content, thinking);
            }
            if (parsed.message?.tool_calls) {
              collectedToolCalls.push(...parsed.message.tool_calls);
            }
          } catch (e) {
            // Re-throw real errors (parsed.error), ignore JSON parse failures
            if (e instanceof Error && !e.message.startsWith('Error parsing')) {
              throw e;
            }
            console.error('Error parsing streaming line JSON:', e);
          }
        }
      }
    }

    // Flush remaining buffer if it contains any valid JSON lines
    if (buffer.trim()) {
      try {
        const parsed = JSON.parse(buffer);
        const content = parsed.message?.content || "";
        const thinking = parsed.message?.thinking || "";
        if (content || thinking) {
          onChunk(content, thinking);
        }
        if (parsed.message?.tool_calls) {
          collectedToolCalls.push(...parsed.message.tool_calls);
        }
      } catch (e) {
        // ignore incomplete JSON at EOF
      }
    }
  } finally {
    reader.releaseLock();
  }

  return collectedToolCalls.length > 0 ? collectedToolCalls : null;
}

// Stream download progress for pulling models from Ollama library
export async function downloadOllamaModel(
  modelName: string,
  onProgress: (progress: PullProgress) => void
): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: modelName,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to trigger download for ${modelName}`);
  }

  if (!response.body) {
    throw new Error('ReadableStream not supported on Ollama response');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() !== '') {
          try {
            const parsed = JSON.parse(line);
            const status = parsed.status || 'Downloading...';
            let percentage = 0;

            if (parsed.total && parsed.completed) {
              percentage = Math.round((parsed.completed / parsed.total) * 100);
            } else if (status === 'success') {
              percentage = 100;
            }

            onProgress({ status, percentage });
          } catch (e) {
            console.error('Error parsing download status JSON:', e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

export function parseMessageContent(msg: OllamaMessage): { cleanPrompt: string; draftAttachments: DraftAttachment[] } {
  const draftAttachments: DraftAttachment[] = [];

  // 1. Recreate image attachments from msg.images
  if (msg.images && msg.images.length > 0) {
    msg.images.forEach((imgBase64, index) => {
      const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
      const size = Math.round((imgBase64.length * 3) / 4);
      draftAttachments.push({
        id,
        name: `Attached Image ${index + 1}.png`,
        size,
        type: "image",
        content: imgBase64,
        previewUrl: `data:image/png;base64,${imgBase64}`
      });
    });
  }

  // 2. Parse text attachments from msg.content
  const textRegex = /\n\n\[Attached File:\s*([^\]]+)\]\n```\n([\s\S]*?)\n```/g;
  let match;
  while ((match = textRegex.exec(msg.content)) !== null) {
    const name = match[1];
    const content = match[2];
    const id = typeof crypto.randomUUID === "function" ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9);
    draftAttachments.push({
      id,
      name,
      size: content.length,
      type: "text",
      content
    });
  }

  // 3. Find the clean text prompt
  let cleanPrompt = "";
  if (msg.rawInput) {
    cleanPrompt = msg.rawInput;
  } else if (msg.displayContent) {
    const idx = msg.displayContent.indexOf("\n\n📎 *");
    cleanPrompt = idx !== -1 ? msg.displayContent.slice(0, idx) : msg.displayContent;
  } else {
    const idx = msg.content.indexOf("\n\n[Attached File:");
    cleanPrompt = idx !== -1 ? msg.content.slice(0, idx) : msg.content;
  }

  return {
    cleanPrompt: cleanPrompt.trim(),
    draftAttachments
  };
}

