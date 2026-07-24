import { OLLAMA_BASE_URL, isTauri } from "../../lib/constants";
import { invoke } from "@tauri-apps/api/core";

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
    let data: any;
    if (isTauri()) {
      data = await invoke<any>("proxy_ollama_tokenize", {
        baseUrl: OLLAMA_BASE_URL,
        payload: { model, content: text },
      });
    } else {
      const response = await fetch(`${OLLAMA_BASE_URL}/api/tokenize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, content: text }),
      });
      if (!response.ok) return 0;
      data = await response.json();
    }
    return data?.tokens?.length || 0;
  } catch (err) {
    console.error("Tokenizer API failed, falling back to heuristic:", err);
    return calculateHeuristicTokens(text);
  }
}
