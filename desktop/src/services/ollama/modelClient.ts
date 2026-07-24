import { OLLAMA_BASE_URL } from "../../lib/constants";
import { OllamaModelInfo, OllamaActiveModelInfo } from "./types";

// Check if Ollama service is running
export async function checkOllamaStatus(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/`);
    return res.ok;
  } catch (err) {
    return false;
  }
}

// Get list of downloaded models with context length and capabilities
export async function getDownloadedModels(): Promise<OllamaModelInfo[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`);
    if (!res.ok) return [];
    const data = await res.json();
    const models: OllamaModelInfo[] = [];

    for (const m of data.models || []) {
      let contextLength: number | undefined = undefined;
      let capabilities: string[] | undefined = undefined;
      let family: string | undefined = undefined;
      let parentModel: string | undefined = undefined;

      try {
        const showRes = await fetch(`${OLLAMA_BASE_URL}/api/show`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: m.name }),
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
            if (match) contextLength = parseInt(match[1], 10);
          }

          // 2. If not found in custom parameters, check general model_info
          if (contextLength === undefined && showData.model_info) {
            const keys = Object.keys(showData.model_info);
            const ctxKey = keys.find((k) => k.endsWith(".context_length"));
            if (ctxKey) {
              const val = showData.model_info[ctxKey];
              if (typeof val === "number") contextLength = val;
            }
          }
        }
      } catch (err) {
        console.error(`Failed to show model details for ${m.name}:`, err);
      }

      models.push({ name: m.name, size: m.size || 0, contextLength, capabilities, family, parentModel });
    }
    return models;
  } catch (err) {
    console.error("Error fetching Ollama models:", err);
    return [];
  }
}

// Get list of active/loaded models in memory
export async function getActiveModels(): Promise<OllamaActiveModelInfo[]> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/ps`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.models || [];
  } catch (err) {
    console.error("Error fetching active Ollama models:", err);
    return [];
  }
}

// Stream download progress for pulling models from Ollama library
export async function downloadOllamaModel(
  modelName: string,
  onProgress: (progress: { status: string; percentage: number }) => void
): Promise<void> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: modelName, stream: true }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(errText || `Failed to trigger download for ${modelName}`);
  }
  if (!response.body) throw new Error("ReadableStream not supported on Ollama response");

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
        if (line.trim() !== "") {
          try {
            const parsed = JSON.parse(line);
            const status = parsed.status || "Downloading...";
            let percentage = 0;
            if (parsed.total && parsed.completed) {
              percentage = Math.round((parsed.completed / parsed.total) * 100);
            } else if (status === "success") {
              percentage = 100;
            }
            onProgress({ status, percentage });
          } catch (e) {
            console.error("Error parsing download status JSON:", e);
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
