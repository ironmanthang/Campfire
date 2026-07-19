export interface OllamaToolFunction {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, { type: string; description: string }>;
    required?: string[];
  };
}

export interface OllamaTool {
  type: "function";
  function: OllamaToolFunction;
}

export interface OllamaToolCall {
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

export interface OllamaMessage {
  role: "system" | "user" | "assistant" | "tool";
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

export interface OllamaModelInfo {
  name: string;
  size: number;
  contextLength?: number;
  capabilities?: string[];
  family?: string;
  parentModel?: string;
}

export interface OllamaActiveModelInfo {
  name: string;
  size: number;
  size_vram: number;
  expires_at: string;
}
